import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as fs from 'node:fs/promises';

import type { Metadata } from 'next';
import Link from 'next/link';
import { DM_Sans, JetBrains_Mono } from 'next/font/google';
import Nav from './nav';
import './globals.css';

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--sans' });
const jetBrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--mono' });

export const metadata: Metadata = {
  title: 'next-video',
  description:
    'Next Video solves the hard problems with embedding, storing, streaming, and customizing video in your Next.js app.',
};

const fileDir = dirname(fileURLToPath(import.meta.url));
const themeScript = await fs.readFile(`${fileDir}/theme-toggle.js`, 'utf-8');

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${dmSans.variable} ${jetBrainsMono.variable}`}
    >
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <header>
          <Link className="logo" href="/">
            <code>next-video</code>
            <span> playground</span>
          </Link>
          <Nav />
        </header>
        <aside>
          <nav>
            <ul>
              <li>
                <Link href="/">Basic example</Link>
              </li>
              <li>
                <Link href="/slotted-poster">Slotted Poster</Link>
              </li>
            </ul>
          </nav>
        </aside>
        {children}
      </body>
    </html>
  );
}
