// import { Asset } from './dist/assets';

declare module '*.mp4' {
  const content: import('../dist/assets').Asset;

  export default content;
}
