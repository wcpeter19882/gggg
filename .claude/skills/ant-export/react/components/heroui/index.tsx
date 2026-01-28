'use client';

/**
 * HeroUI Components for Slide Layout
 * 
 * These components provide visual containers for slide content,
 * integrating with Tailwind CSS and Ant Design.
 */

import React from 'react';
import {
  Card as HeroCard,
  CardHeader as HeroCardHeader,
  CardBody as HeroCardBody,
  CardFooter as HeroCardFooter,
  Chip as HeroChip,
  Button as HeroButton,
  Avatar as HeroAvatar,
  Divider as HeroDivider,
  Progress as HeroProgress,
  Badge as HeroBadge,
} from '@heroui/react';

// Re-export HeroUI components with slide-friendly defaults
export const Card: React.FC<{
  children?: React.ReactNode;
  className?: string;
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  radius?: 'none' | 'sm' | 'md' | 'lg';
  isBlurred?: boolean;
  style?: React.CSSProperties;
}> = ({ children, className = '', shadow = 'md', radius = 'lg', isBlurred = false, style = {} }) => {
  // Check for accent border classes and apply appropriate border color
  const hasBorderL4 = className.includes('border-l-4');
  const isRedCard = className.includes('bg-red-50') || className.includes('red');
  const isGreenCard = className.includes('bg-green-50') || className.includes('green');
  const isBlueCard = className.includes('bg-blue-50') || className.includes('blue');
  const isYellowCard = className.includes('bg-yellow-50') || className.includes('yellow');
  
  // Determine accent color
  const accentColor = isRedCard ? '#ef4444' : isGreenCard ? '#22c55e' : isBlueCard ? '#3b82f6' : isYellowCard ? '#f59e0b' : '#64748b';
  
  const borderStyle = hasBorderL4 ? {
    borderLeftWidth: '6px',
    borderLeftStyle: 'solid' as const,
    borderLeftColor: accentColor,
    boxShadow: `0 8px 32px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(0,0,0,0.05)`,
  } : {
    boxShadow: `0 8px 32px rgba(0,0,0,0.08)`,
  };
  
  return (
    <HeroCard
      className={`backdrop-blur-sm ${className}`}
      shadow={shadow}
      radius={radius}
      isBlurred={isBlurred}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '20px',
        overflow: 'hidden',
        ...borderStyle,
        ...style,
      }}
    >
      {children}
    </HeroCard>
  );
};

export const CardHeader: React.FC<{
  children?: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <HeroCardHeader className={`flex flex-col items-start gap-2 pb-0 ${className}`}>
      {children}
    </HeroCardHeader>
  );
};

export const CardBody: React.FC<{
  children?: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <HeroCardBody 
      className={`${className}`}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '28px 32px',
        gap: '16px',
      }}
    >
      {children}
    </HeroCardBody>
  );
};

export const CardFooter: React.FC<{
  children?: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <HeroCardFooter className={`pt-0 ${className}`}>
      {children}
    </HeroCardFooter>
  );
};

export const Chip: React.FC<{
  children?: React.ReactNode;
  className?: string;
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  variant?: 'solid' | 'bordered' | 'light' | 'flat' | 'faded' | 'shadow' | 'dot';
  size?: 'sm' | 'md' | 'lg';
}> = ({ children, className = '', color = 'primary', variant = 'flat', size = 'md' }) => {
  return (
    <HeroChip
      className={className}
      color={color}
      variant={variant}
      size={size}
    >
      {children}
    </HeroChip>
  );
};

export const Button: React.FC<{
  children?: React.ReactNode;
  className?: string;
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  variant?: 'solid' | 'bordered' | 'light' | 'flat' | 'faded' | 'shadow' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
}> = ({ children, className = '', color = 'primary', variant = 'solid', size = 'md', radius = 'md' }) => {
  return (
    <HeroButton
      className={className}
      color={color}
      variant={variant}
      size={size}
      radius={radius}
    >
      {children}
    </HeroButton>
  );
};

export const Avatar: React.FC<{
  src?: string;
  name?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
}> = ({ src, name, className = '', size = 'md', color = 'primary' }) => {
  return (
    <HeroAvatar
      src={src}
      name={name}
      className={className}
      size={size}
      color={color}
    />
  );
};

export const Divider: React.FC<{
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}> = ({ className = '', orientation = 'horizontal' }) => {
  return (
    <HeroDivider
      className={className}
      orientation={orientation}
    />
  );
};

export const Progress: React.FC<{
  value?: number;
  className?: string;
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  showValueLabel?: boolean;
  label?: string;
}> = ({ value = 0, className = '', color = 'primary', size = 'md', showValueLabel = false, label }) => {
  return (
    <HeroProgress
      value={value}
      className={className}
      color={color}
      size={size}
      showValueLabel={showValueLabel}
      label={label}
    />
  );
};

export const Badge: React.FC<{
  children?: React.ReactNode;
  content?: React.ReactNode;
  className?: string;
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  variant?: 'solid' | 'flat' | 'faded' | 'shadow';
}> = ({ children, content, className = '', color = 'primary', variant = 'solid' }) => {
  return (
    <HeroBadge
      content={content}
      className={className}
      color={color}
      variant={variant}
    >
      {children}
    </HeroBadge>
  );
};

// Utility layout components for slides
export const FlexRow: React.FC<{
  children?: React.ReactNode;
  className?: string;
  gap?: string;
}> = ({ children, className = '', gap = 'gap-6' }) => {
  return (
    <div className={`flex flex-row items-stretch ${gap} ${className}`}>
      {children}
    </div>
  );
};

export const FlexCol: React.FC<{
  children?: React.ReactNode;
  className?: string;
  gap?: string;
}> = ({ children, className = '', gap = 'gap-4' }) => {
  return (
    <div className={`flex flex-col ${gap} ${className}`}>
      {children}
    </div>
  );
};

export const Grid: React.FC<{
  children?: React.ReactNode;
  className?: string;
  cols?: number;
  gap?: string;
}> = ({ children, className = '', cols = 2, gap = 'gap-6' }) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
  }[cols] || 'grid-cols-2';
  
  return (
    <div className={`grid ${gridCols} ${gap} ${className}`}>
      {children}
    </div>
  );
};

export const Center: React.FC<{
  children?: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      {children}
    </div>
  );
};

// Export all components as default object for easy importing
const HeroUIComponents = {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Chip,
  Button,
  Avatar,
  Divider,
  Progress,
  Badge,
  FlexRow,
  FlexCol,
  Grid,
  Center,
};

export default HeroUIComponents;
