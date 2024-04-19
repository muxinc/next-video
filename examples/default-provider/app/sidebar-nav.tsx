'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link';

export default function SidebarNav() {
  const pathname = usePathname()

  return <nav>
    <ul>
      <li>
        <Link className={`link ${pathname === '/' ? 'active' : ''}`} href="/">Basic example</Link>
      </li>
      <li>
        <Link className={`link ${pathname === '/background-video' ? 'active' : ''}`} href="/background-video">Background Video</Link>
      </li>
      <li>
        <Link className={`link ${pathname === '/slotted-poster' ? 'active' : ''}`} href="/slotted-poster">Slotted Poster</Link>
      </li>
      <li>
        <Link className={`link ${pathname === '/string-source' ? 'active' : ''}`} href="/string-source">String video source</Link>
      </li>
    </ul>
  </nav>
}
