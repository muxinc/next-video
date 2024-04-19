export default function Nav() {
  return <nav>
    <button
      className="theme-toggle"
      id="theme-toggle"
      title="Toggles light & dark"
      aria-label="auto"
      aria-live="polite"
    >
      <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24">
        <mask id="moon">
          <rect x="0" y="0" width="100%" height="100%" fill="white" />
          <circle cx="40" cy="8" r="11" fill="black" />
        </mask>
        <circle id="sun" cx="12" cy="12" r="11" mask="url(#moon)"/>
        <g id="sun-beams">
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
         </g>
      </svg>
    </button>
    <a href="https://github.com/muxinc/next-video" title="Source on Github">
      GitHub
    </a>
  </nav>
}
