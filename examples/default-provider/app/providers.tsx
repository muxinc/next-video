'use client'

import { ThemeProvider } from 'next-themes'

export function Providers({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <ThemeProvider>{children}</ThemeProvider>
}
