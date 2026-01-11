/**
 * Export Template Manifests to JSON
 * 
 * This script exports the template manifest registry to a JSON file
 * that can be consumed by the Python generation layer.
 * 
 * Usage:
 *   npx tsx scripts/export-manifests.ts
 */

import fs from 'fs';
import path from 'path';
import { 
  exportManifestRegistryJSON, 
  generateAllSystemPrompts 
} from '../utils/manifest-registry';

const OUTPUT_DIR = path.join(process.cwd(), 'output');
const MANIFEST_FILE = path.join(OUTPUT_DIR, 'template-manifests.json');
const PROMPTS_FILE = path.join(OUTPUT_DIR, 'template-prompts.json');

async function main() {
  try {
    console.log('🔧 Exporting template manifests...\n');
    
    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    
    // Export manifest registry as JSON
    console.log('📄 Generating manifest registry JSON...');
    const manifestJSON = exportManifestRegistryJSON();
    fs.writeFileSync(MANIFEST_FILE, manifestJSON, 'utf-8');
    console.log(`✅ Wrote: ${MANIFEST_FILE}\n`);
    
    // Export system prompts
    console.log('📝 Generating system prompts...');
    const prompts = generateAllSystemPrompts();
    fs.writeFileSync(PROMPTS_FILE, JSON.stringify(prompts, null, 2), 'utf-8');
    console.log(`✅ Wrote: ${PROMPTS_FILE}\n`);
    
    // Print summary
    const registry = JSON.parse(manifestJSON);
    console.log('📊 Summary:');
    console.log(`   Templates: ${registry.metadata.templateCount}`);
    console.log(`   Generated: ${new Date(registry.metadata.generatedAt).toLocaleString()}`);
    console.log(`   Schema Version: ${registry.metadata.schemaVersion}\n`);
    
    console.log('🎉 Export complete!');
    
  } catch (error) {
    console.error('❌ Error exporting manifests:', error);
    process.exit(1);
  }
}

main();
