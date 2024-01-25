import { videoHandler, callHandler } from './video-handler.js';
import { uploadLocalFile } from './handlers/local-upload.js';
import { uploadRequestedFile } from './handlers/api-request.js';
import log from './utils/logger.js';
import { withNextVideo } from './with-next-video.js';

try {
  // Don't love this little race condition... we gotta figure that one out.
  // Basically we need to make sure all the handlers are registered before we start watching for files.
  videoHandler('local.video.added', uploadLocalFile);
  videoHandler('request.video.added', uploadRequestedFile);

} catch (err) {
  // We'd much prefer to log an error here than crash since it can put
  // the main Next process in a weird state.
  log.error('An exception occurred within next-video. You may need to restart your dev server.');
  console.error(err);
}

export { videoHandler, withNextVideo, callHandler };
