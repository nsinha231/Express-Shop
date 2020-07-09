const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FileSchema = new Schema({
  contentType: { type: String, required: true },
  filename: { type: String, required: true },
  fileID: { type: String, required: true },
  size: { type: String, required: true },
});

const File = mongoose.model('File', FileSchema);

module.exports = File;
