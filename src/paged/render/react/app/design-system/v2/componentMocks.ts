/**
 * Component Mocks for V2 Design System Showcase
 * 
 * Realistic demo data for all 25 components (4 atoms + 21 blocks)
 */

// =============================================================================
// ATOMS
// =============================================================================

export const headingMock = {
  level: 2,
  children: 'Product Strategy 2026',
};

export const textMock = {
  variant: 'default',
  children: 'We\'re accelerating our roadmap with AI-powered features that enhance user productivity by 10x while maintaining our commitment to data privacy and security.',
};

export const calloutMock = {
  intent: 'info',
  title: 'Key Insight',
  children: 'Customer feedback shows 89% satisfaction with the new interface improvements launched in Q4.',
};

export const highlightMock = {
  // Demo inside text component
  example: 'Our revenue grew to <Highlight color="success" bold>$1.2M</Highlight> this quarter.',
};

// =============================================================================
// BLOCKS - TEXT & DISPLAY
// =============================================================================

export const smartListMock = {
  id: 'list_demo_001',
  items: [
    'AI-powered content generation',
    'Real-time collaboration features',
    'Advanced analytics dashboard',
    'Enterprise security compliance',
  ],
  ordered: false,
};

export const stepListMock = {
  id: 'steps_demo_001',
  items: [
    { label: 'Discovery Phase', description: 'User research and market analysis' },
    { label: 'Design Sprint', description: 'Prototyping and validation' },
    { label: 'Development', description: 'Agile implementation cycles' },
    { label: 'Launch', description: 'Phased rollout strategy' },
  ],
};

export const quoteBlockMock = {
  id: 'quote_demo_001',
  children: 'This platform transformed how our team collaborates. We\'ve seen a 40% increase in productivity since adoption.',
  author: 'Sarah Chen',
  role: 'VP of Engineering, TechCorp',
  size: 'md' as 'sm' | 'md' | 'lg',
};

// =============================================================================
// BLOCKS - METRICS
// =============================================================================

export const bigNumMock = {
  id: 'bignum_demo_001',
  value: '47K',
  label: 'Active Users',
  sublabel: '+12% vs last quarter',
  trend: '+12%',
};

export const metricGroupMock = {
  id: 'metrics_demo_001',
  cols: 3 as 1 | 2 | 3 | 4,
  children: [
    { value: '$1.2M', label: 'Revenue', change: 15, changeLabel: 'vs Q3' },
    { value: '89%', label: 'Retention Rate', change: 3 },
    { value: '4.8', label: 'NPS Score', icon: '⭐' },
  ],
};

export const metricCardMock = {
  id: 'card_demo_001',
  title: 'Q4 Performance',
  metrics: [
    { icon: '📊', value: '2.4M', label: 'Total Sessions' },
    { icon: '⏱️', value: '8.5 min', label: 'Avg Duration' },
    { icon: '🎯', value: '67%', label: 'Conversion' },
  ],
  orientation: 'horizontal' as 'horizontal' | 'vertical',
};

export const metricStripMock = {
  id: 'strip_demo_001',
  metrics: [
    { icon: '👥', value: '1,247', label: 'Team Members' },
    { icon: '🌍', value: '28', label: 'Countries' },
    { icon: '🚀', value: '156', label: 'Projects' },
  ],
};

export const metricBadgesMock = {
  id: 'badges_demo_001',
  badges: [
    { icon: '🏆', value: '12', label: 'Awards' },
    { icon: '💼', value: '450+', label: 'Clients' },
    { icon: '⚡', value: '99.9%', label: 'Uptime' },
    { icon: '🔒', value: 'SOC 2', label: 'Certified' },
  ],
};

export const cardGroupMock = {
  id: 'cards_demo_001',
  columns: 3 as 2 | 3 | 4,
  children: [
    { title: 'Speed', description: '10x faster performance', icon: '🚀' },
    { title: 'Security', description: 'Enterprise-grade protection', icon: '🔒' },
    { title: 'Scale', description: 'Handles millions of requests', icon: '📈' },
  ],
};

export const barStatsMock = {
  id: 'barstats_demo_001',
  title: 'Top Performing Regions',
  data: [
    { label: 'North America', value: 95 },
    { label: 'Europe', value: 87 },
    { label: 'Asia Pacific', value: 78 },
    { label: 'Latin America', value: 65 },
  ],
  sortDescending: true,
  showValues: true,
};

// =============================================================================
// BLOCKS - CHARTS
// =============================================================================

export const chartBarMock = {
  id: 'chart_bar_demo_001',
  title: 'Quarterly Revenue',
  data: [
    { label: 'Q1', value: 850 },
    { label: 'Q2', value: 920 },
    { label: 'Q3', value: 1050 },
    { label: 'Q4', value: 1200 },
  ],
};

