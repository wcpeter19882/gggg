/**
 * Ant Design Components - Styled for Slides
 * 
 * These components implement Ant Design APIs but with our slide styling.
 * Import from this file to use the styled versions.
 */

// Typography
export { Typography, Title, Paragraph, Text } from './Typography';
export { Highlight, type HighlightProps, type HighlightColor } from './Highlight';

// Data Display
export { Alert, type AlertProps } from './Alert';
export { List, type ListProps } from './List';
export { Card, type CardProps } from './Card';
export { Statistic, type StatisticProps } from './Statistic';
export { MetricCard, type MetricCardProps, type MetricCardItem } from './MetricCard';
export { Descriptions, type DescriptionsProps } from './Descriptions';
export { Steps, type StepsProps } from './Steps';
export { Timeline, type TimelineProps } from './Timeline';
export { Table, type TableProps } from './Table';
export { Progress, type ProgressProps } from './Progress';
export { Tag, type TagProps } from './Tag';
export { Badge, type BadgeProps } from './Badge';
export { Image, type ImageProps } from './Image';
export { Blockquote, type BlockquoteProps } from './Blockquote';

// Layout
import Grid from './Grid';
export const Row = Grid.Row;
export const Col = Grid.Col;
export type { RowProps, ColProps } from './Grid';
export { Flex, type FlexProps } from './Flex';
export { Divider, type DividerProps } from './Divider';
export { Layout, Header, Footer, Sider, Content } from './Layout';

// Charts
export { 
  Charts, 
  Line, Bar, Column, Pie, Area,
  Funnel, Venn, Pyramid, Radar, Scatter 
} from './Charts';
export type { 
  LineChartProps, BarChartProps, ColumnChartProps, PieChartProps, AreaChartProps,
  FunnelChartProps, VennChartProps, PyramidChartProps, RadarChartProps, ScatterChartProps
} from './Charts';
