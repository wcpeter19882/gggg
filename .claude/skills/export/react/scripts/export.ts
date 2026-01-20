/**
 * Export Script
 * 
 * Generates static HTML export from MDX presentations.
 * Supports both multi-page and single-file export modes.
 * 
 * Features:
 * - Single HTML file bundling (inline CSS/JS)
 * - Image asset handling (base64 inline or copy)
 * - Progress reporting
 * - Size validation (<500KB target)
 * 
 * Usage:
 *   npx ts-node scripts/export.ts --input presentation.mdx --output dist/
 *   npx ts-node scripts/export.ts --input presentation.mdx --output single.html --single
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

// =============================================================================
// Constants
// =============================================================================

/** Target max size for HTML export (excluding images) - 500KB */
const MAX_HTML_SIZE = 500 * 1024;

/** Max size for inline base64 images - 100KB per image */
const MAX_INLINE_IMAGE_SIZE = 100 * 1024;

/** Supported image extensions for inlining */
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'];

// =============================================================================
// Types
// =============================================================================

interface ExportOptions {
  /** Input MDX file or directory */
  input: string;
  /** Output directory or file */
  output: string;
  /** Export as single HTML file */
  single?: boolean;
  /** Theme override */
  theme?: string;
  /** Inline all images as base64 */
  inlineImages?: boolean;
  /** Verbose output */
  verbose?: boolean;
  /** Progress callback */
  onProgress?: (step: string, progress: number) => void;
}

interface ExportResult {
  success: boolean;
  outputPath: string;
  /** Total size in bytes */
  size: number;
  /** HTML size (excluding images) */
  htmlSize: number;
  /** Image assets size */
  imageSize: number;
  duration: number;
  /** Whether size is under limit */
  sizeValid: boolean;
  error?: string;
}

type ProgressCallback = (step: string, progress: number) => void;

// =============================================================================
// Export Functions
// =============================================================================

/**
 * Report progress
 */
function reportProgress(
  onProgress: ProgressCallback | undefined,
  step: string,
  progress: number,
  verbose?: boolean
): void {
  if (onProgress) {
    onProgress(step, progress);
  }
  if (verbose) {
    const bar = '█'.repeat(Math.floor(progress / 5)) + '░'.repeat(20 - Math.floor(progress / 5));
    console.log(`[${bar}] ${progress}% - ${step}`);
  }
}

/**
 * Run Next.js static export
 */
async function runNextExport(
  options: ExportOptions,
  onProgress?: ProgressCallback
): Promise<void> {
  const { verbose } = options;
  
  reportProgress(onProgress, 'Running Next.js build...', 10, verbose);
  
  try {
    const { stdout, stderr } = await execAsync('npm run build', {
      cwd: path.resolve(__dirname, '..'),
    });
    
    reportProgress(onProgress, 'Build complete', 40, verbose);
    
    if (verbose) {
      console.log(stdout);
      if (stderr) console.error(stderr);
    }
  } catch (error) {
    throw new Error(`Next.js build failed: ${error}`);
  }
}

/**
 * Convert image to base64 data URL
 */
