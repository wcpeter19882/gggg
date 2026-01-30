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

interface SlideData { slideNumber: number; id: string; jsx: string; story: string; }
interface ApiResponse { slides: SlideData[]; slideCount: number; theme: string; projectId: string; error?: string; }

// Map components for JsxParser - includes both Ant Design and HeroUI
const components = {
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
  const [slideScale, setSlideScale] = useState(1);
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

  useEffect(() => {
    async function loadSlides() {
      if (!projectId) { setError("No project ID"); setLoading(false); return; }
      try {
        const response = await fetch(`/api/slides/project/${projectId}`);
        const data: ApiResponse = await response.json();
        if (data.error) throw new Error(data.error);
        if (!data.slides?.length) throw new Error("No slides found");
        setSlides(data.slides);
        setThemeName(data.theme || "businessLight");
        setLoading(false);
      } catch (err) { setError(err instanceof Error ? err.message : "Failed"); setLoading(false); }
    }
    loadSlides();
  }, [projectId]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); setCurrentSlide(prev => Math.min(prev + 1, slides.length - 1)); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); setCurrentSlide(prev => Math.max(prev - 1, 0)); }
  }, [slides.length]);

  useEffect(() => { window.addEventListener("keydown", handleKeyDown); return () => window.removeEventListener("keydown", handleKeyDown); }, [handleKeyDown]);

  const theme = getTheme(themeName as "teamsDark" | "teamsLight" | "anthropicLight" | "anthropicDark" | "businessLight");

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0a0a0a", color: "#fff" }}>Loading {projectId}...</div>;
  if (error) return <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0a0a0a", color: "#f44" }}><div>Error: {error}</div><div style={{color:"#888",marginTop:"1rem"}}>Project: {projectId}</div></div>;
  if (!slides.length) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0a0a0a", color: "#ff0" }}>No slides</div>;

  // Build CSS variables for slide-frame
  const slideVars = {
    '--theme-bg': theme.colors.bg,
    '--theme-surface': theme.colors.surface,
    '--theme-primary': theme.colors.primary,
    '--theme-text': theme.colors.text,
    '--theme-text-muted': theme.colors.textMuted,
    '--theme-size-display': theme.typography.sizeDisplay,
    '--theme-size-heading': theme.typography.sizeHeading,
    '--theme-size-body': theme.typography.sizeBody,
    '--theme-size-caption': theme.typography.sizeCaption,
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
          `}</style>
          <div ref={containerRef} style={{ width: "100vw", height: "100vh", overflow: "hidden", background: "#0a0a0a" }}>
            {slides.map((slide, index) => {
              // Strip <Slide> wrapper if present - we use slide-frame as the container
              const jsx = slide.jsx
                .replace(/<Slide[^>]*>\s*/g, '')
                .replace(/\s*<\/Slide>/g, '');
              return (
              <div key={slide.id} style={{ display: index === currentSlide ? "flex" : "none", width: "100%", height: "100%", alignItems: "center", justifyContent: "center" }}>
                <div className="slide-frame" style={{ ...slideVars, width: "1920px", height: "1080px", padding: "72px 96px", background: theme.colors.bg, color: theme.colors.text, fontSize: theme.typography.sizeBody, fontFamily: theme.typography.fontBody, display: "flex", flexDirection: "column", gap: "24px", justifyContent: "center", borderRadius: "4px", boxShadow: "0 8px 32px rgba(0,0,0,0.3)", overflow: "hidden", transform: `scale(${slideScale})`, transformOrigin: "center center", flexShrink: 0 }}>
                  <JsxParser
                    components={components}
                    jsx={jsx}
                    renderInWrapper={false}
                    allowUnknownElements={true}
                    onError={(e) => console.error("JSX Parse error:", e)}
                  />
                </div>
              </div>
              );
            })}
            {/* Theme Selector */}
            <ThemeSelector themeName={themeName} onThemeChange={setThemeName} />
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