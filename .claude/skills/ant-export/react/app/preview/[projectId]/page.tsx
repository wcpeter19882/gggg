"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import JsxParser from "react-jsx-parser";
import { HeroUIProvider } from "@heroui/react";
import { ThemeProvider } from "@/components/core/ThemeContext";
import { AntProvider } from "@/components/core/AntProvider";
import { ThemeSelector } from "@/components/core/ThemeSelector";
import { ComponentConfigProvider, ComponentModeToggle } from "@/components/core";
import { getTheme } from "@/themes";

// Import Ant Design icons
import {
  LockOutlined, TeamOutlined, CheckCircleOutlined, CloseCircleOutlined,
  WarningOutlined, InfoCircleOutlined, CheckOutlined, CloseOutlined,
  ArrowUpOutlined, ArrowDownOutlined, ArrowLeftOutlined, ArrowRightOutlined,
  ThunderboltOutlined, RocketOutlined, SafetyOutlined, ApiOutlined,
  BulbOutlined, UserOutlined, CodeOutlined, ShareAltOutlined,
  FlagOutlined, CalendarOutlined, LinkOutlined, StarOutlined,
  HeartOutlined, FireOutlined, TrophyOutlined, CrownOutlined,
  SettingOutlined, ToolOutlined, CloudOutlined, DatabaseOutlined,
  GlobalOutlined, MobileOutlined, DesktopOutlined, TabletOutlined,
  DollarOutlined, EuroOutlined, PoundOutlined, PercentageOutlined,
  RiseOutlined, FallOutlined, StockOutlined, FundOutlined,
  PieChartOutlined, BarChartOutlined, LineChartOutlined, DotChartOutlined,
  FileOutlined, FolderOutlined, CopyOutlined, DeleteOutlined,
  EditOutlined, SaveOutlined, SearchOutlined, FilterOutlined,
  PlusOutlined, MinusOutlined, QuestionOutlined, ExclamationOutlined,
  SyncOutlined, LoadingOutlined, ReloadOutlined, UndoOutlined,
  PlayCircleOutlined, PauseCircleOutlined, StopOutlined,
  MailOutlined, PhoneOutlined, MessageOutlined, CommentOutlined,
  LikeOutlined, DislikeOutlined, SmileOutlined, FrownOutlined,
  ClockCircleOutlined, ScheduleOutlined, HistoryOutlined,
  EnvironmentOutlined, HomeOutlined, ShopOutlined, BankOutlined,
  TeamOutlined as TeamIcon, UserAddOutlined, UserDeleteOutlined,
  SolutionOutlined, IdcardOutlined, ContactsOutlined,
  CarOutlined, SendOutlined, GiftOutlined, TagOutlined
} from "@ant-design/icons";

// Import all Ant Design styled components (switchable)
import {
  Typography, Title, Paragraph, Text,
  Alert, List, Card, Statistic, Descriptions,
  Steps, Timeline, Table, Progress, Tag, Badge,
  Image, Blockquote, Row, Col, Flex, Divider,
  Layout, Header, Footer, Sider, Content,
  Charts, Line, Bar, Column, Pie, Area,
  Funnel, Venn, Pyramid, Radar, Scatter
} from "@/components/antd/switchable";

// Import HeroUI components (switchable)
import {
  Card as HCard, CardHeader, CardBody, CardFooter,
  Chip, Button, Avatar, HDivider, HProgress, HBadge,
  FlexRow, FlexCol, Grid, Center
} from "@/components/heroui/switchable";

interface SlideData {
  slideNumber: number;
  id: string;
  jsx: string;
  story: string;
  intent?: string;
  density?: string;
  state?: "draft" | "active";
}

interface PipelineStatus {
  phase: "storyline" | "layout" | "complete" | "unknown";
  totalSlides: number;
  slidesWithMdx: number;
  slidesWithStory: number;
}

interface StoryMeta {
  title?: string;
  subtitle?: string;
  author?: string;
  date?: string;
}