async function imageToBase64(imagePath: string): Promise<string> {
  const ext = path.extname(imagePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
  };
  
  const mimeType = mimeTypes[ext] || 'application/octet-stream';
  const buffer = await fs.readFile(imagePath);
  const base64 = buffer.toString('base64');
  
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Inline images in HTML content
 */
async function inlineImagesInHtml(
  html: string,
  baseDir: string,
  onProgress?: ProgressCallback,
  verbose?: boolean
): Promise<{ html: string; inlinedSize: number; copiedImages: string[] }> {
  const imgRegex = /<img[^>]*src="([^"]+)"[^>]*>/g;
  const cssUrlRegex = /url\(['"]?([^'")]+)['"]?\)/g;
  
  let inlinedSize = 0;
  const copiedImages: string[] = [];
  let processedHtml = html;
  
  // Process <img> tags
  let match;
  const imgMatches: Array<{ full: string; src: string }> = [];
  while ((match = imgRegex.exec(html)) !== null) {
    imgMatches.push({ full: match[0], src: match[1] });
  }
  
  for (const { full, src } of imgMatches) {
    if (src.startsWith('data:') || src.startsWith('http://') || src.startsWith('https://')) {
      continue; // Skip already inlined or external images
    }
    
    const imagePath = path.join(baseDir, src.replace(/^\//, ''));
    const ext = path.extname(imagePath).toLowerCase();
    
    if (!IMAGE_EXTENSIONS.includes(ext)) {
      continue;
    }
    
    try {
      const stats = await fs.stat(imagePath);
      
      if (stats.size <= MAX_INLINE_IMAGE_SIZE) {
        // Inline as base64
        const dataUrl = await imageToBase64(imagePath);
        processedHtml = processedHtml.replace(
          full,
          full.replace(src, dataUrl)
        );
        inlinedSize += stats.size;
        
        if (verbose) {
          console.log(`  ✓ Inlined: ${src} (${formatSize(stats.size)})`);
        }
      } else {
        // Too large to inline, will need to copy
        copiedImages.push(src);
        if (verbose) {
          console.log(`  → Copy: ${src} (${formatSize(stats.size)} - too large to inline)`);
        }
      }
    } catch {
      if (verbose) {
        console.warn(`  ⚠ Not found: ${src}`);
      }
    }
  }
  
  return { html: processedHtml, inlinedSize, copiedImages };
}

/**
 * Bundle into single HTML file with progress reporting
 */
async function bundleSingleFile(
  exportDir: string, 
  outputPath: string,
  options: ExportOptions
): Promise<{ size: number; htmlSize: number; imageSize: number }> {
  const { verbose, onProgress, inlineImages } = options;
  
  reportProgress(onProgress, 'Reading HTML template...', 50, verbose);
  
  // Read the main HTML file
  const indexPath = path.join(exportDir, 'index.html');
  let html = await fs.readFile(indexPath, 'utf-8');
  
  // Find all script and style references
  const scriptRegex = /<script[^>]*src="([^"]+)"[^>]*><\/script>/g;
  const styleRegex = /<link[^>]*href="([^"]+\.css)"[^>]*>/g;
  
  reportProgress(onProgress, 'Inlining scripts...', 60, verbose);
  
  // Inline scripts
  let match;
  const scriptMatches: Array<{ full: string; src: string }> = [];
  while ((match = scriptRegex.exec(html)) !== null) {
    scriptMatches.push({ full: match[0], src: match[1] });
  }
  
  for (const { full, src } of scriptMatches) {
    const scriptPath = path.join(exportDir, src.replace(/^\//, ''));
    
    try {
      const scriptContent = await fs.readFile(scriptPath, 'utf-8');
      html = html.replace(
        full, 
        `<script>${scriptContent}</script>`
      );
      if (verbose) {
        console.log(`  ✓ Inlined script: ${src}`);
      }
    } catch {
      console.warn(`  ⚠ Could not inline script: ${src}`);
    }
  }
  
  reportProgress(onProgress, 'Inlining styles...', 70, verbose);
  
  // Inline styles
  const styleMatches: Array<{ full: string; href: string }> = [];
  while ((match = styleRegex.exec(html)) !== null) {
    styleMatches.push({ full: match[0], href: match[1] });
  }
  
  for (const { full, href } of styleMatches) {
    const stylePath = path.join(exportDir, href.replace(/^\//, ''));
    
    try {
      const styleContent = await fs.readFile(stylePath, 'utf-8');
      html = html.replace(
        full, 
        `<style>${styleContent}</style>`
      );
      if (verbose) {
        console.log(`  ✓ Inlined style: ${href}`);
      }
    } catch {
      console.warn(`  ⚠ Could not inline style: ${href}`);
    }
  }
  
  // Handle images
  let imageSize = 0;
  
  if (inlineImages !== false) {
    reportProgress(onProgress, 'Processing images...', 80, verbose);
    
    const imageResult = await inlineImagesInHtml(html, exportDir, onProgress, verbose);
    html = imageResult.html;
    imageSize = imageResult.inlinedSize;
  }
  
  reportProgress(onProgress, 'Writing output file...', 90, verbose);
  
  // Write the bundled file
  await fs.writeFile(outputPath, html, 'utf-8');
  
  const stats = await fs.stat(outputPath);
  const htmlSize = stats.size - imageSize;
  
  reportProgress(onProgress, 'Export complete!', 100, verbose);
  
  return { size: stats.size, htmlSize, imageSize };
}

/**
 * Copy export directory to output location with progress reporting
 */
async function copyExportDir(
  exportDir: string, 
  outputDir: string,
  options: ExportOptions
): Promise<{ size: number; htmlSize: number; imageSize: number }> {
  const { verbose, onProgress } = options;
  
  reportProgress(onProgress, 'Creating output directory...', 50, verbose);
  
  // Create output directory
  await fs.mkdir(outputDir, { recursive: true });
  
  // Collect all files first
  const allFiles: string[] = [];
  const collectFiles = async (dir: string): Promise<void> => {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await collectFiles(fullPath);
      } else {
        allFiles.push(fullPath);
      }
    }
  };
  
  await collectFiles(exportDir);
  
  let htmlSize = 0;
  let imageSize = 0;
  let processedFiles = 0;
  
  // Copy all files recursively with progress
  const copyRecursive = async (src: string, dest: string): Promise<void> => {
    const stats = await fs.stat(src);
    
    if (stats.isDirectory()) {
      await fs.mkdir(dest, { recursive: true });
      const files = await fs.readdir(src);
      await Promise.all(
        files.map(file => copyRecursive(
          path.join(src, file),
          path.join(dest, file)
        ))
      );
    } else {
      await fs.copyFile(src, dest);
      processedFiles++;
      
      // Categorize file size
      const ext = path.extname(src).toLowerCase();
      if (IMAGE_EXTENSIONS.includes(ext)) {
        imageSize += stats.size;
      } else {
        htmlSize += stats.size;
      }
      
      // Report progress
      const progress = 50 + Math.floor((processedFiles / allFiles.length) * 45);
      reportProgress(onProgress, `Copying ${path.basename(src)}...`, progress, verbose);
    }
  };
  
  await copyRecursive(exportDir, outputDir);
  
  reportProgress(onProgress, 'Export complete!', 100, verbose);
  
  return { size: htmlSize + imageSize, htmlSize, imageSize };
}

/**
 * Main export function
 */
export async function exportPresentation(
  options: ExportOptions
): Promise<ExportResult> {
  const startTime = Date.now();
  const exportDir = path.resolve(__dirname, '..', 'out');
  const { onProgress, verbose } = options;
  
  try {
    reportProgress(onProgress, 'Starting export...', 0, verbose);
    
    // Run Next.js export
    await runNextExport(options, onProgress);
    
    let outputPath: string;
    let size: number;
    let htmlSize: number;
    let imageSize: number;
    
    if (options.single) {
      // Bundle into single file
      outputPath = options.output.endsWith('.html') 
        ? options.output 
        : path.join(options.output, 'presentation.html');
      
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      const result = await bundleSingleFile(exportDir, outputPath, options);
      size = result.size;
      htmlSize = result.htmlSize;
      imageSize = result.imageSize;
    } else {
      // Copy export directory
      outputPath = options.output;
      const result = await copyExportDir(exportDir, outputPath, options);
      size = result.size;
      htmlSize = result.htmlSize;
      imageSize = result.imageSize;
    }
    
    const duration = Date.now() - startTime;
    const sizeValid = htmlSize <= MAX_HTML_SIZE;
    
    return {
      success: true,
      outputPath,
      size,
      htmlSize,
      imageSize,
      duration,
      sizeValid,
    };
  } catch (error) {
    return {
      success: false,
      outputPath: options.output,
      size: 0,
      htmlSize: 0,
      imageSize: 0,
      duration: Date.now() - startTime,
      sizeValid: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Format file size for display
 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Format duration for display
 */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

// =============================================================================
// CLI
// =============================================================================

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  // Parse arguments
  const options: ExportOptions = {
    input: '',
    output: './dist',
    single: false,
    inlineImages: true,
    verbose: false,
  };
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--input':
      case '-i':
        options.input = args[++i];
        break;
      case '--output':
      case '-o':
        options.output = args[++i];
        break;
      case '--single':
      case '-s':
        options.single = true;
        break;
      case '--theme':
      case '-t':
        options.theme = args[++i];
        break;
      case '--inline-images':
        options.inlineImages = true;
        break;
      case '--no-inline-images':
        options.inlineImages = false;
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--help':
      case '-h':
        console.log(`
React MDX Export Script

Usage:
  npx ts-node scripts/export.ts [options]

Options:
  -i, --input <path>     Input MDX file or directory
  -o, --output <path>    Output directory or file (default: ./dist)
  -s, --single           Export as single HTML file
  -t, --theme <name>     Theme override
  --inline-images        Inline small images as base64 (default: true)
  --no-inline-images     Copy images as separate files
  -v, --verbose          Verbose output with progress
  -h, --help             Show help

Examples:
  # Export to directory
  npx ts-node scripts/export.ts -i slides.mdx -o ./dist

  # Export to single file
  npx ts-node scripts/export.ts -i slides.mdx -o presentation.html --single

  # Export without inlining images
  npx ts-node scripts/export.ts -i slides.mdx -o ./dist --no-inline-images

Size Validation:
  Target: HTML content should be under 500KB (excluding images)
  Images under 100KB are inlined by default, larger ones are copied
`);
        process.exit(0);
    }
  }
  
  console.log('🚀 Starting export...\n');
  
  const result = await exportPresentation(options);
  
  if (result.success) {
    console.log('\n✅ Export complete!');
    console.log(`   Output: ${result.outputPath}`);
    console.log(`   Total Size: ${formatSize(result.size)}`);
    console.log(`   HTML/JS/CSS: ${formatSize(result.htmlSize)}`);
    console.log(`   Images: ${formatSize(result.imageSize)}`);
    console.log(`   Duration: ${formatDuration(result.duration)}`);
    
    // Size validation feedback
    if (result.sizeValid) {
      console.log(`   Size Check: ✓ Under ${formatSize(MAX_HTML_SIZE)} limit`);
    } else {
      console.log(`   Size Check: ⚠ HTML exceeds ${formatSize(MAX_HTML_SIZE)} limit (${formatSize(result.htmlSize)})`);
      console.log('   Tip: Consider reducing content or splitting into multiple slides');
    }
  } else {
    console.error(`\n❌ Export failed: ${result.error}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export type { ExportOptions, ExportResult };
