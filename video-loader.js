// A webpack loader that processes files
// in the "/video/files" directory that do not end in .json.
// For each file it finds,
// it emits the file to the output directory using emitFile.
// It also checks if there is a corresponding .json file in the same directory maching the file name plus .json.
// If it finds one, it converts the contents of the .json file to a javascript object and returns it.
// If it does not find one, it creates a file in the /video/files directory with the same name as the source file plus .json.
// This new file contains a json object
// with a key of "fileName" and a value of the file name,
// and another key of "filePath" and a value of the file path.

const fs = require("fs");
const path = require("path");

module.exports = function (source) {
  const callback = this.async();
  const file = this.resourcePath;
  const fileName = path.basename(file);
  const fileDir = path.dirname(file);
  const fileExt = path.extname(file);
  const fileBase = path.basename(file, fileExt);
  const jsonFile = path.join(fileDir, fileBase + fileExt + ".json");
  const json = {};
  json.fileName = fileName;
  json.filePath = fileDir;

  this.emitFile(fileName, source);

  fs.stat(jsonFile, (err, stats) => {
    if (err) {
      fs.writeFile(jsonFile, JSON.stringify(json), (err) => {
        if (err) {
          callback(err);
        } else {
          fs.readFile(jsonFile, (err, data) => {
            if (err) {
              callback(err);
            } else {
              console.log("data", data);
              const str = `export default ${data}`;
              callback(null, str);
            }
          });
        }
      });
    } else {
      fs.readFile(jsonFile, (err, data) => {
        if (err) {
          callback(err);
        } else {
          console.log("data", data);
          const str = `export default ${data}`;
          callback(null, str);
        }
      });
    }
  });
};

module.exports.raw = true;
