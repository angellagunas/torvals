const mongoose = require('mongoose')
const { Schema } = require('mongoose')
const { v4 } = require('uuid')
const dataTables = require('mongoose-datatables')
const moment = require('moment')
const { aws } = require('../config')
const awsService = require('aws-sdk')
const fs = require('fs-extra')
const path = require('path')

const dataSetSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  path: {
    url: { type: String },
    bucket: { type: String },
    region: { type: String },
    savedToDisk: { type: Boolean, default: false }
  },
  externalId: { type: String },
  fileChunk: { type: Schema.Types.ObjectId, ref: 'FileChunk' },
  organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  type: {
    type: String,
    enum: ['univariable-time-series'],
    default: 'univariable-time-series'
  },

  status: {
    type: String,
    enum: [
      'new',
      'uploading',
      'uploaded',
      'preprocessing',
      'configuring',
      'processing',
      'reviewing',
      'ready'
    ],
    default: 'new'
  },

  columns: [{
    name: { type: String },
    isDate: { type: Boolean, default: false },
    analyze: { type: Boolean },
    isOperationFilter: { type: Boolean, default: false },
    isAnalysisFilter: { type: Boolean, default: false },
    values: [{ type: String }]
  }],

  groupings: [{
    column: { type: String },
    inputValue: { type: String },
    outputValue: { type: String }
  }],

  dateCreated: { type: Date, default: moment.utc },
  uuid: { type: String, default: v4 },
  isDeleted: { type: Boolean, default: false },
  uploaded: { type: Boolean, default: false }
})

dataSetSchema.plugin(dataTables)

dataSetSchema.methods.toPublic = function () {
  return {
    uuid: this.uuid,
    name: this.name,
    description: this.description,
    dateCreated: this.dateCreated,
    createdBy: this.createdBy,
    uploadedBy: this.uploadedBy,
    organization: this.organization,
    status: this.status,
    url: this.url,
    uploaded: this.uploaded,
    fileChunk: this.fileChunk,
    columns: this.columns,
    groupings: this.groupings
  }
}

dataSetSchema.methods.format = function () {
  return {
    uuid: this.uuid,
    name: this.name,
    description: this.description,
    dateCreated: this.dateCreated,
    createdBy: this.createdBy,
    uploadedBy: this.uploadedBy,
    organization: this.organization,
    status: this.status,
    url: this.url,
    uploaded: this.uploaded,
    columns: this.columns,
    groupings: this.groupings
  }
}

dataSetSchema.methods.recreateAndSaveFileToDisk = async function () {
  await this.fileChunk.recreateFile()

  if (!this.fileChunk.recreated) return false

  this.set({
    path: {
      savedToDisk: true,
      url: path.join(this.fileChunk.path, this.fileChunk.filename)
    }
  })

  return true
}

dataSetSchema.methods.recreateAndUploadFile = async function () {
  await this.fileChunk.recreateFile()

  if (!this.fileChunk.recreated) return false

  if (this.uploaded) return true

  let fileExtension = path.extname(this.fileChunk.filename)
  let fileName = `datasets/${this.uuid}/${v4()}${fileExtension}`
  let bucket = aws.s3Bucket
  let contentType = this.fileChunk.fileType
  let chunkKey = `datasets/${this.uuid}/`

  var s3File = {
    ContentType: contentType,
    Bucket: bucket,
    ACL: 'public-read'
  }

  // await this.fileChunk.uploadChunks(s3File, chunkKey)
  s3File['Body'] = await fs.readFile(path.join(this.fileChunk.path, this.fileChunk.filename))
  s3File['Key'] = fileName

  var s3 = new awsService.S3({
    credentials: {
      accessKeyId: aws.s3AccessKey,
      secretAccessKey: aws.s3Secret
    },
    region: aws.s3Region
  })

  try {
    await s3.putObject(s3File).promise()
    this.set({
      path: {
        url: fileName,
        bucket: bucket,
        region: aws.s3Region,
        savedToDisk: false
      },
      uploaded: true,
      status: 'preprocessing'
    })

    this.set({
      status: 'configuring',
      columns: [
        {
          name: 'Column A',
          values: ['a', 'b', 'c', 'd']
        },
        {
          name: 'Column B',
          values: ['a', 'b', 'c', 'd']
        },
        {
          name: 'Column C',
          values: ['a', 'b', 'c', 'd']
        }
      ]
    })

    await this.save()
  } catch (e) {
    console.log(e)
    this.set({
      path: {},
      uploaded: false,
      status: 'uploading'
    })

    await this.save()
  }

  return true
}

dataSetSchema.virtual('url').get(function () {
  if (this.path && this.path.savedToDisk) {
    return this.path.url
  }

  if (this.path && this.path.url) {
    return 'https://s3-' + this.path.region + '.amazonaws.com/' + this.path.bucket + '/' + this.path.url
  }

  return 'https://s3-us-west-2.amazonaws.com/pythia-kore-dev/avatars/default.jpg'
})

module.exports = mongoose.model('DataSet', dataSetSchema)
