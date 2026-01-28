import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ant Design Slide Renderer',
  description: 'Render Ant Design JSX as presentation slides',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
