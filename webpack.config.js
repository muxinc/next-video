const path = require("path");

module.exports = {
  module: {
    rules: [
      {
        test: /.mp4$/,
        use: ["video-loader"],
      },
    ],
  },
  resolveLoader: {
    alias: {
      "video-loader": path.resolve(__dirname, "video-loader.js"),
    },
  },
};
