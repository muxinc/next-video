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
        <Link className={`link ${pathname === '/background-video' ? 'active' : ''}`} href="/background-video">Background video</Link>
      </li>
      <li>
        <Link className={`link ${pathname === '/custom-player' ? 'active' : ''}`} href="/custom-player">Custom player</Link>
      </li>
      <li>
        <Link className={`link ${pathname === '/slotted-poster' ? 'active' : ''}`} href="/slotted-poster">Slotted poster</Link>
      </li>
      <li>
        <Link className={`link ${pathname === '/string-source' ? 'active' : ''}`} href="/string-source">String video source</Link>
      </li>
      <li>
        <Link className={`link ${pathname === '/player-only' ? 'active' : ''}`} href="/player-only">Player only</Link>
      </li>
    </ul>
  </nav>
}
