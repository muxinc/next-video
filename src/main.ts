import videoHandler from './video-handler';
import localUploadHandler from './handlers/local-upload';

// Don't love this little race condition... we gotta figure that one out.
// Basically we need to make sure all the handlers are registered before we start watching for files.
videoHandler('local.video.added', localUploadHandler);

import withNextVideo from './with-next-video';

export { videoHandler, withNextVideo };
