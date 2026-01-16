export const MOCK_BIGNUM = {
  value: "42%",
  label: "Growth Rate",
  sublabel: "Year over Year"
};

export const MOCK_METRIC_CARD = {
  title: "Revenue Overview",
  items: [
    { label: "Q1 Revenue", value: "$1.2M", icon: "💰" },
    { label: "Q2 Projected", value: "$1.5M", icon: "📈" }
  ]
};

export const MOCK_CHART_BAR = {
  data: [
    { label: 'Jan', value: 12 },
    { label: 'Feb', value: 19 },
    { label: 'Mar', value: 3 },
    { label: 'Apr', value: 5 },
    { label: 'May', value: 2 },
    { label: 'Jun', value: 3 }
  ],
  title: "Monthly Sales"
};

export const MOCK_CHART_LINE = {
  data: [
    { label: 'Q1', value: 100 },
    { label: 'Q2', value: 150 },
    { label: 'Q3', value: 180 },
    { label: 'Q4', value: 220 }
  ],
  title: "Revenue Growth"
};

export const MOCK_CHART_PIE = {
  data: [
    { label: 'Product A', value: 40 },
    { label: 'Product B', value: 35 },
    { label: 'Product C', value: 25 }
  ],
  title: "Market Share"
};

export const MOCK_SMART_LIST = {
  items: [
    "Identify core requirements",
    "Design system architecture",
    "Implement component library",
    "Validate with user testing"
  ]
};

export const MOCK_TABLE_DATA = {
  headers: ["Feature", "Status", "Priority", "Assignee"],
  rows: [
    ["Authentication", "Done", "High", "Alice"],
    ["Dashboard", "In Progress", "High", "Bob"],
    ["Settings", "Pending", "Medium", "Charlie"],
    ["Export", "To Do", "Low", "Dave"]
  ]
};

export const MOCK_STEP_LIST = {
  items: [
    { label: "Plan", description: "Define scope and goals" },
    { label: "Build", description: "Implement core features" },
    { label: "Test", description: "Validate functionality" },
    { label: "Ship", description: "Deploy to production" }
  ],
  title: "Development Process"
};

export const MOCK_PROCESS_STRIP = {
  items: [
    { label: "Discovery", status: "done" },
    { label: "Design", status: "done" },
    { label: "Development", status: "active" },
    { label: "Testing", status: "pending" },
    { label: "Launch", status: "pending" }
  ],
  title: "Project Timeline"
};

export const MOCK_QUOTE = {
  author: "Steve Jobs",
  source: "Stanford Commencement, 2005"
};
