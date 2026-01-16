/**
 * Blocks Components Index
 * 
 * L2 Blocks - Content grouping and data visualization
 */

export { SmartList } from './SmartList';
export type { SmartListProps } from './SmartList';

export { ChartBar } from './ChartBar';
export type { ChartBarProps } from './ChartBar';

export { ChartLine } from './ChartLine';
export type { ChartLineProps } from './ChartLine';

export { ChartPie } from './ChartPie';
export type { ChartPieProps } from './ChartPie';

// Extended chart types (003-extended-chart-types)
export { ChartArea } from './ChartArea';
export type { ChartAreaProps } from './ChartArea';

export { ChartBubble } from './ChartBubble';
export type { ChartBubbleProps } from './ChartBubble';

export { ChartRadar } from './ChartRadar';
export type { ChartRadarProps } from './ChartRadar';

export { ChartPolar } from './ChartPolar';
export type { ChartPolarProps } from './ChartPolar';

export { BarStats } from './BarStats';
export type { BarStatsProps } from './BarStats';

// Custom chart component for user-defined visualizations
export { ChartCustom } from './ChartCustom';
export type { ChartCustomProps } from './ChartCustom';

// Chart utilities
export * from './chartUtils';

export { MetricGroup, Metric } from './MetricGroup';
export type { MetricGroupProps, MetricProps } from './MetricGroup';

export { BigNum } from './BigNum';
export type { BigNumProps } from './BigNum';

export { MetricStrip } from './MetricStrip';
export type { MetricStripProps, MetricStripItem } from './MetricStrip';

export { MetricCard } from './MetricCard';
export type { MetricCardProps, MetricCardItem } from './MetricCard';

export { MetricBadges } from './MetricBadges';
export type { MetricBadgesProps, BadgeItem } from './MetricBadges';

export { TableData } from './TableData';
export type { TableDataProps } from './TableData';

export { QuoteBlock } from './QuoteBlock';
export type { QuoteBlockProps } from './QuoteBlock';

export { ImageBlock } from './ImageBlock';
export type { ImageBlockProps } from './ImageBlock';

export { CardGroup, Card } from './CardGroup';
export type { CardGroupProps, CardProps } from './CardGroup';

export { StepList } from './StepList';
export type { StepListProps, StepItem } from './StepList';

export { NetworkGraph, Node, Edge, Group } from './NetworkGraph';
export type { NetworkGraphProps, NodeProps, EdgeProps, GroupProps, DiagramSize } from './NetworkGraph';

export { ProcessStrip } from './ProcessStrip';
export type { ProcessStripProps, ProcessItem, ProcessStatus } from './ProcessStrip';

// NetworkGraph (Cytoscape-based with JSX syntax) - for branching/network diagrams
export { diagramTheme, diagramThemeDark } from './NetworkGraph/diagramTheme';
export type { CytoscapeElement, ParsedDiagram } from './NetworkGraph';

// Backward compatibility alias
export { NetworkGraph as SmartDiagram } from './NetworkGraph';
export { NetworkGraph as Diagram } from './NetworkGraph';
