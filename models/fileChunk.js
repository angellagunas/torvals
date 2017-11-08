const mongoose = require('mongoose')
const { Schema } = require('mongoose')
const { v4 } = require('uuid')
const moment = require('moment')
const path = require('path')
const { aws } = require('../config')
const awsService = require('aws-sdk')
const fs = require('fs-extra')
const {
  recreateFile,
  deleteChunks
} = require('lib/tools')

const fileChunkSchema = new Schema({
  totalChunks: { type: Number },
  lastChunk: { type: Number },
  fileType: { type: String },
  fileId: { type: String },
  filename: { type: String },
  path: { type: String },
  recreated: { type: Boolean, default: false },
  uploaded: { type: Boolean, default: false },
  deletedChunks: { type: Boolean, default: false },
  uploadPath: {
    url: { type: String },
    bucket: { type: String },
    region: { type: String }
  },

  dateCreated: { type: Date, default: moment.utc },
  uuid: { type: String, default: v4 }
})

fileChunkSchema.methods.toPublic = function () {
  return {
    totalChunks: this.totalChunks,
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

fileChunkSchema.methods.recreateFile = async function () {
  if (this.lastChunk < this.totalChunks) return false

  if (this.recreated) return true

  await recreateFile(path.join(this.path, this.filename), this.totalChunks)
  this.recreated = true

  await this.save()

  return true
}

fileChunkSchema.methods.uploadChunks = async function (s3File, chunkKey) {
  if (this.lastChunk < this.totalChunks) return false

  if (this.uploaded || this.deletedChunks) return true

  let filename = path.join(this.path, this.filename)

  try {
    for (var i = 1; i <= this.totalChunks; i++) {
      s3File['Body'] = await fs.readFile(filename + '.' + i)
      s3File['Key'] = chunkKey + filename + '.' + i
      var s3 = new awsService.S3({
        credentials: {
          accessKeyId: aws.s3AccessKey,
          secretAccessKey: aws.s3Secret
        },
        region: aws.s3Region
      })

      await s3.putObject(s3File).promise()
    }

    this.set({
      uploadPath: {
        url: filename,
        bucket: s3File['Bucket'],
        region: aws.s3Region
      },
      uploaded: true
    })
  } catch (e) {
    this.uploaded = false
    return false
  }

  await this.save()

  return true
}

fileChunkSchema.methods.deleteChunks = async function () {
  if (this.lastChunk < this.totalChunks) return false

  if (this.deletedChunks) return true

  try {
    await deleteChunks(path.join(this.path, this.filename), this.totalChunks)
    this.deletedChunks = true
  } catch (e) {
    this.deletedChunks = false
  }

  await this.save()

  return true
}

module.exports = mongoose.model('FileChunk', fileChunkSchema)
