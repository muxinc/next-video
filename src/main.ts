import videoHandler from './lib/videoHandler';
import localUploadHandler from './lib/handlers/localUpload';
// Don't love this little race condition... we gotta figure that one out.
// Basically we need to make sure all the handlers are registered before we start watching for files.
videoHandler('local.video.added', localUploadHandler);

import NextVideo from './lib/NextVideo';
import withNextVideo from './lib/withNextVideo';

export { NextVideo, videoHandler, withNextVideo };
