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
        <Link className={`link ${pathname === '/custom-theme' ? 'active' : ''}`} href="/custom-theme">Custom theme</Link>
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
        <Link className={`link ${pathname === '/hls-source' ? 'active' : ''}`} href="/hls-source">HLS source<span>player only</span></Link>
      </li>
      <li>
        <Link className={`link ${pathname === '/dash-source' ? 'active' : ''}`} href="/dash-source">DASH source<span>player only</span></Link>
      </li>
      <li>
        <Link className={`link ${pathname === '/mp4-source' ? 'active' : ''}`} href="/mp4-source">MP4 source<span>player only</span></Link>
      </li>
      <li>
        <Link className={`link ${pathname === '/source-tag' ? 'active' : ''}`} href="/source-tag">Source tag<span>player only</span></Link>
      </li>
    </ul>
  </nav>
}
