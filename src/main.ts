import NextVideo from './lib/NextVideo';
import videoHandler from './lib/videoHandler';

import localUploadHandler from './lib/handlers/localUpload';

videoHandler('local.video.added', localUploadHandler);

// Don't love this little race condition... we gotta figure that one out.
import withNextVideo from './lib/withNextVideo';

export { NextVideo, videoHandler, withNextVideo };
