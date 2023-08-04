import videoHandler from './videoHandler';
import localUploadHandler from './handlers/localUpload';
import './webpack-loader';
// Don't love this little race condition... we gotta figure that one out.
// Basically we need to make sure all the handlers are registered before we start watching for files.
videoHandler('local.video.added', localUploadHandler);

import NextVideo from './NextVideo';
import withNextVideo from './withNextVideo';

export { NextVideo, videoHandler, withNextVideo };
