/**
 * HeroUI Components - Switchable Implementation
 * 
 * Uses CUSTOM_COMPONENTS from antd/switchable.tsx - single shared list.
 * Components in the list use custom; others use original HeroUI.
 * 
 * To change implementation: edit CUSTOM_COMPONENTS in antd/switchable.tsx
 */

'use client';

// Import shared CUSTOM_COMPONENTS list
import { CUSTOM_COMPONENTS, isCustom } from '../antd/switchable';

// Original HeroUI imports
import {
  Card as OriginalCard,
  CardHeader as OriginalCardHeader,
  CardBody as OriginalCardBody,
  CardFooter as OriginalCardFooter,
  Chip as OriginalChip,
  Button as OriginalButton,
  Avatar as OriginalAvatar,
  Divider as OriginalDivider,
  Progress as OriginalProgress,
  Badge as OriginalBadge,
} from '@heroui/react';

// Custom styled imports
import {
  Card as CustomCard,
  CardHeader as CustomCardHeader,
  CardBody as CustomCardBody,
  CardFooter as CustomCardFooter,
  Chip as CustomChip,
  Button as CustomButton,
  Avatar as CustomAvatar,
  Divider as CustomDivider,
  Progress as CustomProgress,
  Badge as CustomBadge,
  FlexRow as CustomFlexRow,
  FlexCol as CustomFlexCol,
  Grid as CustomGrid,
  Center as CustomCenter,
} from './index';

// Re-export for access
export { CUSTOM_COMPONENTS, isCustom };

// =============================================================================
// Component Exports - Selected based on CUSTOM_COMPONENTS list
// HeroUI components use "H" prefix in the list (e.g., HCard, HBadge)
// =============================================================================

export const Card = isCustom('HCard') ? CustomCard : OriginalCard as typeof CustomCard;
export const CardHeader = isCustom('CardHeader') ? CustomCardHeader : OriginalCardHeader as typeof CustomCardHeader;
export const CardBody = isCustom('CardBody') ? CustomCardBody : OriginalCardBody as typeof CustomCardBody;
export const CardFooter = isCustom('CardFooter') ? CustomCardFooter : OriginalCardFooter as typeof CustomCardFooter;
export const Chip = isCustom('Chip') ? CustomChip : OriginalChip as typeof CustomChip;
export const Button = isCustom('Button') ? CustomButton : OriginalButton as typeof CustomButton;
export const Avatar = isCustom('Avatar') ? CustomAvatar : OriginalAvatar as typeof CustomAvatar;
export const HDivider = isCustom('HDivider') ? CustomDivider : OriginalDivider as typeof CustomDivider;
export const HProgress = isCustom('HProgress') ? CustomProgress : OriginalProgress as typeof CustomProgress;
export const HBadge = isCustom('HBadge') ? CustomBadge : OriginalBadge as typeof CustomBadge;

// Layout components (no original equivalent - always custom)
export const FlexRow = CustomFlexRow;
export const FlexCol = CustomFlexCol;
export const Grid = CustomGrid;
export const Center = CustomCenter;

// Direct access to both implementations
export const CustomComponents = {
  Card: CustomCard,
  CardHeader: CustomCardHeader,
  CardBody: CustomCardBody,
  CardFooter: CustomCardFooter,
  Chip: CustomChip,
  Button: CustomButton,
  Avatar: CustomAvatar,
  Divider: CustomDivider,
  Progress: CustomProgress,
  Badge: CustomBadge,
  FlexRow: CustomFlexRow,
  FlexCol: CustomFlexCol,
  Grid: CustomGrid,
  Center: CustomCenter,
};

export const OriginalComponents = {
  Card: OriginalCard,
  CardHeader: OriginalCardHeader,
  CardBody: OriginalCardBody,
  CardFooter: OriginalCardFooter,
  Chip: OriginalChip,
  Button: OriginalButton,
  Avatar: OriginalAvatar,
  Divider: OriginalDivider,
  Progress: OriginalProgress,
  Badge: OriginalBadge,
};
