const mongoose = require('mongoose')
const { Schema } = require('mongoose')
// const { v4 } = require('uuid')
// const dataTables = require('mongoose-datatables')

const fileChunkSchema = new Schema({
  totalChunks: { type: Number },
  lastChunk: { type: Number },
  fileType: { type: String },
  fileId: { type: String },
  filename: { type: String },
  recreated: { type: Boolean, default: false }
})

// fileChunkSchema.plugin(dataTables)

fileChunkSchema.methods.toPublic = function () {
  return {
    lastChunk: this.lastChunk,
    fileType: this.fileType,
    fileId: this.fileId,
    filename: this.filename
  }
}

fileChunkSchema.methods.format = function () {
  return {
    uuid: this.uuid,
    fileType: this.fileType,
    fileId: this.fileId,
    filename: this.filename
  }
}

module.exports = mongoose.model('FileChunk', fileChunkSchema)
