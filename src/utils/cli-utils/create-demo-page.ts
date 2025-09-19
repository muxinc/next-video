import { writeFile, mkdir, access, readFile  } from 'node:fs/promises';
import path from 'node:path';
import log from '../logger.js';

export type RoutingType = 'app' | 'pages' | 'unknown';

export async function detectRoutingType(): Promise<{ type: RoutingType; basePath: string }> {
  // Check for src directory first
  const hasSrcDir = await access('src')
    .then(() => true)
    .catch(() => false);
  const basePath = hasSrcDir ? 'src' : '.';

  try {
    // Check for app directory (App Router)
    await access(path.join(basePath, 'app'));
    return { type: 'app', basePath };
  } catch {
    // App directory doesn't exist, check for pages directory
    try {
      await access(path.join(basePath, 'pages'));
      return { type: 'pages', basePath };
    } catch {
      // Neither exists, check package.json for clues
      try {
        const packageJson = await readFile('package.json', 'utf-8');
        const pkg = JSON.parse(packageJson);

        // Check if it's a Next.js project
        if (pkg.dependencies?.next || pkg.devDependencies?.next) {
          // Default to app if it's Next.js but no routing structure detected
          return { type: 'app', basePath };
        }
      } catch {
        // Can't read package.json
      }

      return { type: 'unknown', basePath };
    }
  }
}

const DEMO_CONTENT = `import Video from 'next-video';
import sampleVideo from '/videos/sample-video.mp4';

export default function DemoVideo() {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      padding: '20px'
    }}>
      <div style={{ 
        maxWidth: '800px', 
        width: '100%',
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ 
          textAlign: 'center', 
          marginBottom: '20px',
          color: '#333'
        }}>
          Next-Video Demo
        </h1>
        <Video 
          src={sampleVideo} 
          style={{ 
            width: '100%', 
            height: 'auto',
            borderRadius: '4px'
          }}
        />
        <p style={{ 
          textAlign: 'center', 
          marginTop: '20px',
          color: '#666',
          fontSize: '14px'
        }}>
          If you can see this video playing, your next-video setup is working correctly!
        </p>
      </div>
    </div>
  );
}
`;

export async function createDemoPage(): Promise<{ success: boolean; route: string }> {
  try {
    const { type: routingType, basePath } = await detectRoutingType();

    if (routingType === 'app') {
      const appPath = path.join(basePath, 'app', 'demo-video');
      await mkdir(appPath, { recursive: true });
      await writeFile(path.join(appPath, 'page.tsx'), DEMO_CONTENT);
      log.info(`Created demo page: ${path.join(basePath, 'app', 'demo-video', 'page.tsx')}`);
      return { success: true, route: '/demo-video' };
    } else if (routingType === 'pages') {
      const pagesPath = path.join(basePath, 'pages');
      await mkdir(pagesPath, { recursive: true });
      await writeFile(path.join(pagesPath, 'demo-video.tsx'), DEMO_CONTENT);
      log.info(`Created demo page: ${path.join(basePath, 'pages', 'demo-video.tsx')}`);
      return { success: true, route: '/demo-video' };
    } else {
      const componentPath = path.join(basePath, 'components');
      await mkdir(componentPath, { recursive: true });
      await writeFile(path.join(componentPath, 'DemoVideo.tsx'), DEMO_CONTENT);
      log.info(`Created demo component: ${path.join(basePath, 'components', 'DemoVideo.tsx')}`);
      log.info('You can import and use this component in any page');
      return { success: true, route: 'component' };
    }
  } catch (error: any) {
    log.warning('Failed to create demo page:', error.message);
    return { success: false, route: '' };
  }
}
