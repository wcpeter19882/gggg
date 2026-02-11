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

interface SlideData { slideNumber: number; id: string; jsx: string; story: string; intent?: string; density?: string; }

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

// Theme data structure from project .ts files (loaded by API)
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
interface ApiResponse { 
  slides: SlideData[]; 
  slideCount: number; 
  theme: string; 
  projectId: string; 
  error?: string; 
  customTheme?: CustomThemeData;
  availableThemes?: string[];
  projectThemes?: Record<string, CustomThemeData>;
  pipelineStatus?: PipelineStatus;
  storyMeta?: StoryMeta;
}

// Map components for JsxParser - includes both Ant Design and HeroUI
const components = {
  // HTML elements for links and formatting
  a: 'a' as unknown as React.ComponentType,
  sup: 'sup' as unknown as React.ComponentType,
  sub: 'sub' as unknown as React.ComponentType,
  br: 'br' as unknown as React.ComponentType,
  span: 'span' as unknown as React.ComponentType,
  strong: 'strong' as unknown as React.ComponentType,
  em: 'em' as unknown as React.ComponentType,
  
  // Ant Design components
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
  
  // HeroUI components for flexible layout
  HCard, CardHeader, CardBody, CardFooter,
  Chip, Button, Avatar, HDivider, HProgress, HBadge,
  FlexRow, FlexCol, Grid, Center,
  
  // Ant Design Icons
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

export default function ProjectSlidesPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [themeName, setThemeName] = useState("businessLight");
  const [initialThemeName, setInitialThemeName] = useState<string | null>(null); // Track the theme from content.json
  const [customTheme, setCustomTheme] = useState<CustomThemeData | null>(null);
  const [availableThemes, setAvailableThemes] = useState<string[]>([]);
  const [projectThemes, setProjectThemes] = useState<Record<string, CustomThemeData>>({});
  const [slideScale, setSlideScale] = useState(1);
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus | null>(null);
  const [storyMeta, setStoryMeta] = useState<StoryMeta | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Calculate scale to fit 1920x1080 in viewport while maintaining aspect ratio
  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const vw = window.innerWidth - 48; // padding
        const vh = window.innerHeight - 48;
        const scaleX = vw / 1920;
        const scaleY = vh / 1080;
        setSlideScale(Math.min(scaleX, scaleY, 1)); // Cap at 1x
      }
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  // Load slides function (extracted for reuse)
  const fetchSlides = useCallback(async () => {
    if (!projectId) { setError("No project ID"); setLoading(false); return; }
    try {
      const response = await fetch(`/api/slides/project/${projectId}`);
      const data: ApiResponse = await response.json();
      
      // Update pipeline status (even if no slides yet)
      if (data.pipelineStatus) {
        setPipelineStatus(data.pipelineStatus);
      }
      if (data.storyMeta) {
        setStoryMeta(data.storyMeta);
      }
      
      // Handle case where there are no slides or all slides lack MDX
      if (!data.slides?.length) {
        // If we have pipeline status, don't treat as error - show progress view
        if (data.pipelineStatus && data.pipelineStatus.phase !== "complete") {
          setSlides([]);
          setLoading(false);
          return;
        }
        throw new Error("No slides found");
      }
      
      setSlides(data.slides);
      const loadedTheme = data.theme || "businessLight";
      setThemeName(loadedTheme);
      setInitialThemeName(loadedTheme); // Remember the initial theme from content.json
      // Store custom theme if provided (from pptx extraction)
      if (data.customTheme) {
        setCustomTheme(data.customTheme);
      }
      // Store available themes for project
      if (data.availableThemes?.length) {
        setAvailableThemes(data.availableThemes);
      }
      // Store all project themes for client-side switching
      if (data.projectThemes) {
        setProjectThemes(data.projectThemes);
      }
      setLoading(false);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed"); setLoading(false); }
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

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); setCurrentSlide(prev => Math.min(prev + 1, slides.length - 1)); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); setCurrentSlide(prev => Math.max(prev - 1, 0)); }
  }, [slides.length]);

  useEffect(() => { window.addEventListener("keydown", handleKeyDown); return () => window.removeEventListener("keydown", handleKeyDown); }, [handleKeyDown]);

  // Get base theme, then override with custom colors if available
  const baseTheme = getTheme(themeName as "teamsDark" | "teamsLight" | "anthropicLight" | "anthropicDark" | "businessLight");
  
  // Check if the selected theme is a project theme
  const selectedProjectTheme = projectThemes[themeName];
  // Only use customTheme fallback if we're on the initial theme (from content.json)
  // This ensures switching to a built-in theme uses that theme's colors, not the custom colors
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

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0a0a0a", color: "#fff" }}>Loading {projectId}...</div>;
  if (error) return <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0a0a0a", color: "#f44" }}><div>Error: {error}</div><div style={{color:"#888",marginTop:"1rem"}}>Project: {projectId}</div></div>;
  if (!slides.length) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0a0a0a", color: "#ff0" }}>No slides</div>;

  // Build CSS variables for slide-frame
  // Get accent colors from active custom theme (pptx extracts accent1-accent6)
  const accentColors = activeCustomTheme?.colors as Record<string, string> | undefined;
  const themeColors = theme.colors as Record<string, string>;
  
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
    // Semantic colors - use theme values (already merged from customTheme)
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

  return (
    <HeroUIProvider>
      <ComponentConfigProvider defaultMode="custom">
        <ThemeProvider theme={theme}>
          <AntProvider>
          {/* Slide layout styles - grid and flex layout helpers */}
          <style>{`
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
            /* Flex containers fill space */
            .slide-frame > div.flex:not(.h-full),
            .slide-frame > div[class*="flex gap"]:not([class*="h-full"]) {
              flex: 1 !important;
              align-items: stretch;
            }
            /* Only layout divs inside flex should become flex columns, not content elements */
            .slide-frame .flex > div:not(.grid):not([class*="grid-cols"]):not([class*="Paragraph"]):not([class*="text-"]):not([class*="max-w-"]):not([class*="Steps"]):not([class*="Timeline"]) {
              display: flex;
              flex-direction: column;
            }
            /* Ensure Typography elements stay block/inline, not flex */
            .slide-frame [class*="Paragraph"] {
              display: block !important;
            }
            .slide-frame [class*="Text_text"] {
              display: inline !important;
            }
            /* Ensure Steps and Timeline keep their own flex-direction */
            .slide-frame [class*="Steps_horizontal"] {
              flex-direction: row !important;
            }
            .slide-frame [class*="Timeline_horizontal"] {
              flex-direction: row !important;
            }
            /* Ensure grid containers keep display: grid */
            .slide-frame .grid,
            .slide-frame [class*="grid-cols"] {
              display: grid !important;
            }
            /* Grid column templates - hardcoded for dynamic JSX content */
            .slide-frame .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)) !important; }
            .slide-frame .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
            .slide-frame .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
            .slide-frame .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
            .slide-frame .grid-cols-5 { grid-template-columns: repeat(5, minmax(0, 1fr)) !important; }
            .slide-frame .grid-cols-6 { grid-template-columns: repeat(6, minmax(0, 1fr)) !important; }
            .slide-frame .grid-cols-10 { grid-template-columns: repeat(10, minmax(0, 1fr)) !important; }
            .slide-frame .grid-cols-12 { grid-template-columns: repeat(12, minmax(0, 1fr)) !important; }
            /* Column spans */
            .slide-frame .col-span-1 { grid-column: span 1 / span 1 !important; }
            .slide-frame .col-span-2 { grid-column: span 2 / span 2 !important; }
            .slide-frame .col-span-3 { grid-column: span 3 / span 3 !important; }
            .slide-frame .col-span-4 { grid-column: span 4 / span 4 !important; }
            .slide-frame .col-span-5 { grid-column: span 5 / span 5 !important; }
            .slide-frame .col-span-6 { grid-column: span 6 / span 6 !important; }
            .slide-frame .col-span-7 { grid-column: span 7 / span 7 !important; }
            .slide-frame .col-span-8 { grid-column: span 8 / span 8 !important; }
            .slide-frame .col-span-9 { grid-column: span 9 / span 9 !important; }
            .slide-frame .col-span-10 { grid-column: span 10 / span 10 !important; }
            .slide-frame .col-span-full { grid-column: 1 / -1 !important; }
            /* Row spans */
            .slide-frame .row-span-2 { grid-row: span 2 / span 2 !important; }
            .slide-frame .row-span-3 { grid-row: span 3 / span 3 !important; }
            /* HeroUI Card fills its container */
            .slide-frame > div > div[class*="overflow-hidden"],
            .slide-frame .grid > div {
              height: 100% !important;
              display: flex !important;
              flex-direction: column !important;
            }
            /* Card body fills the card */
            .slide-frame [class*="box-border"] > section,
            .slide-frame [class*="box-border"] > div[class*="p-"] {
              flex: 1 !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
            }
            /* List inside card fills available space */
            .slide-frame .ant-list {
              flex: 1;
              display: flex;
              flex-direction: column;
            }
            .slide-frame .ant-spin-nested-loading,
            .slide-frame .ant-spin-container {
              flex: 1;
              display: flex;
              flex-direction: column;
              justify-content: space-evenly;
            }
            /* Chips minimum readable size - use theme variable */
            .slide-frame .ant-tag,
            .slide-frame [class*="chip"] {
              font-size: calc(var(--theme-size-body, 36px) * 0.8) !important;
              padding: 10px 20px !important;
              border-radius: var(--theme-radius-md, 8px) !important;
            }
            /* Statistic component - make value prominent */
            .slide-frame [class*="statistic"] [class*="valueText"] {
              font-size: 4rem !important;
              font-weight: 800 !important;
            }
            .slide-frame [class*="statistic"] [class*="prefix"],
            .slide-frame [class*="statistic"] [class*="suffix"] {
              font-size: 2rem !important;
            }
            .slide-frame [class*="statistic"] [class*="title"] {
              font-size: 1rem !important;
              margin-top: 0.5rem;
            }
            /* Emoji icons - make visible */
            .slide-frame .text-6xl { font-size: 5rem !important; line-height: 1; }
            .slide-frame .text-5xl { font-size: 4rem !important; line-height: 1; }
            .slide-frame .text-4xl { font-size: 3rem !important; line-height: 1; }
            .slide-frame .text-3xl { font-size: 2.25rem !important; line-height: 1; }
            .slide-frame .text-2xl { font-size: 1.75rem !important; line-height: 1.2; }
            /* Background tints for cards with gradients */
            .slide-frame .bg-red-50 {
              background: linear-gradient(180deg, #fff5f5 0%, #fee2e2 100%) !important;
            }
            .slide-frame .bg-green-50 {
              background: linear-gradient(180deg, #f0fff4 0%, #dcfce7 100%) !important;
            }
            .slide-frame .bg-blue-50 {
              background: linear-gradient(180deg, #eff6ff 0%, #dbeafe 100%) !important;
            }
            /* Alert at bottom of card */
            .slide-frame .ant-alert {
              margin-top: auto !important;
            }
            /* Pulse animation for loading indicators */
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.5; }
            }
          `}</style>
          <div ref={containerRef} style={{ width: "100vw", height: "100vh", overflow: "hidden", background: "#0a0a0a" }}>
            {slides.map((slide, index) => {
              // Strip <Slide> wrapper if present - we use slide-frame as the container
              let jsx = slide.jsx
                .replace(/<Slide[^>]*>\s*/g, '')
                .replace(/\s*<\/Slide>/g, '');
              
              // Transform relative image paths to full API paths
              // images/filename.jpg → /api/project-image/{projectId}/images/filename.jpg
              // /images/filename.jpg → /api/project-image/{projectId}/images/filename.jpg
              jsx = jsx.replace(
                /src=["']\/?images\/([^"']+)["']/g,
                `src="/api/project-image/${projectId}/images/$1"`
              );
              
              // Extract background image from JSX (pattern: <div className="absolute inset-0"><img src="..." /></div>)
              // This allows backgrounds to render at frame level, outside padding
              const bgMatch = jsx.match(/<div[^>]*className="absolute inset-0"[^>]*>\s*<img\s+src="([^"]+)"[^>]*\/>\s*<\/div>/);
              let backgroundImage = bgMatch ? bgMatch[1] : null;
              
              // If no background in JSX, use theme's background image for ALL slides
              if (!backgroundImage && activeCustomTheme?.background?.image) {
                // activeCustomTheme.background.image is like "images/cover_01_bg.png"
                // API route is /api/project-image/{projectId}/images/{filename}
                // So we need to extract just the filename or use the full path correctly
                const bgImagePath = activeCustomTheme.background.image;
                // If path starts with "images/", the API route adds /images/ so we need the filename only
                const filename = bgImagePath.startsWith('images/') ? bgImagePath.substring(7) : bgImagePath;
                backgroundImage = `/api/project-image/${projectId}/images/${filename}`;
              }
              
              // If background found in JSX, remove the background wrapper and the outer relative container
              if (bgMatch) {
                // Remove the absolute inset-0 wrapper with img
                jsx = jsx.replace(/<div[^>]*className="absolute inset-0"[^>]*>\s*<img[^>]*\/>\s*<\/div>/g, '');
                // Remove outer relative h-full wrapper if present, keep inner content
                jsx = jsx.replace(/<div[^>]*className="relative h-full"[^>]*>\s*(<div[^>]*className="relative z-10[^"]*")/g, '$1');
                // Remove closing div for the outer wrapper
                jsx = jsx.replace(/(<\/div>)\s*<\/div>\s*$/, '$1');
              }
              
              return (
              <div key={slide.id} style={{ display: index === currentSlide ? "flex" : "none", width: "100%", height: "100%", alignItems: "center", justifyContent: "center" }}>
                <div className="slide-frame" style={{ ...slideVars, width: "1920px", height: "1080px", position: "relative", background: slideBackground, color: theme.colors.text, fontSize: theme.typography.sizeBody, fontFamily: theme.typography.fontBody, borderRadius: "4px", boxShadow: "0 8px 32px rgba(0,0,0,0.3)", overflow: "hidden", transform: `scale(${slideScale})`, transformOrigin: "center center", flexShrink: 0 }}>
                  {/* Background image rendered at frame level - full bleed */}
                  {backgroundImage && (
                    <img 
                      src={backgroundImage} 
                      alt="Slide background" 
                      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }} 
                    />
                  )}
                  {/* Content wrapper with padding */}
                  <div style={{ position: "relative", zIndex: 1, width: "100%", height: "100%", padding: "72px 96px", display: "flex", flexDirection: "column", gap: "24px", justifyContent: "center" }}>
                    {jsx.trim() ? (
                      <JsxParser
                        components={components}
                        jsx={jsx}
                        renderInWrapper={false}
                        allowUnknownElements={true}
                        onError={(e) => console.error("JSX Parse error:", e)}
                      />
                    ) : (
                      /* Show story and status when MDX is not ready */
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "2rem" }}>
                        {/* Status badge */}
                        <div style={{ 
                          display: "flex", alignItems: "center", gap: "0.75rem",
                          background: "rgba(245, 158, 11, 0.1)", 
                          padding: "0.75rem 1.5rem", borderRadius: "2rem",
                          border: "1px solid rgba(245, 158, 11, 0.3)"
                        }}>
                          <div style={{ 
                            width: "12px", height: "12px", borderRadius: "50%", 
                            background: "#f59e0b",
                            animation: "pulse 1.5s infinite"
                          }} />
                          <span style={{ color: "#f59e0b", fontSize: "1.25rem", fontWeight: 500 }}>
                            {pipelineStatus?.phase === "storyline" ? "Generating Layout..." : "Generating Layout..."}
                          </span>
                        </div>
                        
                        {/* Intent badge */}
                        {slide.intent && (
                          <div style={{ 
                            fontSize: "1rem", padding: "0.5rem 1rem", 
                            background: "rgba(59, 130, 246, 0.1)", 
                            borderRadius: "0.5rem", 
                            color: "#3b82f6",
                            textTransform: "uppercase",
                            letterSpacing: "0.1em"
                          }}>
                            {slide.intent}
                          </div>
                        )}
                        
                        {/* Story content */}
                        <div style={{ 
                          maxWidth: "900px", textAlign: "center",
                          padding: "2rem", 
                          background: "rgba(255,255,255,0.03)", 
                          borderRadius: "1rem",
                          border: "1px solid rgba(255,255,255,0.1)"
                        }}>
                          <p style={{ 
                            fontSize: "2rem", lineHeight: 1.6, margin: 0,
                            color: theme.colors.textMuted
                          }}>
                            {slide.story || "Waiting for content..."}
                          </p>
                        </div>
                        
                        {/* Progress indicator */}
                        {pipelineStatus && (
                          <div style={{ color: theme.colors.textMuted, fontSize: "1rem" }}>
                            {pipelineStatus.slidesWithMdx} / {pipelineStatus.totalSlides} slides ready
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              );
            })}
            {/* Theme Selector */}
            <ThemeSelector themeName={themeName} onThemeChange={setThemeName} availableThemes={availableThemes} />
            {/* Component Mode Toggle */}
            <div style={{ position: "fixed", bottom: "1rem", left: "1rem" }}>
              <ComponentModeToggle />
            </div>
            {/* Slide Counter */}
            <div style={{ position: "fixed", bottom: "1rem", right: "1rem", background: "rgba(0,0,0,0.8)", padding: "0.5rem 1rem", borderRadius: "4px", color: "#fff", fontSize: "0.875rem" }}>{currentSlide + 1} / {slides.length}</div>
          </div>
        </AntProvider>
      </ThemeProvider>
      </ComponentConfigProvider>
    </HeroUIProvider>
  );
}