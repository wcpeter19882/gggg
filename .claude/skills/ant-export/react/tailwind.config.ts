import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // Safelist classes used in dynamic JSX content (JsxParser)
  // These classes are generated at runtime and would otherwise be purged
  safelist: [
    // Grid layouts
    'grid', 'grid-cols-1', 'grid-cols-2', 'grid-cols-3', 'grid-cols-4', 'grid-cols-5', 'grid-cols-6',
    'grid-cols-7', 'grid-cols-8', 'grid-cols-9', 'grid-cols-10', 'grid-cols-11', 'grid-cols-12',
    'grid-rows-1', 'grid-rows-2', 'grid-rows-3', 'grid-rows-4', 'grid-rows-5', 'grid-rows-6',
    'col-span-1', 'col-span-2', 'col-span-3', 'col-span-4', 'col-span-5', 'col-span-6',
    'col-span-7', 'col-span-8', 'col-span-9', 'col-span-10', 'col-span-11', 'col-span-12', 'col-span-full',
    'row-span-1', 'row-span-2', 'row-span-3', 'row-span-4', 'row-span-5', 'row-span-6', 'row-span-full',
    // Gap utilities
    'gap-1', 'gap-2', 'gap-3', 'gap-4', 'gap-5', 'gap-6', 'gap-8', 'gap-10', 'gap-12', 'gap-16',
    'gap-x-1', 'gap-x-2', 'gap-x-3', 'gap-x-4', 'gap-x-6', 'gap-x-8',
    'gap-y-1', 'gap-y-2', 'gap-y-3', 'gap-y-4', 'gap-y-6', 'gap-y-8',
    // Flexbox
    'flex', 'flex-row', 'flex-col', 'flex-wrap', 'flex-nowrap',
    'flex-1', 'flex-auto', 'flex-initial', 'flex-none',
    'justify-start', 'justify-end', 'justify-center', 'justify-between', 'justify-around', 'justify-evenly',
    'items-start', 'items-end', 'items-center', 'items-baseline', 'items-stretch',
    'self-start', 'self-end', 'self-center', 'self-stretch',
    'content-start', 'content-end', 'content-center', 'content-between',
    // Width / Height
    'w-full', 'w-auto', 'w-1/2', 'w-1/3', 'w-2/3', 'w-1/4', 'w-3/4', 'w-1/5', 'w-2/5', 'w-3/5', 'w-4/5',
    'w-16', 'w-20', 'w-24', 'w-32', 'w-40', 'w-48', 'w-56', 'w-64', 'w-72', 'w-80', 'w-96',
    'h-full', 'h-auto', 'h-screen', 'h-1/2', 'h-1/3', 'h-2/3',
    'h-8', 'h-10', 'h-12', 'h-16', 'h-20', 'h-24', 'h-32', 'h-40', 'h-48', 'h-56', 'h-64', 'h-72', 'h-80', 'h-96',
    'min-h-0', 'min-h-full', 'min-h-screen',
    'max-w-xs', 'max-w-sm', 'max-w-md', 'max-w-lg', 'max-w-xl', 'max-w-2xl', 'max-w-3xl', 'max-w-4xl', 'max-w-5xl', 'max-w-6xl', 'max-w-7xl', 'max-w-full', 'max-w-none',
    // Spacing (padding/margin)
    'p-0', 'p-1', 'p-2', 'p-3', 'p-4', 'p-5', 'p-6', 'p-8', 'p-10', 'p-12',
    'px-0', 'px-1', 'px-2', 'px-3', 'px-4', 'px-6', 'px-8', 'px-10', 'px-12',
    'py-0', 'py-1', 'py-2', 'py-3', 'py-4', 'py-6', 'py-8', 'py-10', 'py-12',
    'pt-0', 'pt-1', 'pt-2', 'pt-4', 'pt-6', 'pt-8', 'pb-0', 'pb-1', 'pb-2', 'pb-4', 'pb-6', 'pb-8',
    'pl-0', 'pl-1', 'pl-2', 'pl-4', 'pl-6', 'pl-8', 'pr-0', 'pr-1', 'pr-2', 'pr-4', 'pr-6', 'pr-8',
    'm-0', 'm-1', 'm-2', 'm-3', 'm-4', 'm-5', 'm-6', 'm-8', 'm-auto',
    'mx-auto', 'mx-0', 'mx-2', 'mx-4', 'mx-6', 'mx-8',
    'my-0', 'my-2', 'my-4', 'my-6', 'my-8',
    'mt-0', 'mt-1', 'mt-2', 'mt-4', 'mt-6', 'mt-8', 'mt-auto',
    'mb-0', 'mb-1', 'mb-2', 'mb-4', 'mb-6', 'mb-8', 'mb-auto',
    'ml-0', 'ml-1', 'ml-2', 'ml-4', 'ml-6', 'ml-8', 'ml-auto',
    'mr-0', 'mr-1', 'mr-2', 'mr-4', 'mr-6', 'mr-8', 'mr-auto',
    '-mt-1', '-mt-2', '-mt-4', '-ml-1', '-ml-2', '-ml-4',
    // Text utilities
    'text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl',
    'text-left', 'text-center', 'text-right', 'text-justify',
    'font-thin', 'font-light', 'font-normal', 'font-medium', 'font-semibold', 'font-bold', 'font-extrabold',
    'leading-none', 'leading-tight', 'leading-snug', 'leading-normal', 'leading-relaxed', 'leading-loose',
    'tracking-tight', 'tracking-normal', 'tracking-wide',
    'uppercase', 'lowercase', 'capitalize', 'normal-case',
    'truncate', 'line-clamp-1', 'line-clamp-2', 'line-clamp-3',
    // Colors - text
    'text-white', 'text-black', 'text-gray-50', 'text-gray-100', 'text-gray-200', 'text-gray-300', 'text-gray-400', 'text-gray-500', 'text-gray-600', 'text-gray-700', 'text-gray-800', 'text-gray-900',
    'text-blue-50', 'text-blue-100', 'text-blue-200', 'text-blue-500', 'text-blue-600', 'text-blue-700', 'text-blue-800',
    'text-green-50', 'text-green-100', 'text-green-500', 'text-green-600', 'text-green-700', 'text-green-800',
    'text-red-50', 'text-red-100', 'text-red-500', 'text-red-600', 'text-red-700', 'text-red-800',
    'text-yellow-50', 'text-yellow-500', 'text-yellow-600', 'text-yellow-700',
    'text-purple-50', 'text-purple-500', 'text-purple-600', 'text-purple-700',
    'text-orange-50', 'text-orange-500', 'text-orange-600',
    // Colors - background
    'bg-transparent', 'bg-white', 'bg-black', 'bg-gray-50', 'bg-gray-100', 'bg-gray-200', 'bg-gray-300', 'bg-gray-800', 'bg-gray-900',
    'bg-blue-50', 'bg-blue-100', 'bg-blue-200', 'bg-blue-500', 'bg-blue-600', 'bg-blue-700',
    'bg-green-50', 'bg-green-100', 'bg-green-200', 'bg-green-500', 'bg-green-600', 'bg-green-700',
    'bg-red-50', 'bg-red-100', 'bg-red-200', 'bg-red-500', 'bg-red-600', 'bg-red-700',
    'bg-yellow-50', 'bg-yellow-100', 'bg-yellow-200', 'bg-yellow-500',
    'bg-purple-50', 'bg-purple-100', 'bg-purple-200', 'bg-purple-500',
    'bg-orange-50', 'bg-orange-100', 'bg-orange-200', 'bg-orange-500',
    // Borders
    'border', 'border-0', 'border-2', 'border-4',
    'border-t', 'border-b', 'border-l', 'border-r',
    'border-t-0', 'border-b-0', 'border-l-0', 'border-r-0',
    'border-transparent', 'border-white', 'border-gray-100', 'border-gray-200', 'border-gray-300', 'border-gray-400',
    'border-blue-100', 'border-blue-200', 'border-blue-300', 'border-blue-500',
    'border-green-100', 'border-green-200', 'border-green-300', 'border-green-500',
    'border-red-100', 'border-red-200', 'border-red-300', 'border-red-500',
    'border-yellow-100', 'border-yellow-200', 'border-yellow-300',
    'border-purple-100', 'border-purple-200', 'border-purple-300',
    'border-orange-100', 'border-orange-200', 'border-orange-300',
    'rounded', 'rounded-none', 'rounded-sm', 'rounded-md', 'rounded-lg', 'rounded-xl', 'rounded-2xl', 'rounded-3xl', 'rounded-full',
    'rounded-t', 'rounded-b', 'rounded-l', 'rounded-r',
    'rounded-tl', 'rounded-tr', 'rounded-bl', 'rounded-br',
    // Shadows
    'shadow', 'shadow-sm', 'shadow-md', 'shadow-lg', 'shadow-xl', 'shadow-2xl', 'shadow-none',
    // Overflow
    'overflow-auto', 'overflow-hidden', 'overflow-scroll', 'overflow-visible',
    'overflow-x-auto', 'overflow-x-hidden', 'overflow-y-auto', 'overflow-y-hidden',
    // Position
    'relative', 'absolute', 'fixed', 'sticky', 'static',
    'inset-0', 'top-0', 'right-0', 'bottom-0', 'left-0',
    'top-1', 'top-2', 'top-4', 'right-1', 'right-2', 'right-4',
    'bottom-1', 'bottom-2', 'bottom-4', 'left-1', 'left-2', 'left-4',
    'z-0', 'z-10', 'z-20', 'z-30', 'z-40', 'z-50',
    // Display
    'block', 'inline-block', 'inline', 'hidden', 'invisible', 'visible',
    // Opacity
    'opacity-0', 'opacity-25', 'opacity-50', 'opacity-75', 'opacity-100',
    // Transitions
    'transition', 'transition-all', 'transition-colors', 'transition-opacity', 'transition-transform',
    'duration-150', 'duration-200', 'duration-300', 'duration-500',
    // Transforms
    'scale-95', 'scale-100', 'scale-105', 'scale-110',
    // Cursor
    'cursor-pointer', 'cursor-default', 'cursor-not-allowed',
    // Object fit
    'object-contain', 'object-cover', 'object-fill', 'object-none',
    // Aspect ratio
    'aspect-square', 'aspect-video', 'aspect-auto',
    // Place utilities
    'place-items-center', 'place-content-center',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  // Disable Tailwind's preflight to avoid conflicts with Ant Design
  corePlugins: {
    preflight: false,
  },
};

export default config;
