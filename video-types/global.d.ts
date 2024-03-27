// Escape hatch for video files in a custom folder with URL params.
declare module '*&next-video' {
  const content: import('../dist/assets').Asset;

  export default content;
}

declare module '/videos/*' {
  const content: import('../dist/assets').Asset;

  export default content;
}

declare module '*.mp4' {
  const content: import('../dist/assets').Asset;

  export default content;
}

declare module '*.webm' {
  const content: import('../dist/assets').Asset;

  export default content;
}

declare module '*.mkv' {
  const content: import('../dist/assets').Asset;

  export default content;
}

declare module '*.ogg' {
  const content: import('../dist/assets').Asset;

  export default content;
}

declare module '*.ogv' {
  const content: import('../dist/assets').Asset;

  export default content;
}

declare module '*.wmv' {
  const content: import('../dist/assets').Asset;

  export default content;
}

declare module '*.avi' {
  const content: import('../dist/assets').Asset;

  export default content;
}

declare module '*.mov' {
  const content: import('../dist/assets').Asset;

  export default content;
}

declare module '*.flv' {
  const content: import('../dist/assets').Asset;

  export default content;
}

declare module '*.m4v' {
  const content: import('../dist/assets').Asset;

  export default content;
}

declare module '*.3gp' {
  const content: import('../dist/assets').Asset;

  export default content;
}
