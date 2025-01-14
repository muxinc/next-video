import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as fs from 'node:fs/promises';

import type { Metadata } from 'next';
import { DM_Sans, JetBrains_Mono } from 'next/font/google';
import Nav from '../nav';
import SidebarNav from '../sidebar-nav';
import '../globals.css';

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--sans' });
const jetBrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--mono' });

export const metadata: Metadata = {
  title: 'next-video',
  description:
    'Next Video solves the hard problems with embedding, storing, streaming, and customizing video in your Next.js app.',
};

// https://francoisbest.com/posts/2023/reading-files-on-vercel-during-nextjs-isr
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const nextJsRootDir = path.resolve(__dirname, '../../')

export function resolve(importMetaUrl: string, ...paths: string[]) {
  const dirname = path.dirname(fileURLToPath(importMetaUrl))
  const absPath = path.resolve(dirname, ...paths)
  // Required for ISR serverless functions to pick up the file path
  // as a dependency to bundle.
  return path.resolve(process.cwd(), absPath.replace(nextJsRootDir, '.'))
}

const themeScript = await fs.readFile(resolve(import.meta.url, `../theme-toggle.js`), 'utf-8');

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
          <div className="inner">
            <Nav />
          </div>
        </header>
        <main>
          <div className="inner">
            <aside>
              <h1><code>next-video</code> <span>Playground</span></h1>
              <SidebarNav />
            </aside>
            {children}
          </div>
        </main>
        <footer>
          <div className="inner">
            <a className="mux-link" href="https://www.mux.com/" target="_blank">
              <span hidden>Made by Mux</span>
              <svg className="mux-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 77 24"><path d="M47.73 0c-1.64 0-2.97 1.34-2.97 3v9c0 3.31-2.67 6-5.94 6-3.28 0-5.94-2.69-5.94-6V3c0-1.66-1.33-3-2.97-3s-2.97 1.34-2.97 3v9c0 6.62 5.33 12 11.88 12S50.7 18.62 50.7 12V3c.01-1.66-1.32-3-2.97-3M60.92 12l-6.81 6.88a3.02 3.02 0 0 0 0 4.24 2.95 2.95 0 0 0 4.2 0l6.81-6.88 6.81 6.88a2.95 2.95 0 0 0 4.2 0 3.02 3.02 0 0 0 0-4.24L69.32 12l6.81-6.88a3.02 3.02 0 0 0 0-4.24 2.95 2.95 0 0 0-4.2 0l-6.81 6.88L58.3.88a2.95 2.95 0 0 0-4.2 0 3.02 3.02 0 0 0 0 4.24zM21.93.23a2.96 2.96 0 0 0-3.24.65l-6.81 6.88L5.07.88A2.94 2.94 0 0 0 1.83.23 2.99 2.99 0 0 0 0 3v18c0 1.66 1.33 3 2.97 3s2.97-1.34 2.97-3V10.24l3.84 3.88a2.95 2.95 0 0 0 4.2 0l3.84-3.88V21c0 1.66 1.33 3 2.97 3s2.97-1.34 2.97-3V3c.01-1.21-.72-2.31-1.83-2.77"/></svg>
            </a>
          </div>
        </footer>
      </body>
    </html>
  );
}
