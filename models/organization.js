const mongoose = require('mongoose')
const { Schema } = require('mongoose')
const { v4 } = require('uuid')
const dataTables = require('mongoose-datatables')
const moment = require('moment')
const { aws } = require('../config')
const awsService = require('aws-sdk')

const organizationSchema = new Schema({
  name: { type: String },
  description: { type: String },
  slug: { type: String },
  groups: [{ type: Schema.Types.ObjectId, ref: 'Group' }],
  organizationPicture: {
    url: { type: String },
    bucket: { type: String },
    region: { type: String }
  },

  dateCreated: { type: Date, default: moment.utc },
  uuid: { type: String, default: v4 },
  isDeleted: { type: Boolean, default: false },
  isConfigured: { type: Boolean, default: false }
}, { usePushEach: true })

organizationSchema.plugin(dataTables)

organizationSchema.methods.toPublic = function () {
  return {
    uuid: this.uuid,
    name: this.name,
    description: this.description,
    slug: this.slug,
    dateCreated: this.dateCreated,
    profileUrl: this.profileUrl,
    isConfigured: this.isConfigured,
    rules: this.rules
  }
}

organizationSchema.methods.toAdmin = function () {
  return {
    uuid: this.uuid,
    name: this.name,
    slug: this.slug,
    description: this.description,
    dateCreated: this.dateCreated,
    profileUrl: this.profileUrl,
    isConfigured: this.isConfigured,
    rules: this.rules
  }
}

organizationSchema.methods.uploadOrganizationPicture = async function (file) {
  if (!file) return false

  let fileName = 'logos/' + this.uuid + '/profile.jpg'
  let bucket = aws.s3Bucket
  let contentType = file.split(';')[0]

  var s3File = {
    Key: fileName,
    Body: Buffer.from(file.split(',')[1], 'base64'),
    ContentType: contentType,
    Bucket: bucket,
    ACL: 'public-read'
  }

  var s3 = new awsService.S3({
    credentials: {
      accessKeyId: aws.s3AccessKey,
      secretAccessKey: aws.s3Secret
    },
    region: aws.s3Region
  })

  await s3.putObject(s3File).promise()

  this.organizationPicture = {
    url: fileName,
    bucket: bucket,
    region: aws.s3Region
  }

  this.save()

  return true
}

organizationSchema.virtual('profileUrl').get(function () {
  if (this.organizationPicture && this.organizationPicture.url) {
    return 'https://s3.' + this.organizationPicture.region + '.amazonaws.com/' + this.organizationPicture.bucket + '/' + this.organizationPicture.url
  }

  return 'https://s3.us-west-2.amazonaws.com/pythia-kore-dev/avatars/default.jpg'
})

module.exports = mongoose.model('Organization', organizationSchema)
