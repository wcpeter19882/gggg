/**
 * CardGroup Component (L2 Block)
 * 
 * Semantic component for displaying a group of cards.
 * Automatically styled based on current theme.
 * 
 * Usage (array prop):
 * ```mdx
 * <CardGroup 
 *   cards={[
 *     { title: "Feature 1", description: "Description", icon: "🚀" },
 *     { title: "Feature 2", description: "Description", icon: "⚡" },
 *     { title: "Feature 3", description: "Description", icon: "🎯" }
 *   ]}
 *   columns={3}
 * />
 * ```
 * 
 * Usage (child components):
 * ```mdx
 * <CardGroup columns={3}>
 *   <Card title="Feature 1" description="Description" icon="🚀" />
 *   <Card title="Feature 2" description="Description" icon="⚡" />
 *   <Card title="Feature 3" description="Description" icon="🎯" />
 * </CardGroup>
 * ```
 */

import React, { Children, isValidElement, type ReactNode } from 'react';
import type { CardData, Size, GridCols } from '@/utils/types';

// =============================================================================
// Types
// =============================================================================

export interface CardProps extends CardData {
  children?: ReactNode;
  /** Size variant for individual card */
  size?: Size;
}

export interface CardGroupProps {
  /** Array of card data (optional if using Card children) */
  cards?: CardData[];
  /** Card children (optional if using cards prop) */
  children?: ReactNode;
  /** Number of columns */
  columns?: GridCols;
  /** Card size variant */
  size?: Size;
  /** Card visual variant */
  variant?: 'default' | 'outline' | 'filled';
  /** Optional id for the card group */
  id?: string;
}

// =============================================================================
// Card Component
// =============================================================================

/**
 * Card Component
 * 
 * Individual card item used as child of CardGroup.
 * Also exports for direct use in MDX.
 */
export function Card({
  title,
  description,
  icon,
  image,
  link,
  size = 'md',
}: CardProps): JSX.Element {
  // Size classes
  const sizeClass = {
    sm: 'card-sm',
    md: 'card-md',
    lg: 'card-lg',
    full: 'card-lg',
  }[size];

  return (
    <div className={`card ${sizeClass}`}>
      {icon && (
        <div className="card-icon">{icon}</div>
      )}
      
      {image && (
        <div className="card-image">
          <img src={image} alt="" loading="lazy" />
        </div>
      )}
      
      <div className="card-content">
        <h3 className="card-title">{title}</h3>
        
        {description && (
          <p className="card-description">{description}</p>
        )}
      </div>
      
      {link && (
        <div className="card-footer">
          <span className="card-link">Learn more →</span>
        </div>
      )}
    </div>
  );
}
Card.displayName = 'Card';

// =============================================================================
// Component
// =============================================================================

/**
 * CardGroup Component
 * 
 * Renders a grid of cards with consistent styling.
 * Supports both array prop and child component patterns.
 * 
 * @param cards - Array of card data objects (optional if using children)
 * @param children - Card children (optional if using cards prop)
 * @param columns - Number of columns (2, 3, or 4)
 * @param size - Card size variant
 * @param variant - Visual style variant
 */
export function CardGroup({
  cards,
  children,
  columns = 3,
  size = 'md',
  variant = 'default',
  id,
}: CardGroupProps): JSX.Element {
  // Size classes
  const sizeClass = {
    sm: 'card-sm',
    md: 'card-md',
    lg: 'card-lg',
    full: 'card-lg',
  }[size];

  // Extract cards from children if no cards prop provided
  const cardsFromChildren: CardData[] = [];
  if (!cards && children) {
    Children.forEach(children, (child) => {
      if (isValidElement(child)) {
        const displayName = (child.type as { displayName?: string })?.displayName;
        if (displayName === 'Card' || (child.type as any) === Card) {
          const props = child.props as CardProps;
          cardsFromChildren.push({
            title: props.title,
            description: props.description,
            icon: props.icon,
            image: props.image,
            link: props.link,
          });
        }
      }
    });
  }

  const resolvedCards = cards || cardsFromChildren;
  
  return (
    <div 
      className={`card-group layout-grid-${columns}`}
      data-columns={columns}
      data-variant={variant}
      id={id}
    >
      {resolvedCards.map((card, index) => (
        <div 
          key={index}
          className={`card ${sizeClass} card-${variant}`}
        >
          {card.icon && (
            <div className="card-icon">{card.icon}</div>
          )}
          
          {card.image && (
            <div className="card-image">
              <img src={card.image} alt="" loading="lazy" />
            </div>
          )}
          
          <div className="card-content">
            <h3 className="card-title">{card.title}</h3>
            
            {card.description && (
              <p className="card-description">{card.description}</p>
            )}
          </div>
          
          {card.link && (
            <div className="card-footer">
              <span className="card-link">Learn more →</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// Exports
// =============================================================================

export default CardGroup;