interface CustomThemeData {
  id?: string;
  name?: string;
  isDark?: boolean;
  colors?: {
    bg?: string;
    surface?: string;
    surfaceAlt?: string;
    primary?: string;
    secondary?: string;
    accent?: string;
    text?: string;
    textMuted?: string;
    border?: string;
    info?: string;
    success?: string;
    warning?: string;
    danger?: string;
    accent1?: string;
    accent2?: string;
    accent3?: string;
    accent4?: string;
    accent5?: string;
    accent6?: string;
  };
  fonts?: {
    display?: string;
    body?: string;
    mono?: string;
  };
  typography?: {
    sizeDisplay?: string;
    sizeHeading?: string;
    sizeBody?: string;
    sizeCaption?: string;
    lineHeight?: string;
  };
  background?: {
    color?: string;
    image?: string;
  };
  visuals?: {
    radius?: { sm?: string; md?: string; lg?: string };
    shadow?: { sm?: string; md?: string; lg?: string };
  };
}

// Available components for JSX parsing - matches slides page
const availableComponents = {
  // HTML elements for links and formatting
  a: 'a' as unknown as React.ComponentType,
  sup: 'sup' as unknown as React.ComponentType,
  sub: 'sub' as unknown as React.ComponentType,
  br: 'br' as unknown as React.ComponentType,
  span: 'span' as unknown as React.ComponentType,
  strong: 'strong' as unknown as React.ComponentType,
  em: 'em' as unknown as React.ComponentType,
  
  // Ant Design components with aliases
  Typography, "Typography.Title": Title, "Typography.Paragraph": Paragraph, "Typography.Text": Text,
  Title, Paragraph, Text,
  Alert, List, "List.Item": List.Item, Card, "Card.Meta": Card.Meta,
  Statistic, Descriptions, "Descriptions.Item": Descriptions.Item,
  Steps, "Steps.Step": Steps.Step, Timeline, "Timeline.Item": Timeline.Item,
  Table, Progress, Tag, Badge, Image, Blockquote,
  Row, Col, Flex, Divider,
  Layout, Header, Footer, Sider, Content,
  Charts, 
  "Charts.Line": Line, "Charts.Bar": Bar, "Charts.Column": Column, "Charts.Pie": Pie, "Charts.Area": Area,
  "Charts.Funnel": Funnel, "Charts.Venn": Venn, "Charts.Pyramid": Pyramid, "Charts.Radar": Radar, "Charts.Scatter": Scatter,
  Line, Bar, Column, Pie, Area, Funnel, Venn, Pyramid, Radar, Scatter,
  
  // HeroUI components
  HCard, CardHeader, CardBody, CardFooter,
  Chip, Button, Avatar, HDivider, HProgress, HBadge,
  FlexRow, FlexCol, Grid, Center,
  
  // Icons
  LockOutlined, TeamOutlined, CheckCircleOutlined, CloseCircleOutlined,
  WarningOutlined, InfoCircleOutlined, CheckOutlined, CloseOutlined,
  ArrowUpOutlined, ArrowDownOutlined, ArrowLeftOutlined, ArrowRightOutlined,
  ThunderboltOutlined, RocketOutlined, SafetyOutlined, ApiOutlined,
  BulbOutlined, UserOutlined, CodeOutlined, ShareAltOutlined,
  FlagOutlined, CalendarOutlined, LinkOutlined, StarOutlined,
  HeartOutlined, FireOutlined, TrophyOutlined, CrownOutlined,
  SettingOutlined, ToolOutlined, CloudOutlined, DatabaseOutlined,
  GlobalOutlined, MobileOutlined, DesktopOutlined, TabletOutlined,
  DollarOutlined, EuroOutlined, PoundOutlined, PercentageOutlined,
  RiseOutlined, FallOutlined, StockOutlined, FundOutlined,
  PieChartOutlined, BarChartOutlined, LineChartOutlined, DotChartOutlined,
  FileOutlined, FolderOutlined, CopyOutlined, DeleteOutlined,
  EditOutlined, SaveOutlined, SearchOutlined, FilterOutlined,
  PlusOutlined, MinusOutlined, QuestionOutlined, ExclamationOutlined,
  SyncOutlined, LoadingOutlined, ReloadOutlined, UndoOutlined,
  PlayCircleOutlined, PauseCircleOutlined, StopOutlined,
  MailOutlined, PhoneOutlined, MessageOutlined, CommentOutlined,
  LikeOutlined, DislikeOutlined, SmileOutlined, FrownOutlined,
  ClockCircleOutlined, ScheduleOutlined, HistoryOutlined,
  EnvironmentOutlined, HomeOutlined, ShopOutlined, BankOutlined,
  TeamIcon, UserAddOutlined, UserDeleteOutlined,
  SolutionOutlined, IdcardOutlined, ContactsOutlined,
  CarOutlined, SendOutlined, GiftOutlined, TagOutlined
};

