import type { Metadata } from 'next';
import { DM_Sans, JetBrains_Mono } from 'next/font/google';
import '../globals.css';

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--sans' });
const jetBrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--mono' });

export const metadata: Metadata = {
  title: 'next-video',
  description:
    'Next Video solves the hard problems with embedding, storing, streaming, and customizing video in your Next.js app.',
};

export default function getLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${dmSans.variable} ${jetBrainsMono.variable}`}>
      <body style={{
        display: 'block',
        margin: 0,
        height: '100vh',
        overflow: 'hidden',
      }}>{children}</body>
    </html>
  );
}