export const chartLineMock = {
  id: 'chart_line_demo_001',
  title: 'User Growth Trend',
  data: [
    { label: 'Jan', value: 1200 },
    { label: 'Feb', value: 1450 },
    { label: 'Mar', value: 1680 },
    { label: 'Apr', value: 2100 },
    { label: 'May', value: 2350 },
    { label: 'Jun', value: 2800 },
  ],
};

export const chartPieMock = {
  id: 'chart_pie_demo_001',
  title: 'Market Share',
  data: [
    { label: 'Product A', value: 35 },
    { label: 'Product B', value: 28 },
    { label: 'Product C', value: 22 },
    { label: 'Other', value: 15 },
  ],
  variant: 'donut' as 'pie' | 'donut',
};

export const chartAreaMock = {
  id: 'chart_area_demo_001',
  title: 'Cumulative Revenue',
  data: [
    { label: 'Week 1', value: 250 },
    { label: 'Week 2', value: 580 },
    { label: 'Week 3', value: 920 },
    { label: 'Week 4', value: 1350 },
  ],
  gradient: true,
};

export const chartPolarMock = {
  id: 'chart_polar_demo_001',
  title: 'Monthly Distribution',
  data: [
    { label: 'Jan', value: 145 },
    { label: 'Feb', value: 98 },
    { label: 'Mar', value: 167 },
    { label: 'Apr', value: 203 },
    { label: 'May', value: 178 },
    { label: 'Jun', value: 156 },
  ],
};

export const chartRadarMock = {
  id: 'chart_radar_demo_001',
  title: 'Product Comparison',
  data: [
    { label: 'Speed', value: 85 },
    { label: 'Security', value: 92 },
    { label: 'Usability', value: 78 },
    { label: 'Cost', value: 65 },
    { label: 'Support', value: 88 },
  ],
};

export const chartBubbleMock = {
  id: 'chart_bubble_demo_001',
  title: 'Product Analysis',
  data: [
    { label: 'Product A', x: 45, y: 78, size: 120 },
    { label: 'Product B', x: 67, y: 85, size: 200 },
    { label: 'Product C', x: 52, y: 62, size: 90 },
    { label: 'Product D', x: 78, y: 92, size: 150 },
  ],
};

export const chartCustomMock = {
  id: 'chart_custom_demo_001',
  type: 'rose' as 'rose',
  title: 'Wind Direction Distribution',
  data: [
    { label: 'N', value: 145 },
    { label: 'NE', value: 98 },
    { label: 'E', value: 67 },
    { label: 'SE', value: 112 },
    { label: 'S', value: 156 },
    { label: 'SW', value: 134 },
    { label: 'W', value: 89 },
    { label: 'NW', value: 121 },
  ],
  colorScheme: 'teal' as 'blue' | 'green' | 'purple' | 'teal' | 'red' | 'orange' | 'pink' | 'rainbow',
};

// =============================================================================
// BLOCKS - SPECIAL
// =============================================================================

export const imageBlockMock = {
  id: 'image_demo_001',
  src: '/api/placeholder/800/600',
  alt: 'Product Dashboard Interface',
  caption: 'New dashboard design with improved navigation',
  size: 'lg' as 'sm' | 'md' | 'lg' | 'full',
  fit: 'cover' as 'contain' | 'cover' | 'fill',
};

export const processStripMock = {
  id: 'process_demo_001',
  title: 'Development Pipeline',
  items: [
    { label: 'Plan', status: 'done' as 'done' | 'active' | 'pending' | 'neutral' },
    { label: 'Design', status: 'done' as 'done' | 'active' | 'pending' | 'neutral' },
    { label: 'Build', status: 'active' as 'done' | 'active' | 'pending' | 'neutral' },
    { label: 'Test', status: 'pending' as 'done' | 'active' | 'pending' | 'neutral' },
    { label: 'Deploy', status: 'pending' as 'done' | 'active' | 'pending' | 'neutral' },
  ],
  showConnectors: true,
};

export const tableDataMock = {
  id: 'table_demo_001',
  headers: ['Region', 'Revenue', 'Growth', 'Target'],
  rows: [
    ['North America', '$2.4M', '+15%', '✓'],
    ['Europe', '$1.8M', '+12%', '✓'],
    ['Asia Pacific', '$1.2M', '+23%', '✓'],
    ['Latin America', '$0.9M', '+8%', '○'],
  ],
  showHeader: true,
  striped: true,
};

export const networkGraphMock = {
  id: 'network_demo_001',
  type: 'flow' as 'flow' | 'network' | 'tree',
  size: 'medium' as 'compact' | 'medium' | 'tall',
  title: 'System Architecture',
};
