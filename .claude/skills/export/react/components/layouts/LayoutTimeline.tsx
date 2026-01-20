/* eslint-disable react/no-array-index-key */
'use client';

/**
 * LayoutTimeline Component (L1 Layout)
 *
 * Horizontal timeline layout with alternating nodes above/below a center line.
 * Creates a dynamic visual timeline with circles and connectors.
 */

import React, { type ReactNode, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { ThemeName, VibeLevel } from '@/utils/types';

// =============================================================================
// Types
// =============================================================================

export interface LayoutTimelineProps {
  children: ReactNode;
  /** Theme override */
  theme?: ThemeName;
  /** Vibe modifier */
  vibe?: VibeLevel;

  /** Slide headline */
  headline: string;
  /** Optional subtitle under headline */
  subtitle?: string;

  /** Optional explicit axis start (e.g. "Q1 2026") */
  start?: string;
  /** Optional explicit axis end (e.g. "H2 2026") */
  end?: string;
  /** Extend the timeline at start/end to show continuation.
   * - 'start': leave extra space at the beginning (timeline continues from past)
   * - 'end': leave extra space at the end (timeline continues into future)
   * - 'none': no extension, items fill the available space
   */
  extend?: 'start' | 'end' | 'none';
}

export interface LayoutTimelineItemProps {
  children: ReactNode;
  /** Year or date label */
  year?: string;
  /** Position on the axis (defaults to `year` if omitted) */
  at?: string;
  /** Position (auto-alternates by default) */
  position?: 'left' | 'right';
  /** Highlighted item */
  highlighted?: boolean;

  /** Internal: style override for positioning */
  style?: React.CSSProperties;
  /** Internal: className extension */
  className?: string;
}

type ParsedPoint = {
  raw: string;
  value: number; // month-index timeline value
};

function parseTimelinePoint(raw: string | undefined): ParsedPoint | null {
  if (!raw) return null;
  const s = raw.trim();
  if (!s) return null;

  // YYYY-MM or YYYY/MM
  const ym = s.match(/^(\d{4})\s*[-\/]\s*(\d{1,2})$/);
  if (ym) {
    const year = Number(ym[1]);
    const month = Number(ym[2]);
    if (Number.isFinite(year) && Number.isFinite(month) && month >= 1 && month <= 12) {
      return { raw: s, value: year * 12 + (month - 1) };
    }
  }

  // YYYY
  const y = s.match(/^(\d{4})$/);
  if (y) {
    const year = Number(y[1]);
    if (Number.isFinite(year)) return { raw: s, value: year * 12 };
  }

  // Qn YYYY / YYYY Qn / Qn-YYYY
  const q1 = s.match(/^Q\s*([1-4])\s*[-\/]?\s*(\d{4})$/i);
  const q2 = s.match(/^(\d{4})\s*[-\/]?\s*Q\s*([1-4])$/i);
  const q = q1 ? { q: Number(q1[1]), year: Number(q1[2]) } : q2 ? { q: Number(q2[2]), year: Number(q2[1]) } : null;
  if (q && Number.isFinite(q.year) && Number.isFinite(q.q)) {
    return { raw: s, value: q.year * 12 + (q.q - 1) * 3 };
  }

  // Hn YYYY / YYYY Hn / Hn-YYYY
  const h1 = s.match(/^H\s*([1-2])\s*[-\/]?\s*(\d{4})$/i);
  const h2 = s.match(/^(\d{4})\s*[-\/]?\s*H\s*([1-2])$/i);
  const h = h1 ? { h: Number(h1[1]), year: Number(h1[2]) } : h2 ? { h: Number(h2[2]), year: Number(h2[1]) } : null;
  if (h && Number.isFinite(h.year) && Number.isFinite(h.h)) {
    return { raw: s, value: h.year * 12 + (h.h - 1) * 6 };
  }

  return null;
}

// =============================================================================
// Sub-Components
// =============================================================================

/**
 * LayoutTimeline.Item Component
 *
 * Individual item in the timeline.
 */
const TimelineItem = React.forwardRef<HTMLDivElement, LayoutTimelineItemProps>(function TimelineItem(
  {
    children,
    year,
    position,
    highlighted = false,
    style,
    className,
  }: LayoutTimelineItemProps,
  ref,
): JSX.Element {
  return (
    <div
      ref={ref}
      className={`timeline-item ${highlighted ? 'timeline-item-highlighted' : ''}${className ? ` ${className}` : ''}`}
      data-position={position}
      style={style}
    >
      {year && (
        <div className="timeline-year">{year}</div>
      )}
      <div className="timeline-content">
        {children}
      </div>
    </div>
  );
});

TimelineItem.displayName = 'LayoutTimeline.Item';

function isTimelineItemElement(node: unknown): node is React.ReactElement<LayoutTimelineItemProps> {
  return React.isValidElement(node) && node.type === TimelineItem;
}

type ComputedLayout = {
  boxWidthPx: number;
  leftPxByIndex: number[];
};

type ItemTextMetrics = {
  yearText: string;
  headingText: string;
  bodyText: string;
  captionText: string;
  minWidthPx: number;
  maxWidthPx: number;
  idealWidthPx: number;
  idealHeightPx: number;
};

function nodeToText(node: ReactNode): string {
  if (node === null || node === undefined) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(nodeToText).join('');
  if (!React.isValidElement(node)) return '';
  return nodeToText((node.props as { children?: ReactNode }).children);
}

function collectTimelineTexts(children: ReactNode): { headingText: string; bodyText: string; captionText: string } {
  const out = { headingText: '', bodyText: '', captionText: '' };

  const walk = (node: ReactNode): void => {
    if (node === null || node === undefined) return;
    if (typeof node === 'string' || typeof node === 'number') {
      const t = String(node);
      if (t.trim()) out.bodyText += t;
      return;
    }
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (!React.isValidElement(node)) return;

    const anyType = node.type as unknown as { name?: string; displayName?: string };
    const typeName = anyType.displayName ?? anyType.name ?? '';
    const props = node.props as { children?: ReactNode; level?: unknown; variant?: unknown };

    if (typeName === 'Heading' || props.level !== undefined) {
      out.headingText += nodeToText(props.children).trim();
      return;
    }

    if (typeName === 'Text' || props.variant !== undefined) {
      const text = nodeToText(props.children).trim();
      if (!text) return;
      if (props.variant === 'caption') out.captionText += (out.captionText ? ' ' : '') + text;
      else out.bodyText += (out.bodyText ? ' ' : '') + text;
      return;
    }

    walk(props.children);
  };

  walk(children);
  return {
    headingText: out.headingText.trim(),
    bodyText: out.bodyText.trim(),
    captionText: out.captionText.trim(),
  };
}

function createTextMeasurer(): (text: string, font: string) => number {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  return (text: string, font: string): number => {
    if (!ctx) return text.length * 8;
    ctx.font = font;
    return ctx.measureText(text).width;
  };
}

function parsePx(value: string | null | undefined): number | null {
  if (!value) return null;
  const v = value.trim();
  if (!v) return null;
  if (v.endsWith('px')) {
    const n = Number.parseFloat(v.slice(0, -2));
    return Number.isFinite(n) ? n : null;
  }
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

function fontSpecFromComputedStyle(cs: CSSStyleDeclaration): string {
  const style = cs.fontStyle && cs.fontStyle !== 'normal' ? `${cs.fontStyle} ` : '';
  const weight = cs.fontWeight ? `${cs.fontWeight} ` : '';
  const size = cs.fontSize ? `${cs.fontSize} ` : '';
  const family = cs.fontFamily ?? '';
  return `${style}${weight}${size}${family}`.trim();
}

function lineHeightPxFromComputedStyle(cs: CSSStyleDeclaration, fallbackMultiplier: number): number {
  const fontSizePx = parsePx(cs.fontSize) ?? 16;
  const lhPx = parsePx(cs.lineHeight);
  if (lhPx !== null) return lhPx;
  return Math.round(fallbackMultiplier * fontSizePx);
}

function estimateBoxHeightPx(params: {
  boxWidthPx: number;
  headingWidthPx: number;
  bodyWidthPx: number;
  captionWidthPx: number;
  hasBody: boolean;
  hasCaption: boolean;
  headingLineHeightPx: number;
  bodyLineHeightPx: number;
  captionLineHeightPx: number;
}): number {
  const {
    boxWidthPx,
    headingWidthPx,
    bodyWidthPx,
    captionWidthPx,
    hasBody,
    hasCaption,
    headingLineHeightPx,
    bodyLineHeightPx,
    captionLineHeightPx,
  } = params;

  // From globals.css (timeline section)
  const contentPaddingX = 14;
  const contentPaddingY = 10;

  const innerWidth = Math.max(1, boxWidthPx - contentPaddingX * 2 - 2);

  const linesHeading = Math.max(1, Math.ceil(headingWidthPx / innerWidth));
  const linesBody = hasBody ? Math.max(1, Math.ceil(bodyWidthPx / innerWidth)) : 0;
  const linesCaption = hasCaption ? Math.max(1, Math.ceil(captionWidthPx / innerWidth)) : 0;

  // Margins in globals.css (timeline section)
  const gapAfterHeading = hasBody || hasCaption ? 10 : 0;
  const gapAfterBody = hasCaption && hasBody ? 10 : 0;

  const contentHeight =
    linesHeading * headingLineHeightPx +
    gapAfterHeading +
    linesBody * bodyLineHeightPx +
    gapAfterBody +
    linesCaption * captionLineHeightPx;

  return contentPaddingY * 2 + contentHeight;
}

function computeFeasibleCenters(params: {
  desiredCenters: number[];
  leftBound: number;
  rightBound: number;
  minSep: number;
}): number[] | null {
  const { desiredCenters, leftBound, rightBound, minSep } = params;
  const n = desiredCenters.length;
  if (n === 0) return [];
  if (leftBound > rightBound) return null;
  if (n === 1) {
    const c0 = Math.max(leftBound, Math.min(rightBound, desiredCenters[0]));
    return [c0];
  }
  if ((rightBound - leftBound) < (n - 1) * minSep) return null;

  const centers = new Array<number>(n);

  // Forward pass: ensure monotonic separation.
  centers[0] = Math.max(leftBound, Math.min(rightBound - (n - 1) * minSep, desiredCenters[0]));
  for (let i = 1; i < n; i += 1) {
    const minAllowed = centers[i - 1] + minSep;
    const maxAllowed = rightBound - (n - 1 - i) * minSep;
    centers[i] = Math.max(minAllowed, Math.min(maxAllowed, desiredCenters[i]));
  }

  // Backward pass: pull left if the last drifted right.
  centers[n - 1] = Math.min(rightBound, centers[n - 1]);
  for (let i = n - 2; i >= 0; i -= 1) {
    const maxAllowed = centers[i + 1] - minSep;
    centers[i] = Math.min(centers[i], maxAllowed);
  }

  // Final clamp & verify.
  for (let i = 0; i < n; i += 1) {
    if (centers[i] < leftBound - 0.5 || centers[i] > rightBound + 0.5) return null;
    if (i > 0 && (centers[i] - centers[i - 1]) < minSep - 0.5) return null;
  }

  return centers;
}

// =============================================================================
// Component
// =============================================================================

/**
 * LayoutTimeline Component
 *
 * Renders a horizontal timeline with alternating nodes above/below a center line.
 * Creates a dynamic visual timeline with circles and connectors.
 *
 * @param children - Timeline items (LayoutTimeline.Item)
 * @param theme - Optional theme override
 * @param vibe - Optional vibe modifier
 */
export function LayoutTimeline({
  children,
  theme,
  vibe,
  headline,
  subtitle,
  start,
  end,
  extend = 'end',
}: LayoutTimelineProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const measureRef = useRef<null | ((text: string, font: string) => number)>(null);

  const items = useMemo(() => {
    const nodes = React.Children.toArray(children);
    const rawItems = nodes.filter(isTimelineItemElement);

    const enriched = rawItems.map((el, originalIndex) => {
      const at = el.props.at ?? el.props.year;
      const parsed = parseTimelinePoint(at);
      return {
        el,
        originalIndex,
        parsed,
      };
    });

    // Sort parsed points ascending; keep unparsed at the end (stable).
    enriched.sort((a, b) => {
      if (a.parsed && b.parsed) return a.parsed.value - b.parsed.value;
      if (a.parsed && !b.parsed) return -1;
      if (!a.parsed && b.parsed) return 1;
      return a.originalIndex - b.originalIndex;
    });

    return enriched;
  }, [children]);

  const [layout, setLayout] = useState<ComputedLayout | null>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (!measureRef.current) {
      // Only available on client.
      measureRef.current = createTextMeasurer();
    }
    const measure = measureRef.current;

    const baseRemPx = parsePx(window.getComputedStyle(document.documentElement).fontSize) ?? 16;
    const fallbackFamily = 'Inter, system-ui, -apple-system, sans-serif';

    const getTypography = (selector: string, fallback: { weight: string; sizeRem: number; lineHeightMultiplier: number }) => {
      const el = container.querySelector(selector) as HTMLElement | null;
      if (el) {
        const cs = window.getComputedStyle(el);
        return {
          font: fontSpecFromComputedStyle(cs),
          lineHeightPx: lineHeightPxFromComputedStyle(cs, fallback.lineHeightMultiplier),
        };
      }

      const sizePx = Math.round(baseRemPx * fallback.sizeRem);
      const csFallback = {
        fontStyle: 'normal',
        fontWeight: fallback.weight,
        fontSize: `${sizePx}px`,
        fontFamily: fallbackFamily,
        lineHeight: 'normal',
      } as unknown as CSSStyleDeclaration;
      return {
        font: fontSpecFromComputedStyle(csFallback),
        lineHeightPx: Math.round(fallback.lineHeightMultiplier * sizePx),
      };
    };

    // These selectors reflect the timeline DOM structure; font sizes are defined in globals.css using rem.
    const headingTypography = getTypography('.timeline-content h3, .timeline-content [class*="heading-"]', {
      weight: '600',
      sizeRem: 1.25, // 20px when 1rem=16px
      lineHeightMultiplier: 1.25,
    });
    const bodyTypography = getTypography('.timeline-content .text-default', {
      weight: '400',
      sizeRem: 1.125, // 18px when 1rem=16px
      lineHeightMultiplier: 1.35,
    });
    const captionTypography = getTypography('.timeline-content .text-caption', {
      weight: '400',
      sizeRem: 1.0, // 16px when 1rem=16px
      lineHeightMultiplier: 1.25,
    });
    const yearTypography = getTypography('.timeline-year', {
      weight: '700',
      sizeRem: 1.0,
      lineHeightMultiplier: 1.2,
    });

    const headingFont = headingTypography.font;
    const bodyFont = bodyTypography.font;
    const captionFont = captionTypography.font;
    const yearFont = yearTypography.font;

    const yearPaddingX = 14;
    const contentPaddingX = 14;
    const borderFudge = 2;

    const compute = (): void => {
      const n = items.length;
      if (n === 0) {
        setLayout(null);
        return;
      }

      const w = container.clientWidth;
      if (!Number.isFinite(w) || w <= 0) return;

      const marginPx = 8;
      const minGap = 12;

      const parsedValues = items.filter(i => i.parsed).map(i => i.parsed!.value);
      const providedStart = parseTimelinePoint(start)?.value;
      const providedEnd = parseTimelinePoint(end)?.value;

      const axisStart = Number.isFinite(providedStart)
        ? (providedStart as number)
        : (parsedValues.length ? Math.min(...parsedValues) : NaN);
      const axisEnd = Number.isFinite(providedEnd)
        ? (providedEnd as number)
        : (parsedValues.length ? Math.max(...parsedValues) : NaN);

      const hasValidAxis = Number.isFinite(axisStart) && Number.isFinite(axisEnd) && (axisEnd as number) > (axisStart as number);

      const tByIndex = items.map((it, idx) => {
        if (hasValidAxis && it.parsed) {
          const t = (it.parsed.value - (axisStart as number)) / ((axisEnd as number) - (axisStart as number));
          return Math.max(0, Math.min(1, t));
        }
        if (n === 1) return 0.5;
        return idx / (n - 1);
      });

      // ---------------------------------------------------------------------
      // 1) Per-item ideal width/height + min width from text measurement
      // ---------------------------------------------------------------------
      const itemMetrics: ItemTextMetrics[] = items.map((it) => {
        const yearText = (it.el.props.year ?? '').trim();
        const { headingText, bodyText, captionText } = collectTimelineTexts(it.el.props.children);

        const headingW = headingText ? measure(headingText, headingFont) : 0;
        const bodyW = bodyText ? measure(bodyText, bodyFont) : 0;
        const captionW = captionText ? measure(captionText, captionFont) : 0;

        const yearTextW = yearText ? measure(yearText, yearFont) : 0;
        const yearBoxW = yearTextW + yearPaddingX * 2 + borderFudge;

        // (2) min width > heading length (avoid heading wrap)
        const minWidthPx = Math.max(64, Math.ceil(headingW + contentPaddingX * 2 + borderFudge));

        // (3) max width < 3x year box width
        const maxWidthPx = Math.max(minWidthPx, Math.floor(yearBoxW * 3 - 1));

        const hasBody = Boolean(bodyText);
        const hasCaption = Boolean(captionText);

        const ratioLimit = 1.5;

        const ratioAt = (candidateWidth: number): { ratio: number; height: number } => {
          const height = estimateBoxHeightPx({
            boxWidthPx: candidateWidth,
            headingWidthPx: headingW,
            bodyWidthPx: bodyW,
            captionWidthPx: captionW,
            hasBody,
            hasCaption,
            headingLineHeightPx: headingTypography.lineHeightPx,
            bodyLineHeightPx: bodyTypography.lineHeightPx,
            captionLineHeightPx: captionTypography.lineHeightPx,
          });
          return { ratio: candidateWidth / Math.max(1, height), height };
        };

        // (4) search width for best ratio close to 3:2 but <= 3:2
        let lo = minWidthPx;
        let hi = maxWidthPx;
        while (lo < hi) {
          const mid = Math.floor((lo + hi + 1) / 2);
          const { ratio } = ratioAt(mid);
          if (ratio <= ratioLimit) lo = mid;
          else hi = mid - 1;
        }
        const idealWidthPx = lo;
        const { height: idealHeightPx } = ratioAt(idealWidthPx);

        return {
          yearText,
          headingText,
          bodyText,
          captionText,
          minWidthPx,
          maxWidthPx,
          idealWidthPx,
          idealHeightPx,
        };
      });

      // Optional debug output (dev only)
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.debug('[LayoutTimeline] item text box metrics', itemMetrics.map(m => ({
          year: m.yearText,
          minW: m.minWidthPx,
          maxW: m.maxWidthPx,
          idealW: m.idealWidthPx,
          idealH: m.idealHeightPx,
        })));
      }

      // ---------------------------------------------------------------------
      // 2) Global uniform width
      // globalIdealWidth = max(min(idealWidth), max(minWidth))
      // ---------------------------------------------------------------------
      const minIdealWidth = Math.min(...itemMetrics.map(m => m.idealWidthPx));
      const maxMinWidth = Math.max(...itemMetrics.map(m => m.minWidthPx));
      const minMaxWidth = Math.min(...itemMetrics.map(m => m.maxWidthPx));

      let targetWidth = Math.max(minIdealWidth, maxMinWidth);
      targetWidth = Math.max(64, Math.min(targetWidth, minMaxWidth));

      // Also can't exceed container's total available width.
      const maxWidthFromContainer = Math.floor(w - 2 * marginPx);
      targetWidth = Math.min(targetWidth, maxWidthFromContainer);

      // Extension space: reserve extra space at start/end for visual continuation
      // Dynamically adjust based on number of items: less items = more space, more items = less space
      const extendStart = extend === 'start';
      const extendEnd = extend === 'end';

      const isFeasible = (candidateWidth: number): { centers: number[]; lefts: number[] } | null => {
        // Scale extendSpace inversely with item count:
        // - 1-2 items: 60% of box width
        // - 3-4 items: 40% of box width
        // - 5+ items: 20% of box width
        const extendRatio = n <= 2 ? 0.6 : n <= 4 ? 0.4 : 0.2;
        const extendSpace = candidateWidth * extendRatio;
        const leftBound = marginPx + candidateWidth / 2 + (extendStart ? extendSpace : 0);
        const rightBound = w - marginPx - candidateWidth / 2 - (extendEnd ? extendSpace : 0);
        if (leftBound > rightBound) return null;

        const span = rightBound - leftBound;
        const desiredCenters = tByIndex.map((t) => leftBound + t * span);

        // Allow up to 15% overlap between adjacent nodes to preserve box width
        const overlapAllowance = candidateWidth * 0.15;
        const minSep = candidateWidth - overlapAllowance + minGap;
        const centers = computeFeasibleCenters({ desiredCenters, leftBound, rightBound, minSep });
        if (!centers) return null;

        const lefts = centers.map((c) => c - candidateWidth / 2);
        return { centers, lefts };
      };

      // ---------------------------------------------------------------------
      // 3) Fit the global width to the axis without overlap / out-of-bounds
      // If target isn't feasible, shrink until it is.
      // ---------------------------------------------------------------------
      let chosenWidth = targetWidth;
      if (!isFeasible(chosenWidth)) {
        let lo = 64;
        let hi = chosenWidth;
        // Find largest feasible <= target
        while (lo < hi) {
          const mid = Math.floor((lo + hi + 1) / 2);
          if (isFeasible(mid)) lo = mid;
          else hi = mid - 1;
        }
        chosenWidth = lo;
      }

      const placement = isFeasible(chosenWidth);
      if (!placement) return;
      const lefts = placement.lefts;

      setLayout((prev) => {
        const sameWidth = prev?.boxWidthPx === chosenWidth;
        const sameLefts = prev?.leftPxByIndex.length === lefts.length && prev?.leftPxByIndex.every((v, idx) => Math.abs(v - lefts[idx]) < 0.5);
        if (sameWidth && sameLefts) return prev;
        return { boxWidthPx: chosenWidth, leftPxByIndex: lefts };
      });
    };

    compute();

    const ro = new ResizeObserver(() => compute());
    ro.observe(container);
    return () => ro.disconnect();
  }, [items, start, end, extend]);

  return (
    <div
      className="layout-timeline"
      data-layout="timeline"
      data-theme={theme}
      data-vibe={vibe}
    >
      {headline && (
        // Wrapper avoids the `.layout-timeline > [class*="heading-"]` centering rule.
        <div style={{ textAlign: 'left' }}>
          <h1
            className="heading-1"
            style={{
              margin: '1.0rem 1.0rem 0 1.0rem',
              textAlign: 'left',
              fontSize: '4rem',
              fontWeight: 700,
              color: 'var(--theme-text)',
              textWrap: 'wrap',
              width: '100%',
              maxWidth: 'none',
            }}
          >
            {headline}
          </h1>
          {subtitle && (
            <p
              style={{
                margin: '0.5rem 1.0rem 0 1.0rem',
                textAlign: 'left',
                fontSize: '1.5rem',
                fontStyle: 'italic',
                color: 'var(--theme-text-muted)',
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      )}
      <div className="timeline-items" ref={containerRef} style={{ margin: '2rem 1.0rem 0 1.0rem' }}>
        {items.map((it, idx) => {
          const style: React.CSSProperties | undefined = layout
            ? {
                left: `${layout.leftPxByIndex[idx]}px`,
                width: `${layout.boxWidthPx}px`,
              }
            : undefined;

          return React.cloneElement(it.el, {
            key: it.el.key ?? idx,
            style,
          });
        })}
      </div>
    </div>
  );
}

// Attach sub-component
LayoutTimeline.Item = TimelineItem;

// =============================================================================
// Exports
// =============================================================================

export default LayoutTimeline;
