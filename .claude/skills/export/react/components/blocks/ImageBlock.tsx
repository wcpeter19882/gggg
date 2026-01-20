/**
 * ImageBlock Component (L2 Block)
 * 
 * Semantic image component with optional caption and sizing.
 * Automatically styled based on current theme.
 * 
 * Usage:
 * ```mdx
 * <ImageBlock 
 *   src="/path/to/image.jpg"
 *   alt="Description of image"
 *   caption="Figure 1: Example diagram"
 *   size="lg"
 * />
 * ```
 */

import React from 'react';
import type { Size } from '@/utils/types';

// =============================================================================
// Types
// =============================================================================

export interface ImageBlockProps {
  /** Image source URL */
  src: string;
  /** Alt text for accessibility */
  alt: string;
  /** Optional caption */
  caption?: string;
  /** Image size */
  size?: Size;
  /** Object fit mode */
  fit?: 'contain' | 'cover' | 'fill';
  /** Border radius */
  rounded?: boolean;
}

// =============================================================================
// Component
// =============================================================================

/**
 * ImageBlock Component
 * 
 * Renders an image with optional caption and styling.
 * 
 * @param src - Image source URL
 * @param alt - Accessibility description
 * @param caption - Optional figure caption
 * @param size - Image container size
 * @param fit - Object fit behavior
 * @param rounded - Whether to apply border radius
 */
export function ImageBlock({
  src,
  alt,
  caption,
  size = 'md',
  fit = 'contain',
  rounded = true,
}: ImageBlockProps): JSX.Element {
  
  return (
    <figure 
      className={`image-block image-${size}`}
      data-size={size}
    >
      <div className="image-wrapper">
        <img
          src={src}
          alt={alt}
          className={`image-content ${rounded ? 'image-rounded' : ''}`}
          style={{ 
            objectFit: fit
          }}
          loading="lazy"
        />
      </div>
      
      {caption && (
        <figcaption className="image-caption">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}


// =============================================================================
// Exports
// =============================================================================

export default ImageBlock;