// Slide native resolution: 1920x1080 (16:9)
// Display size: scale down to fit in list
const SLIDE_NATIVE_WIDTH = 1920;
const SLIDE_NATIVE_HEIGHT = 1080;
const SLIDE_DISPLAY_WIDTH = 1280;  // 1280x720 display size
const SLIDE_SCALE = SLIDE_DISPLAY_WIDTH / SLIDE_NATIVE_WIDTH;

export default function PreviewListPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [slides, setSlides] = useState<SlideData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus | null>(null);
  const [storyMeta, setStoryMeta] = useState<StoryMeta | null>(null);
  const [customTheme, setCustomTheme] = useState<CustomThemeData | null>(null);
  const [themeName, setThemeName] = useState<string>("businessLight");
  const [initialThemeName, setInitialThemeName] = useState<string | null>(null);
  const [availableThemes, setAvailableThemes] = useState<string[]>([]);
  const [projectThemes, setProjectThemes] = useState<Record<string, CustomThemeData>>({});

  // Fetch slides data
  const fetchSlides = useCallback(async () => {
    if (!projectId) return;

    try {
      const response = await fetch(`/api/slides/project/${projectId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }
      const data = await response.json();
      setSlides(data.slides || []);
      setPipelineStatus(data.pipelineStatus || null);
      setStoryMeta(data.storyMeta || null);
      // Load theme from API
      const loadedTheme = data.theme || "businessLight";
      if (!initialThemeName) {
        setThemeName(loadedTheme);
        setInitialThemeName(loadedTheme);
      }
      if (data.customTheme) {
        setCustomTheme(data.customTheme);
      }
      // Load available themes for selector
      if (data.availableThemes?.length) {
        setAvailableThemes(data.availableThemes);
      }
      // Load all project themes for client-side switching
      if (data.projectThemes) {
        setProjectThemes(data.projectThemes);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load slides");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Initial fetch
  useEffect(() => {
    fetchSlides();
  }, [fetchSlides]);

  // Auto-refresh via SSE when content.json changes
  useEffect(() => {
    if (!projectId) return;

    const eventSource = new EventSource(`/api/slides/project/${projectId}/watch`);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "update") {
          fetchSlides();
        }
      } catch {
        // Ignore parse errors
      }
    };

    eventSource.onerror = () => {
      // Reconnect handled automatically by EventSource
    };

    return () => eventSource.close();
  }, [projectId, fetchSlides]);

  // Get base theme, then override with custom colors if available
  const baseTheme = getTheme(themeName as "teamsDark" | "teamsLight" | "anthropicLight" | "anthropicDark" | "businessLight");
  
  // Check if the selected theme is a project theme
  const selectedProjectTheme = projectThemes[themeName];
  // Only use customTheme fallback if we're on the initial theme (from content.json)
  const activeCustomTheme = selectedProjectTheme || (themeName === initialThemeName ? customTheme : null);
  
  // Merge custom theme colors if from pptx template or project theme
  const theme = activeCustomTheme ? {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      bg: activeCustomTheme.colors?.bg || baseTheme.colors.bg,
      surface: activeCustomTheme.colors?.surface || baseTheme.colors.surface,
      surfaceAlt: activeCustomTheme.colors?.surfaceAlt || activeCustomTheme.colors?.surface || baseTheme.colors.surface,
      primary: activeCustomTheme.colors?.primary || baseTheme.colors.primary,
      secondary: activeCustomTheme.colors?.secondary || baseTheme.colors.secondary,
      accent: activeCustomTheme.colors?.accent || baseTheme.colors.accent,
      text: activeCustomTheme.colors?.text || baseTheme.colors.text,
      textMuted: activeCustomTheme.colors?.textMuted || baseTheme.colors.textMuted,
      border: activeCustomTheme.colors?.border || baseTheme.colors.border,
      // Semantic colors
      success: activeCustomTheme.colors?.success || baseTheme.colors.success,
      danger: activeCustomTheme.colors?.danger || baseTheme.colors.danger,
      warning: activeCustomTheme.colors?.warning || baseTheme.colors.warning,
      info: activeCustomTheme.colors?.info || baseTheme.colors.info,
    },
    typography: {
      ...baseTheme.typography,
      fontDisplay: activeCustomTheme.fonts?.display || baseTheme.typography.fontDisplay,
      fontBody: activeCustomTheme.fonts?.body || baseTheme.typography.fontBody,
      fontMono: activeCustomTheme.fonts?.mono || baseTheme.typography.fontMono,
      sizeDisplay: activeCustomTheme.typography?.sizeDisplay || baseTheme.typography.sizeDisplay,
      sizeHeading: activeCustomTheme.typography?.sizeHeading || baseTheme.typography.sizeHeading,
      sizeBody: activeCustomTheme.typography?.sizeBody || baseTheme.typography.sizeBody,
      sizeCaption: activeCustomTheme.typography?.sizeCaption || baseTheme.typography.sizeCaption,
      lineHeight: activeCustomTheme.typography?.lineHeight || baseTheme.typography.lineHeight,
    },
    visuals: activeCustomTheme.visuals ? {
      ...baseTheme.visuals,
      radius: { ...baseTheme.visuals?.radius, ...activeCustomTheme.visuals.radius },
      shadow: { ...baseTheme.visuals?.shadow, ...activeCustomTheme.visuals.shadow },
    } : baseTheme.visuals,
    background: {
      color: activeCustomTheme.background?.color || baseTheme.background?.color || baseTheme.colors.bg,
      image: activeCustomTheme.background?.image || baseTheme.background?.image,
    },
  } : baseTheme;
  
  // Get the slide background (gradient or solid color)
  const slideBackground = theme.background?.color || theme.colors.bg;
  
  // Get accent colors for CSS variables
  const accentColors = activeCustomTheme?.colors as Record<string, string> | undefined;
  const themeColors = theme.colors as Record<string, string>;
  
  // Build CSS variables for slide-frame (matches slides page)
  const slideVars = {
    '--theme-bg': theme.colors.bg,
    '--theme-surface': theme.colors.surface,
    '--theme-surface-alt': themeColors.surfaceAlt || theme.colors.surface,
    '--theme-primary': theme.colors.primary,
    '--theme-secondary': theme.colors.secondary || theme.colors.primary,
    '--theme-accent': theme.colors.accent || theme.colors.primary,
    '--theme-text': theme.colors.text,
    '--theme-text-muted': theme.colors.textMuted,
    '--theme-border': theme.colors.border || '#374151',
    // Semantic colors
    '--theme-success': themeColors.success || '#10b981',
    '--theme-danger': themeColors.danger || '#ef4444',
    '--theme-warning': themeColors.warning || '#f59e0b',
    '--theme-info': themeColors.info || '#3b82f6',
    // PowerPoint accent colors (accent1-accent6) for variety
    '--theme-accent1': accentColors?.accent1 || theme.colors.primary,
    '--theme-accent2': accentColors?.accent2 || theme.colors.secondary || theme.colors.primary,
    '--theme-accent3': accentColors?.accent3 || theme.colors.accent || theme.colors.primary,
    '--theme-accent4': accentColors?.accent4 || themeColors.info || '#3b82f6',
    '--theme-accent5': accentColors?.accent5 || '#a855f7',
    '--theme-accent6': accentColors?.accent6 || '#22c55e',
    // Typography sizes
    '--theme-size-display': theme.typography.sizeDisplay,
    '--theme-size-heading': theme.typography.sizeHeading,
    '--theme-size-body': theme.typography.sizeBody,
    '--theme-size-caption': theme.typography.sizeCaption,
    // Typography fonts
    '--theme-font-display': theme.typography.fontDisplay,
    '--theme-font-body': theme.typography.fontBody,
    '--theme-font-mono': theme.typography.fontMono || "'JetBrains Mono', monospace",
    // Line height
    '--theme-line-height': theme.typography.lineHeight || '1.3',
    // Shadows
    '--theme-shadow-sm': theme.visuals?.shadow?.sm || '0 1px 2px rgba(0, 0, 0, 0.05)',
    '--theme-shadow-md': theme.visuals?.shadow?.md || '0 4px 12px rgba(0, 0, 0, 0.08)',
    '--theme-shadow-lg': theme.visuals?.shadow?.lg || '0 8px 24px rgba(0, 0, 0, 0.12)',
    // Border radius
    '--theme-radius-sm': theme.visuals?.radius?.sm || '4px',
    '--theme-radius-md': theme.visuals?.radius?.md || '8px',
    '--theme-radius-lg': theme.visuals?.radius?.lg || '12px',
  } as React.CSSProperties;

  // Render a single slide
  const renderSlide = (slide: SlideData) => {
    const hasContent = slide.jsx && slide.jsx.trim();
    const isDraft = slide.state === "draft";

    if (!hasContent) {
      // Show placeholder with story content
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
            color: "#888",
            padding: "2rem",
            gap: "1rem",
          }}
        >
          <div
            style={{
              background: "rgba(59, 130, 246, 0.2)",
              color: "#60a5fa",
              padding: "0.25rem 0.75rem",
              borderRadius: "9999px",
              fontSize: "0.75rem",
              fontWeight: 500,
            }}
          >
            {pipelineStatus?.phase === "storyline" ? "Story ready, layout pending..." : "Generating..."}
          </div>

          {slide.intent && (
            <div style={{ color: "#666", fontSize: "0.7rem", textTransform: "uppercase" }}>
              Intent: {slide.intent}
            </div>
          )}

          {slide.story && (
            <div
              style={{
                maxWidth: "80%",
                textAlign: "center",
                color: "#aaa",
                fontSize: "0.9rem",
                lineHeight: 1.6,
              }}
            >
              {slide.story}
            </div>
          )}

          <div style={{ marginTop: "1rem" }}>
            <LoadingOutlined style={{ fontSize: "1.5rem", color: "#3b82f6" }} />
          </div>
        </div>
      );
    }

    // If draft (regenerating), show content with overlay
    if (isDraft) {
      return (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <JsxParser
            jsx={slide.jsx}
            components={availableComponents}
            renderInWrapper={false}
            autoCloseVoidElements
            renderError={({ error }) => (
              <div style={{ color: "#ef4444", padding: "1rem", fontSize: "0.8rem" }}>
                <strong>Render Error:</strong> {error}
              </div>
            )}
          />
          {/* Regenerating overlay */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.6)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.75rem",
            }}
          >
            <LoadingOutlined style={{ fontSize: "2rem", color: "#3b82f6" }} />
            <div
              style={{
                background: "rgba(59, 130, 246, 0.3)",
                color: "#93c5fd",
                padding: "0.5rem 1rem",
                borderRadius: "9999px",
                fontSize: "0.9rem",
                fontWeight: 500,
              }}
            >
              Regenerating...
            </div>
          </div>
        </div>
      );
    }

    return (
      <JsxParser
        jsx={slide.jsx}
        components={availableComponents}
        renderInWrapper={false}
        autoCloseVoidElements
        renderError={({ error }) => (
          <div style={{ color: "#ef4444", padding: "1rem", fontSize: "0.8rem" }}>
            <strong>Render Error:</strong> {error}
          </div>
        )}
      />
    );
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          color: "#888",
        }}
      >
        <LoadingOutlined style={{ fontSize: "2rem", marginRight: "1rem" }} />
        Loading slides...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          color: "#ef4444",
        }}
      >
        Error: {error}
      </div>
    );
  }

  // CSS for slide-frame (matches slides page)
  const slideFrameStyles = `
    /* Main content wrapper from JSX - MUST fill slide */
    .slide-frame > div.h-full,
    .slide-frame > div[class*="h-full"] {
      height: 100% !important;
      min-height: 100% !important;
    }
    /* All direct children after title stretch to fill */
    .slide-frame > * {
      flex-shrink: 0;
    }
    /* Make grid and flex containers fill remaining space */
    .slide-frame > div.grid:not(.h-full),
    .slide-frame > .grid:not(.h-full),
    .slide-frame > div[class*="grid-cols"]:not([class*="h-full"]) {
      flex: 1 1 auto !important;
      min-height: 0;
      align-items: stretch;
      gap: 32px !important;
    }
    .slide-frame .grid > * {
      height: 100% !important;
      display: flex;
      flex-direction: column;
    }
    .slide-frame * { box-sizing: border-box; }
    .slide-frame > div { display: flex !important; flex-direction: column !important; height: 100% !important; gap: 24px !important; }
    .slide-frame .flex { display: flex !important; }
    .slide-frame .flex-col { flex-direction: column !important; }
    .slide-frame .flex-row { flex-direction: row !important; }
    .slide-frame .flex-1 { flex: 1 1 0% !important; }
    .slide-frame .items-center { align-items: center !important; }
    .slide-frame .items-start { align-items: flex-start !important; }
    .slide-frame .items-end { align-items: flex-end !important; }
    .slide-frame .justify-center { justify-content: center !important; }
    .slide-frame .justify-between { justify-content: space-between !important; }
    .slide-frame .justify-start { justify-content: flex-start !important; }
    .slide-frame .justify-end { justify-content: flex-end !important; }
    .slide-frame .gap-2 { gap: 0.5rem !important; }
    .slide-frame .gap-3 { gap: 0.75rem !important; }
    .slide-frame .gap-4 { gap: 1rem !important; }
    .slide-frame .gap-6 { gap: 1.5rem !important; }
    .slide-frame .gap-8 { gap: 2rem !important; }
    .slide-frame .grid { display: grid !important; }
    .slide-frame .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)) !important; }
    .slide-frame .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
    .slide-frame .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
    .slide-frame .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
    .slide-frame .col-span-1 { grid-column: span 1 / span 1 !important; }
    .slide-frame .col-span-2 { grid-column: span 2 / span 2 !important; }
    .slide-frame .col-span-3 { grid-column: span 3 / span 3 !important; }
    .slide-frame .col-span-full { grid-column: 1 / -1 !important; }
    .slide-frame .h-full { height: 100% !important; }
    .slide-frame .w-full { width: 100% !important; }
    .slide-frame .text-6xl { font-size: 5rem !important; }
    .slide-frame .text-5xl { font-size: 4rem !important; }
    .slide-frame .text-4xl { font-size: 3rem !important; }
    .slide-frame .text-3xl { font-size: 2.25rem !important; }
    .slide-frame .text-2xl { font-size: 1.75rem !important; }
    .slide-frame .text-xl { font-size: 1.25rem !important; }
    .slide-frame .font-bold { font-weight: 700 !important; }
    .slide-frame .font-semibold { font-weight: 600 !important; }
    .slide-frame .text-center { text-align: center !important; }
    .slide-frame .p-4 { padding: 1rem !important; }
    .slide-frame .p-6 { padding: 1.5rem !important; }
    .slide-frame .p-8 { padding: 2rem !important; }
    .slide-frame .rounded-lg { border-radius: 0.5rem !important; }
    .slide-frame .rounded-xl { border-radius: 0.75rem !important; }
    .slide-frame .shadow-lg { box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1) !important; }
    /* Alert severity coloring - dynamically use theme semantic colors */
    .slide-frame [data-severity="error"],
    .slide-frame [data-severity="danger"] {
      background: linear-gradient(180deg, #fff5f5 0%, #fee2e2 100%) !important;
    }
    .slide-frame [data-severity="success"] {
      background: linear-gradient(180deg, #f0fff4 0%, #dcfce7 100%) !important;
    }
    .slide-frame [data-severity="info"] {
      background: linear-gradient(180deg, #eff6ff 0%, #dbeafe 100%) !important;
    }
  `;

  // Helper to process slide JSX (matches slides page)
  const processSlideJsx = (jsx: string): { jsx: string; backgroundImage: string | null } => {
    // Remove Slide tags
    let processed = jsx.replace(/<Slide[^>]*>\s*/g, '').replace(/\s*<\/Slide>/g, '');
    
    // Transform relative image paths to full API paths
    // images/filename.jpg → /api/project-image/{projectId}/images/filename.jpg
    // /images/filename.jpg → /api/project-image/{projectId}/images/filename.jpg
    processed = processed.replace(
      /src=["']\/?images\/([^"']+)["']/g,
      `src="/api/project-image/${projectId}/images/$1"`
    );
    
    // Extract background image from JSX
    const bgMatch = processed.match(/<div[^>]*className="absolute inset-0"[^>]*>\s*<img\s+src="([^"]+)"[^>]*\/>\s*<\/div>/);
    let backgroundImage = bgMatch ? bgMatch[1] : null;
    
    // If no background in JSX, use theme's background image
    if (!backgroundImage && activeCustomTheme?.background?.image) {
      const bgImagePath = activeCustomTheme.background.image;
      const filename = bgImagePath.startsWith('images/') ? bgImagePath.substring(7) : bgImagePath;
      backgroundImage = `/api/project-image/${projectId}/images/${filename}`;
    }
    
    // Remove background wrapper from JSX if found
    if (bgMatch) {
      processed = processed.replace(/<div[^>]*className="absolute inset-0"[^>]*>\s*<img[^>]*\/>\s*<\/div>/g, '');
      processed = processed.replace(/<div[^>]*className="relative h-full"[^>]*>\s*(<div[^>]*className="relative z-10[^"]*")/g, '$1');
      processed = processed.replace(/(<\/div>)\s*<\/div>\s*$/, '$1');
    }
    
    return { jsx: processed, backgroundImage };
  };

  return (
    <HeroUIProvider>
      <ComponentConfigProvider defaultMode="custom">
        <ThemeProvider theme={theme}>
          <AntProvider>
            <style dangerouslySetInnerHTML={{ __html: slideFrameStyles }} />
            <div
              style={{
                minHeight: "100vh",
                background: "#111",
                padding: "2rem",
              }}
            >
              {/* Header */}
              <div
                style={{
                  maxWidth: `${SLIDE_DISPLAY_WIDTH}px`,
                  margin: "0 auto 2rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <h1 style={{ color: "#fff", fontSize: "1.5rem", margin: 0 }}>
                    {storyMeta?.title || projectId}
                  </h1>
                  {storyMeta?.subtitle && (
                    <p style={{ color: "#888", fontSize: "0.9rem", margin: "0.25rem 0 0" }}>
                      {storyMeta.subtitle}
                    </p>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  {pipelineStatus && (
                    <div
                      style={{
                        background: pipelineStatus.phase === "complete" ? "rgba(34, 197, 94, 0.2)" : "rgba(59, 130, 246, 0.2)",
                        color: pipelineStatus.phase === "complete" ? "#22c55e" : "#60a5fa",
                        padding: "0.25rem 0.75rem",
                        borderRadius: "9999px",
                        fontSize: "0.75rem",
                        fontWeight: 500,
                      }}
                    >
                      {pipelineStatus.phase === "complete"
                        ? `${pipelineStatus.totalSlides} slides`
                        : `${pipelineStatus.slidesWithMdx}/${pipelineStatus.totalSlides} ready`}
                    </div>
                  )}

                  <a
                    href={`/slides/${projectId}`}
                    style={{
                      color: "#60a5fa",
                      fontSize: "0.8rem",
                      textDecoration: "none",
                    }}
                  >
                    Slideshow view →
                  </a>
                </div>
              </div>

              {/* Theme Selector */}
              <ThemeSelector
                themeName={themeName}
                onThemeChange={setThemeName}
                availableThemes={availableThemes}
                position="bottom-right"
                defaultCollapsed={false}
              />

              {/* Slides List */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "2rem",
                }}
              >
                {slides.length === 0 ? (
                  <div style={{ color: "#888", padding: "4rem", textAlign: "center" }}>
                    <LoadingOutlined style={{ fontSize: "2rem", marginBottom: "1rem", display: "block" }} />
                    Waiting for slides...
                  </div>
                ) : (
                  slides.map((slide) => {
                    // Process JSX for this slide
                    const { jsx: processedJsx, backgroundImage } = slide.jsx 
                      ? processSlideJsx(slide.jsx) 
                      : { jsx: '', backgroundImage: null };
                    
                    return (
                    <div
                      key={slide.id}
                      style={{
                        width: `${SLIDE_DISPLAY_WIDTH}px`,
                        background: "#1a1a1a",
                        borderRadius: "8px",
                        overflow: "hidden",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
                      }}
                    >
                      {/* Slide number badge */}
                      <div
                        style={{
                          background: "#222",
                          padding: "0.5rem 1rem",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          borderBottom: "1px solid #333",
                        }}
                      >
                        <span style={{ color: "#888", fontSize: "0.8rem" }}>
                          Slide {slide.slideNumber}
                        </span>
                        {slide.intent && (
                          <span
                            style={{
                              color: "#666",
                              fontSize: "0.7rem",
                              textTransform: "uppercase",
                              background: "#2a2a2a",
                              padding: "0.15rem 0.5rem",
                              borderRadius: "4px",
                            }}
                          >
                            {slide.intent}
                          </span>
                        )}
                      </div>

                      {/* Slide content - native 1920x1080 scaled down */}
                      <div
                        style={{
                          width: `${SLIDE_DISPLAY_WIDTH}px`,
                          height: `${SLIDE_DISPLAY_WIDTH * 9 / 16}px`,
                          overflow: "hidden",
                          position: "relative",
                        }}
                      >
                        <div
                          className="slide-frame"
                          style={{
                            ...slideVars,
                            width: `${SLIDE_NATIVE_WIDTH}px`,
                            height: `${SLIDE_NATIVE_HEIGHT}px`,
                            transform: `scale(${SLIDE_SCALE})`,
                            transformOrigin: "top left",
                            background: slideBackground,
                            color: theme.colors.text,
                            fontSize: theme.typography.sizeBody,
                            fontFamily: theme.typography.fontBody,
                            position: "absolute",
                            top: 0,
                            left: 0,
                            overflow: "hidden",
                          }}
                        >
                          {/* Background image - full bleed at frame level */}
                          {backgroundImage && (
                            <img 
                              src={backgroundImage} 
                              alt="Slide background" 
                              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }} 
                            />
                          )}
                          {/* Content wrapper with padding */}
                          <div style={{ position: "relative", zIndex: 1, width: "100%", height: "100%", padding: "72px 96px", display: "flex", flexDirection: "column", gap: "24px", justifyContent: "center" }}>
                            {processedJsx.trim() ? (
                              <JsxParser
                                jsx={processedJsx}
                                components={availableComponents}
                                renderInWrapper={false}
                                allowUnknownElements={true}
                                onError={(e) => console.error("JSX Parse error:", e)}
                              />
                            ) : (
                              renderSlide(slide)
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )})
                )}
              </div>

              {/* Footer */}
              <div
                style={{
                  maxWidth: `${SLIDE_DISPLAY_WIDTH}px`,
                  margin: "2rem auto 0",
                  textAlign: "center",
                  color: "#666",
                  fontSize: "0.8rem",
                }}
              >
                {pipelineStatus?.phase !== "complete" && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                    <SyncOutlined spin style={{ color: "#3b82f6" }} />
                    Auto-refreshing every 3 seconds...
                  </div>
                )}
              </div>
              
              {/* Component Mode Toggle */}
              <ComponentModeToggle />
            </div>
          </AntProvider>
        </ThemeProvider>
      </ComponentConfigProvider>
    </HeroUIProvider>
  );
}
