/**
 * Ant Design Components - Switchable Implementation
 * 
 * Components listed in CUSTOM_COMPONENTS use our custom styled version.
 * Components NOT in the list use original Ant Design.
 * 
 * To change implementation: add/remove component name from the list.
 */

'use client';

// Original Ant Design imports
import {
  Alert as AntAlert,
  List as AntList,
  Card as AntCard,
  Statistic as AntStatistic,
  Descriptions as AntDescriptions,
  Steps as AntSteps,
  Timeline as AntTimeline,
  Table as AntTable,
  Progress as AntProgress,
  Tag as AntTag,
  Badge as AntBadge,
  Image as AntImage,
  Row as AntRow,
  Col as AntCol,
  Flex as AntFlex,
  Divider as AntDivider,
  Layout as AntLayout,
} from 'antd';

// Custom styled imports
import { Alert as CustomAlert, type AlertProps } from './Alert';
import { List as CustomList, type ListProps } from './List';
import { Card as CustomCard, type CardProps } from './Card';
import { Statistic as CustomStatistic, type StatisticProps } from './Statistic';
import { Descriptions as CustomDescriptions, type DescriptionsProps } from './Descriptions';
import { Steps as CustomSteps, type StepsProps } from './Steps';
import { Timeline as CustomTimeline, type TimelineProps } from './Timeline';
import { Table as CustomTable, type TableProps } from './Table';
import { Progress as CustomProgress, type ProgressProps } from './Progress';
import { Tag as CustomTag, type TagProps } from './Tag';
import { Badge as CustomBadge, type BadgeProps } from './Badge';
import { Image as CustomImage, type ImageProps } from './Image';
import { Blockquote as CustomBlockquote, type BlockquoteProps } from './Blockquote';
import CustomGrid, { type RowProps, type ColProps } from './Grid';
import { Flex as CustomFlex, type FlexProps } from './Flex';
import { Divider as CustomDivider, type DividerProps } from './Divider';
import { Layout as CustomLayout, Header as CustomHeader, Footer as CustomFooter, Sider as CustomSider, Content as CustomContent } from './Layout';

// Typography (always custom)
export { Typography, Title, Paragraph, Text } from './Typography';

// Charts (no original equivalent - always custom)
export { 
  Charts, 
  Line, Bar, Column, Pie, Area,
  Funnel, Venn, Pyramid, Matrix, Radar 
} from './Charts';
export type { 
  LineChartProps, BarChartProps, ColumnChartProps, PieChartProps, AreaChartProps,
  FunnelChartProps, VennChartProps, PyramidChartProps, MatrixChartProps, RadarChartProps
} from './Charts';

// =============================================================================
// CUSTOM COMPONENTS LIST
// Components in this list use custom implementation.
// Components NOT in the list use original Ant Design / HeroUI.
// =============================================================================

export const CUSTOM_COMPONENTS: ReadonlySet<string> = new Set([
  // Ant Design - Data Display
  'Alert',
  'List',
  'Card',
  'Statistic',
  'Descriptions',
  'Steps',
  'Timeline',
  'Table',
  'Progress',
  'Tag',
  'Badge',
  'Image',
  'Blockquote',
  
  // Ant Design - Layout
  'Row',
  'Col',
  'Flex',
  'Divider',
  'Layout',
  'Header',
  'Footer',
  'Sider',
  'Content',
  
  // HeroUI
  'HCard',
  'CardHeader',
  'CardBody',
  'CardFooter',
  'Chip',
  'Button',
  'Avatar',
  'HDivider',
  'HProgress',
  'HBadge',
]);

// Helper to check if component uses custom implementation
export const isCustom = (name: string): boolean => CUSTOM_COMPONENTS.has(name);

// =============================================================================
// Component Exports - Selected based on CUSTOM_COMPONENTS list
// =============================================================================

