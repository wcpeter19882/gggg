import type { Metadata } from 'next';
import { ThemeProvider, MDXProvider } from '@/components';
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
          <MDXProvider>
            {children}
          </MDXProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
