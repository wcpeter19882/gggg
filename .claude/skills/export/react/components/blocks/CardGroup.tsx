/**
 * CardGroup Component (L2 Block)
 *
 * Supports 3 layouts:
 * - default: icon/image and text stacked in one column
 * - left: icon/image on the left with a divider
 * - top: icon/image in a separate top circle
 */

'use client';

import React, { Children, isValidElement, type ReactNode, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { CardData, CardLayout, CardMediaSize, Size, GridCols } from '@/utils/types';

type AutoCardDecision = {
  layout: CardLayout;
  mediaSize: CardMediaSize;
};

type GroupAutoDecision = {
  layout: CardLayout;
  mediaSize: CardMediaSize;
  heightPx: number;
  rowGapOverride?: string;
};

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

function createTextMeasurer(): (text: string, font: string) => number {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  return (text: string, font: string): number => {
    if (!ctx) return text.length * 8;
    ctx.font = font;
    return ctx.measureText(text).width;
  };
}

function stableHash01(input: string): number {
  // Simple stable hash -> [0,1)
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // Unsigned to [0,1)
  return (h >>> 0) / 4294967296;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function estimateLines(textPx: number, innerWidthPx: number): number {
  if (!textPx) return 0;
  return Math.max(1, Math.ceil(textPx / Math.max(1, innerWidthPx)));
}

function decideAutoCard(params: {
  title: string;
  description: string;
  cardWidthPx: number;
  paddingXPx: number;
  paddingYPx: number;
  baseRemPx: number;
  titleFont: string;
  titleLineHeightPx: number;
  descriptionFont: string;
  descriptionLineHeightPx: number;
  measure: (t: string, font: string) => number;
  seed: string;
}): AutoCardDecision {
  const {
    title,
    description,
    cardWidthPx,
    paddingXPx,
    paddingYPx,
    baseRemPx,
    titleFont,
    titleLineHeightPx,
    descriptionFont,
    descriptionLineHeightPx,
    measure,
    seed,
  } = params;

  // Prefer larger mediaSize when feasible.
  const mediaOrder: CardMediaSize[] = ['lg', 'md', 'sm'];

  const mediaSpec: Record<CardMediaSize, {
    mediaRem: number;
    topCircleTopRem: number; // negative
  }> = {
    sm: { mediaRem: 2.5, topCircleTopRem: -2.0 },
    md: { mediaRem: 3.0, topCircleTopRem: -2.25 },
    lg: { mediaRem: 3.5, topCircleTopRem: -2.75 },
  };

  const titleW = title ? measure(title, titleFont) : 0;
  const descW = description ? measure(description, descriptionFont) : 0;

  const titleMarginBottomPx = 0.375 * baseRemPx;
  const defaultMediaMarginBottomPx = 1.25 * baseRemPx;
  const leftGapPx = 1.0 * baseRemPx;
  const dividerPx = 1;
  const topExtraTopPaddingPx = 1.0 * baseRemPx; // from CSS: + 1rem

  const targetRatio = 2 / 3; // prefer width/height ~ 0.666
  const minRatio = 1 / 3; // width/height should not be less than 0.333

  const pickBase = stableHash01(seed);
  const baseNormalLayout: CardLayout = pickBase < 0.5 ? 'default' : 'top';

  type Candidate = {
    layout: CardLayout;
    mediaSize: CardMediaSize;
    heightPx: number;
    ratio: number;
  };

  const candidates: Candidate[] = [];

  for (const ms of mediaOrder) {
    const mediaPx = mediaSpec[ms].mediaRem * baseRemPx;
    const innerWidthDefault = cardWidthPx - paddingXPx * 2;

    // default/top text wraps to full inner width
    const linesTitle = estimateLines(titleW, innerWidthDefault);
    const linesDesc = description ? estimateLines(descW, innerWidthDefault) : 0;
    const textHeightPx =
      linesTitle * titleLineHeightPx +
      (description ? titleMarginBottomPx : 0) +
      linesDesc * descriptionLineHeightPx;

    const heightDefault = paddingYPx * 2 + mediaPx + defaultMediaMarginBottomPx + textHeightPx;
    const ratioDefault = cardWidthPx / Math.max(1, heightDefault);
    candidates.push({ layout: 'default', mediaSize: ms, heightPx: heightDefault, ratio: ratioDefault });

    const topPaddingTopPx = (4.75 / 2) * baseRemPx + topExtraTopPaddingPx; // md default fallback; overridden per size below
    // Top layout padding-top depends on circle size; approximate from media size mapping (matches getMediaSizeVars)
    const topCircleSizeRem = ({ sm: 4.25, md: 4.75, lg: 5.75 } as const)[ms];
    const heightTop = (topCircleSizeRem / 2) * baseRemPx + topExtraTopPaddingPx + paddingYPx + textHeightPx;
    const ratioTop = cardWidthPx / Math.max(1, heightTop);
    candidates.push({ layout: 'top', mediaSize: ms, heightPx: heightTop, ratio: ratioTop });

    // left layout has less available width for text
    const innerWidthLeft = cardWidthPx - paddingXPx * 2 - mediaPx - dividerPx - leftGapPx * 2;
    const linesTitleLeft = estimateLines(titleW, innerWidthLeft);
    const linesDescLeft = description ? estimateLines(descW, innerWidthLeft) : 0;
    const textHeightLeftPx =
      linesTitleLeft * titleLineHeightPx +
      (description ? titleMarginBottomPx : 0) +
      linesDescLeft * descriptionLineHeightPx;
    const heightLeft = paddingYPx * 2 + Math.max(mediaPx, textHeightLeftPx);
    const ratioLeft = cardWidthPx / Math.max(1, heightLeft);
    candidates.push({ layout: 'left', mediaSize: ms, heightPx: heightLeft, ratio: ratioLeft });
  }

  // 1) If normal layout is too tall (ratio < 1:3), switch to left.
  const bestNormalForMs = (layout: CardLayout): Candidate | null => {
    const list = candidates.filter(c => c.layout === layout);
    if (!list.length) return null;
    // Prefer larger media, then closest to target ratio
    return list
      .slice()
      .sort((a, b) => {
        const aRank = mediaOrder.indexOf(a.mediaSize);
        const bRank = mediaOrder.indexOf(b.mediaSize);
        if (aRank !== bRank) return aRank - bRank;
        return Math.abs(a.ratio - targetRatio) - Math.abs(b.ratio - targetRatio);
      })[0];
  };

  const normalCandidate = bestNormalForMs(baseNormalLayout) ?? bestNormalForMs('top') ?? bestNormalForMs('default')!;

  // If too tall, force left.
  if (normalCandidate.ratio < minRatio) {
    const leftCandidates = candidates.filter(c => c.layout === 'left');
    const bestLeft = leftCandidates
      .slice()
      .sort((a, b) => {
        // Prefer largest media that still meets minRatio if possible
        const aOk = a.ratio >= minRatio;
        const bOk = b.ratio >= minRatio;
        if (aOk !== bOk) return aOk ? -1 : 1;
        const aRank = mediaOrder.indexOf(a.mediaSize);
        const bRank = mediaOrder.indexOf(b.mediaSize);
        if (aRank !== bRank) return aRank - bRank;
        return Math.abs(a.ratio - targetRatio) - Math.abs(b.ratio - targetRatio);
      })[0];
    return { layout: 'left', mediaSize: bestLeft.mediaSize };
  }

  // 2) If text is short and card is quite wide, prefer left.
  // Heuristic: if default/top candidate is much wider than tall and description is short.
  const textChars = (title.trim().length + description.trim().length);
  if (textChars <= 90 && normalCandidate.ratio > 0.95) {
    const bestLeft = candidates
      .filter(c => c.layout === 'left')
      .slice()
      .sort((a, b) => {
        // Prefer largest media size; ensure not too tall
        const aOk = a.ratio >= minRatio;
        const bOk = b.ratio >= minRatio;
        if (aOk !== bOk) return aOk ? -1 : 1;
        const aRank = mediaOrder.indexOf(a.mediaSize);
        const bRank = mediaOrder.indexOf(b.mediaSize);
        if (aRank !== bRank) return aRank - bRank;
        return Math.abs(a.ratio - targetRatio) - Math.abs(b.ratio - targetRatio);
      })[0];
    return { layout: 'left', mediaSize: bestLeft.mediaSize };
  }

  // 3) Otherwise keep normal (default/top) and pick the largest media size that keeps ratio >= minRatio.
  const sameLayout = candidates.filter(c => c.layout === normalCandidate.layout);
  const best = sameLayout
    .slice()
    .sort((a, b) => {
      const aOk = a.ratio >= minRatio;
      const bOk = b.ratio >= minRatio;
      if (aOk !== bOk) return aOk ? -1 : 1;
      const aRank = mediaOrder.indexOf(a.mediaSize);
      const bRank = mediaOrder.indexOf(b.mediaSize);
      if (aRank !== bRank) return aRank - bRank;
      return Math.abs(a.ratio - targetRatio) - Math.abs(b.ratio - targetRatio);
    })[0];

  return { layout: best.layout, mediaSize: best.mediaSize };
}

function estimateCardHeightPx(params: {
  titleW: number;
  descW: number;
  hasDescription: boolean;
  cardWidthPx: number;
  paddingXPx: number;
  paddingYPx: number;
  baseRemPx: number;
  titleLineHeightPx: number;
  descriptionLineHeightPx: number;
  layout: CardLayout;
  mediaSize: CardMediaSize;
}): number {
  const {
    titleW,
    descW,
    hasDescription,
    cardWidthPx,
    paddingXPx,
    paddingYPx,
    baseRemPx,
    titleLineHeightPx,
    descriptionLineHeightPx,
    layout,
    mediaSize,
  } = params;

  const mediaRemBySize: Record<CardMediaSize, number> = { sm: 2.5, md: 3.0, lg: 3.5 };
  const topCircleSizeRemBySize: Record<CardMediaSize, number> = { sm: 4.25, md: 4.75, lg: 5.75 };

  const mediaPx = mediaRemBySize[mediaSize] * baseRemPx;
  const titleMarginBottomPx = 0.375 * baseRemPx;
  const defaultMediaMarginBottomPx = 1.25 * baseRemPx;
  const leftGapPx = 1.0 * baseRemPx;
  const dividerPx = 1;
  const topExtraTopPaddingPx = 1.0 * baseRemPx;

  if (layout === 'left') {
    const innerWidthLeft = cardWidthPx - paddingXPx * 2 - mediaPx - dividerPx - leftGapPx * 2;
    const linesTitleLeft = estimateLines(titleW, innerWidthLeft);
    const linesDescLeft = hasDescription ? estimateLines(descW, innerWidthLeft) : 0;
    const textHeightLeftPx =
      linesTitleLeft * titleLineHeightPx +
      (hasDescription ? titleMarginBottomPx : 0) +
      linesDescLeft * descriptionLineHeightPx;
    return paddingYPx * 2 + Math.max(mediaPx, textHeightLeftPx);
  }

  // default / top use full inner width
  const innerWidth = cardWidthPx - paddingXPx * 2;
  const linesTitle = estimateLines(titleW, innerWidth);
  const linesDesc = hasDescription ? estimateLines(descW, innerWidth) : 0;
  const textHeightPx =
    linesTitle * titleLineHeightPx +
    (hasDescription ? titleMarginBottomPx : 0) +
    linesDesc * descriptionLineHeightPx;

  if (layout === 'top') {
    const topCircleSizeRem = topCircleSizeRemBySize[mediaSize];
    return (topCircleSizeRem / 2) * baseRemPx + topExtraTopPaddingPx + paddingYPx + textHeightPx;
  }

  // default
  return paddingYPx * 2 + mediaPx + defaultMediaMarginBottomPx + textHeightPx;
}

function decideAutoCardGroup(params: {
  cards: CardData[];
  cardWidthPx: number;
  paddingXPx: number;
  paddingYPx: number;
  baseRemPx: number;
  titleFont: string;
  titleLineHeightPx: number;
  descriptionFont: string;
  descriptionLineHeightPx: number;
  measure: (t: string, font: string) => number;
  seed: string;
  forcedLayout?: CardLayout;
  forcedMediaSize?: CardMediaSize;
}): GroupAutoDecision {
  const {
    cards,
    cardWidthPx,
    paddingXPx,
    paddingYPx,
    baseRemPx,
    titleFont,
    titleLineHeightPx,
    descriptionFont,
    descriptionLineHeightPx,
    measure,
    seed,
    forcedLayout,
    forcedMediaSize,
  } = params;

  const mediaOrder: CardMediaSize[] = ['lg', 'md', 'sm'];
  const targetRatio = 2 / 3;
  const minRatio = 1 / 3;
  const minRatioEpsilon = 0.015;

  const textMetrics = cards.map((c) => {
    const title = c.title ?? '';
    const description = c.description ?? '';
    const titleW = title ? measure(title, titleFont) : 0;
    const descW = description ? measure(description, descriptionFont) : 0;
    return { title, description, titleW, descW, hasDescription: Boolean(description.trim()) };
  });

  const groupTextCharsMax = textMetrics.reduce((m, t) => Math.max(m, (t.title.trim().length + t.description.trim().length)), 0);

  const basePick = stableHash01(seed);
  const normalLayout: CardLayout = basePick < 0.5 ? 'default' : 'top';

  const groupCandidate = (layout: CardLayout, mediaSize: CardMediaSize): { heightPx: number; ratio: number } => {
    const heightPx = Math.ceil(Math.max(
      ...textMetrics.map((t) => estimateCardHeightPx({
        titleW: t.titleW,
        descW: t.descW,
        hasDescription: t.hasDescription,
        cardWidthPx,
        paddingXPx,
        paddingYPx,
        baseRemPx,
        titleLineHeightPx,
        descriptionLineHeightPx,
        layout,
        mediaSize,
      }))
    ));
    const ratio = cardWidthPx / Math.max(1, heightPx);
    return { heightPx, ratio };
  };

  const bestForLayout = (layout: CardLayout): { mediaSize: CardMediaSize; heightPx: number; ratio: number } => {
    const forcedMs = forcedMediaSize;
    const pool = forcedMs ? [forcedMs] : mediaOrder;

    const evaluated = pool.map((ms) => {
      const { heightPx, ratio } = groupCandidate(layout, ms);
      return { layout, mediaSize: ms, heightPx, ratio };
    });

    // Prefer: ratio >= minRatio, then largest media, then closest to target ratio.
    evaluated.sort((a, b) => {
      const aOk = a.ratio >= minRatio;
      const bOk = b.ratio >= minRatio;
      if (aOk !== bOk) return aOk ? -1 : 1;
      const aRank = mediaOrder.indexOf(a.mediaSize);
      const bRank = mediaOrder.indexOf(b.mediaSize);
      if (aRank !== bRank) return aRank - bRank;
      return Math.abs(a.ratio - targetRatio) - Math.abs(b.ratio - targetRatio);
    });

    return evaluated[0];
  };

  const resolvedLayoutBase = forcedLayout ?? normalLayout;
  const normal = bestForLayout(resolvedLayoutBase);

  // Rule 3: if we're at (or near) 1:3, force left.
  const nearMin = normal.ratio <= (minRatio + minRatioEpsilon);
  // Rule 2/4: if text is short and card is wide, prefer left.
  const preferLeftForShortText = groupTextCharsMax <= 90 && normal.ratio > 0.95;

  let chosenLayout: CardLayout = resolvedLayoutBase;
  if (!forcedLayout && (normal.ratio < minRatio || nearMin || preferLeftForShortText)) {
    chosenLayout = 'left';
  }

  const chosen = chosenLayout === resolvedLayoutBase ? normal : bestForLayout('left');

  // If top layout is used, increase row-gap so circles don't overlap rows.
  const topOverflowsRem: Record<CardMediaSize, number> = { sm: 2.0, md: 2.25, lg: 2.75 };
  const rowGapOverride = chosenLayout === 'top'
    ? `calc(var(--theme-spacing-gap) + ${topOverflowsRem[chosen.mediaSize]}rem)`
    : undefined;

  return {
    layout: chosenLayout,
    mediaSize: chosen.mediaSize,
    heightPx: chosen.heightPx,
    rowGapOverride,
  };
}

// =============================================================================
// Types
// =============================================================================

export interface CardProps extends CardData {
  children?: ReactNode;
  /** Size variant for individual card */
  size?: Size;
  /** Per-card layout variant */
  layout?: CardLayout;
  /** Per-card media (icon/image) size variant */
  mediaSize?: CardMediaSize;
}

export interface CardGroupProps {
  /** Array of card data (optional if using Card children) */
  cards?: CardData[];
  /** Card children (optional if using cards prop) */
  children?: ReactNode;
  /** Number of columns */
  columns?: GridCols;
  /** Card size variant */
  size?: Size;
  /** Card visual variant */
  variant?: 'default' | 'outline' | 'filled';
  /** Card layout variant (applies to all cards unless overridden per card) */
  layout?: CardLayout;
  /** Media (icon/image) size variant (applies to all cards unless overridden per card) */
  mediaSize?: CardMediaSize;
  /** Optional id for the card group */
  id?: string;

  /** Auto-pick per-card layout and mediaSize when not specified */
  auto?: boolean;
}

function getMediaSizeVars(mediaSize?: CardMediaSize): React.CSSProperties | undefined {
  if (!mediaSize) return undefined;

  const map: Record<CardMediaSize, {
    media: string;
    icon: string;
    topMedia: string;
    topIcon: string;
    topCircle: string;
    topOffset: string;
  }> = {
    sm: {
      media: '2.5rem',
      icon: '1.75rem',
      topMedia: '3rem',
      topIcon: '2.25rem',
      topCircle: '4.25rem',
      topOffset: '-2rem',
    },
    md: {
      media: '3rem',
      icon: '2rem',
      topMedia: '3.5rem',
      topIcon: '2.5rem',
      topCircle: '4.75rem',
      topOffset: '-2.25rem',
    },
    lg: {
      media: '3.5rem',
      icon: '3.25rem',
      topMedia: '4.25rem',
      topIcon: '3rem',
      topCircle: '5.75rem',
      topOffset: '-2.75rem',
    },
  };

  const s = map[mediaSize];
  return {
    ['--card-media-size' as any]: s.media,
    ['--card-icon-font-size' as any]: s.icon,
    ['--card-top-media-size' as any]: s.topMedia,
    ['--card-top-icon-font-size' as any]: s.topIcon,
    ['--card-top-circle-size' as any]: s.topCircle,
    ['--card-top-circle-top' as any]: s.topOffset,
  };
}

function renderMedia(card: CardData): ReactNode {
  if (card.image) {
    return (
      <div className="card-media">
        <img className="card-media-img" src={card.image} alt="" loading="lazy" />
      </div>
    );
  }
  if (card.icon) {
    return (
      <div className="card-media">
        <span className="card-media-icon">{card.icon}</span>
      </div>
    );
  }
  return null;
}

function renderCardInner(card: CardData, layout: CardLayout): ReactNode {
  if (layout === 'left') {
    return (
      <>
        {renderMedia(card)}
        <div className="card-divider" aria-hidden="true" />
        <div className="card-content">
          <h3 className="card-title">{card.title}</h3>
          {card.description && <p className="card-description">{card.description}</p>}
        </div>
      </>
    );
  }

  if (layout === 'top') {
    return (
      <>
        <div className="card-top-circle">{renderMedia(card)}</div>
        <div className="card-content">
          <h3 className="card-title">{card.title}</h3>
          {card.description && <p className="card-description">{card.description}</p>}
        </div>
      </>
    );
  }

  // default
  return (
    <>
      {renderMedia(card)}
      <div className="card-content">
        <h3 className="card-title">{card.title}</h3>
        {card.description && <p className="card-description">{card.description}</p>}
      </div>
    </>
  );
}

// =============================================================================
// Card Component
// =============================================================================

export function Card({
  title,
  description,
  icon,
  image,
  link,
  size = 'md',
  layout = 'default',
  mediaSize,
}: CardProps): JSX.Element {
  const sizeClass = {
    sm: 'card-sm',
    md: 'card-md',
    lg: 'card-lg',
    full: 'card-lg',
  }[size];

  const card: CardData = { title, description, icon, image, link, layout, mediaSize };
  const style = getMediaSizeVars(mediaSize);

  return (
    <div className={`card ${sizeClass} card-layout-${layout}`} data-layout={layout} style={style}>
      {renderCardInner(card, layout)}

      {link && (
        <div className="card-footer">
          <span className="card-link">Learn more →</span>
        </div>
      )}
    </div>
  );
}
Card.displayName = 'Card';

// =============================================================================
// CardGroup Component
// =============================================================================

export function CardGroup({
  cards,
  children,
  columns = 3,
  size = 'md',
  variant = 'default',
  layout,
  mediaSize,
  id,
  auto = true,
}: CardGroupProps): JSX.Element {
  const sizeClass = {
    sm: 'card-sm',
    md: 'card-md',
    lg: 'card-lg',
    full: 'card-lg',
  }[size];

  const cardsFromChildren: CardData[] = [];
  if (!cards && children) {
    Children.forEach(children, (child) => {
      if (isValidElement(child)) {
        const displayName = (child.type as { displayName?: string })?.displayName;
        if (displayName === 'Card' || (child.type as any) === Card) {
          const props = child.props as CardProps;
          cardsFromChildren.push({
            title: props.title,
            description: props.description,
            icon: props.icon,
            image: props.image,
            link: props.link,
            layout: props.layout,
            mediaSize: props.mediaSize,
          });
        }
      }
    });
  }

  const resolvedCards = cards || cardsFromChildren;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const measureRef = useRef<null | ((text: string, font: string) => number)>(null);
  const [autoDecision, setAutoDecision] = useState<GroupAutoDecision | null>(null);

  const baseSeed = useMemo(() => id ?? 'card-group', [id]);

  useLayoutEffect(() => {
    if (!auto) {
      setAutoDecision(null);
      return;
    }

    const container = containerRef.current;
    if (!container) return;
    if (!measureRef.current) measureRef.current = createTextMeasurer();
    const measure = measureRef.current;

    const compute = (): void => {
      const w = container.clientWidth;
      if (!Number.isFinite(w) || w <= 0) return;

      const cs = window.getComputedStyle(container);
      const gapPx = parsePx(cs.columnGap) ?? parsePx(cs.gap) ?? 0;
      const cols = Math.max(1, Number(columns) || 1);
      const cardWidthPx = Math.floor((w - gapPx * (cols - 1)) / cols);

      const baseRemPx = parsePx(window.getComputedStyle(document.documentElement).fontSize) ?? 16;

      // Grab typography/padding from a rendered card (first one).
      const sampleCard = container.querySelector('.card') as HTMLElement | null;
      const sampleTitle = container.querySelector('.card-title') as HTMLElement | null;
      const sampleDesc = container.querySelector('.card-description') as HTMLElement | null;

      const cardCS = sampleCard ? window.getComputedStyle(sampleCard) : null;
      const paddingLeft = cardCS ? (parsePx(cardCS.paddingLeft) ?? Math.round(1.75 * baseRemPx)) : Math.round(1.75 * baseRemPx);
      const paddingRight = cardCS ? (parsePx(cardCS.paddingRight) ?? Math.round(1.75 * baseRemPx)) : Math.round(1.75 * baseRemPx);
      const paddingTop = cardCS ? (parsePx(cardCS.paddingTop) ?? Math.round(1.75 * baseRemPx)) : Math.round(1.75 * baseRemPx);
      const paddingBottom = cardCS ? (parsePx(cardCS.paddingBottom) ?? Math.round(1.75 * baseRemPx)) : Math.round(1.75 * baseRemPx);

      const paddingXPx = Math.round((paddingLeft + paddingRight) / 2);
      const paddingYPx = Math.round((paddingTop + paddingBottom) / 2);

      const titleCS = sampleTitle ? window.getComputedStyle(sampleTitle) : null;
      const descCS = sampleDesc ? window.getComputedStyle(sampleDesc) : null;

      const fallbackFamily = 'Inter, system-ui, -apple-system, sans-serif';
      const titleFont = titleCS ? fontSpecFromComputedStyle(titleCS) : `700 ${Math.round(2 * baseRemPx)}px ${fallbackFamily}`;
      const descFont = descCS ? fontSpecFromComputedStyle(descCS) : `400 ${Math.round(1.2 * baseRemPx)}px ${fallbackFamily}`;
      const titleLH = titleCS ? lineHeightPxFromComputedStyle(titleCS, 1.3) : Math.round(1.3 * 2 * baseRemPx);
      const descLH = descCS ? lineHeightPxFromComputedStyle(descCS, 1.5) : Math.round(1.5 * 1.2 * baseRemPx);

      const next = decideAutoCardGroup({
        cards: resolvedCards,
        cardWidthPx,
        paddingXPx,
        paddingYPx,
        baseRemPx,
        titleFont,
        titleLineHeightPx: titleLH,
        descriptionFont: descFont,
        descriptionLineHeightPx: descLH,
        measure,
        seed: `${baseSeed}:${columns}`,
        forcedLayout: layout,
        forcedMediaSize: mediaSize,
      });

      setAutoDecision((prev) => {
        if (!prev) return next;
        const same = prev.layout === next.layout && prev.mediaSize === next.mediaSize && Math.abs(prev.heightPx - next.heightPx) < 0.5 && prev.rowGapOverride === next.rowGapOverride;
        return same ? prev : next;
      });
    };

    compute();
    const ro = new ResizeObserver(() => compute());
    ro.observe(container);
    return () => ro.disconnect();
  }, [auto, baseSeed, columns, layout, mediaSize, resolvedCards]);

  return (
    <div
      className={`card-group layout-grid-${columns}`}
      data-columns={columns}
      data-variant={variant}
      data-layout={layout ?? 'auto'}
      id={id}
      ref={containerRef}
      style={autoDecision?.rowGapOverride ? ({ ['--card-group-row-gap' as any]: autoDecision.rowGapOverride } as React.CSSProperties) : undefined}
    >
      {resolvedCards.map((card, index) => {
        const resolvedLayout: CardLayout = layout || autoDecision?.layout || 'default';
        const resolvedMediaSize: CardMediaSize | undefined = mediaSize || autoDecision?.mediaSize;
        const styleVars = getMediaSizeVars(resolvedMediaSize);
        const style = autoDecision?.heightPx
          ? ({ ...styleVars, height: `${autoDecision.heightPx}px` } as React.CSSProperties)
          : styleVars;
        return (
          <div
            key={index}
            className={`card ${sizeClass} card-${variant} card-layout-${resolvedLayout}`}
            data-layout={resolvedLayout}
            style={style}
          >
            {renderCardInner(card, resolvedLayout)}

            {card.link && (
              <div className="card-footer">
                <span className="card-link">Learn more →</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default CardGroup;