// Data Display
export const Alert = isCustom('Alert') ? CustomAlert : AntAlert as typeof CustomAlert;
export const List = isCustom('List') ? CustomList : AntList as typeof CustomList;
export const Card = isCustom('Card') ? CustomCard : AntCard as typeof CustomCard;
export const Statistic = isCustom('Statistic') ? CustomStatistic : AntStatistic as typeof CustomStatistic;
export const Descriptions = isCustom('Descriptions') ? CustomDescriptions : AntDescriptions as typeof CustomDescriptions;
export const Steps = isCustom('Steps') ? CustomSteps : AntSteps as unknown as typeof CustomSteps;
export const Timeline = isCustom('Timeline') ? CustomTimeline : AntTimeline as typeof CustomTimeline;
export const Table = isCustom('Table') ? CustomTable : AntTable as typeof CustomTable;
export const Progress = isCustom('Progress') ? CustomProgress : AntProgress as typeof CustomProgress;
export const Tag = isCustom('Tag') ? CustomTag : AntTag as typeof CustomTag;
export const Badge = isCustom('Badge') ? CustomBadge : AntBadge as typeof CustomBadge;
export const Image = isCustom('Image') ? CustomImage : AntImage as typeof CustomImage;
export const Blockquote = CustomBlockquote; // Always custom (no original)

// Grid
export const Row = isCustom('Row') ? CustomGrid.Row : AntRow as typeof CustomGrid.Row;
export const Col = isCustom('Col') ? CustomGrid.Col : AntCol as typeof CustomGrid.Col;

// Flex & Divider
export const Flex = isCustom('Flex') ? CustomFlex : AntFlex as typeof CustomFlex;
export const Divider = isCustom('Divider') ? CustomDivider : AntDivider as typeof CustomDivider;

// Layout
export const Layout = isCustom('Layout') ? CustomLayout : AntLayout as typeof CustomLayout;
export const Header = isCustom('Header') ? CustomHeader : AntLayout.Header as typeof CustomHeader;
export const Footer = isCustom('Footer') ? CustomFooter : AntLayout.Footer as typeof CustomFooter;
export const Sider = isCustom('Sider') ? CustomSider : AntLayout.Sider as typeof CustomSider;
export const Content = isCustom('Content') ? CustomContent : AntLayout.Content as typeof CustomContent;

// Re-export types
export type { 
  AlertProps, ListProps, CardProps, StatisticProps, DescriptionsProps,
  StepsProps, TimelineProps, TableProps, ProgressProps, TagProps,
  BadgeProps, ImageProps, BlockquoteProps, RowProps, ColProps,
  FlexProps, DividerProps
};

// Direct access to both implementations
export const CustomComponents = {
  Alert: CustomAlert,
  List: CustomList,
  Card: CustomCard,
  Statistic: CustomStatistic,
  Descriptions: CustomDescriptions,
  Steps: CustomSteps,
  Timeline: CustomTimeline,
  Table: CustomTable,
  Progress: CustomProgress,
  Tag: CustomTag,
  Badge: CustomBadge,
  Image: CustomImage,
  Blockquote: CustomBlockquote,
  Row: CustomGrid.Row,
  Col: CustomGrid.Col,
  Flex: CustomFlex,
  Divider: CustomDivider,
  Layout: CustomLayout,
  Header: CustomHeader,
  Footer: CustomFooter,
  Sider: CustomSider,
  Content: CustomContent,
};

export const OriginalComponents = {
  Alert: AntAlert,
  List: AntList,
  Card: AntCard,
  Statistic: AntStatistic,
  Descriptions: AntDescriptions,
  Steps: AntSteps,
  Timeline: AntTimeline,
  Table: AntTable,
  Progress: AntProgress,
  Tag: AntTag,
  Badge: AntBadge,
  Image: AntImage,
  Row: AntRow,
  Col: AntCol,
  Flex: AntFlex,
  Divider: AntDivider,
  Layout: AntLayout,
};
