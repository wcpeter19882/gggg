import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/core/ThemeContext';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Presentation',
  description: 'React MDX Presentation',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="en">
      <body>
        <ThemeProvider theme="business" vibe="balanced">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
