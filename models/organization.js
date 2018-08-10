const mongoose = require('mongoose')
const { Schema } = require('mongoose')
const { v4 } = require('uuid')
const dataTables = require('mongoose-datatables')
const moment = require('moment')
const { aws } = require('../config')
const awsService = require('aws-sdk')
const assert = require('http-assert')
const sendEmail = require('tasks/emails/send-email')

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

  country: { type: String },
  status: { type: String,
    enum: [
      'active',
      'inactive',
      'trial',
      'activationPending'
    ],
    default: 'trial'
  },
  employees: { type: Number },
  rfc: { type: String },
  billingEmail: { type: String },
  businessName: { type: String },
  businessType: { type: String },
  accountType: { type: String, default: 'managed' },
  trialStart: { type: Date, default: moment.utc },
  trialEnd: { type: Date, default: moment.utc().add(30, 'd') },
  availableUsers: { type: Number, default: 20 },
  billingStart: { type: Date },
  billingEnd: { type: Date},
  salesRep: {
    name: { type: String },
    email: { type: String },
    phone: { type: String }
  },
  wizardSteps: {
    businessRules: { type: Boolean, default: false },
    project: { type: Boolean, default: false },
    forecast: { type: Boolean, default: false },
    users: { type: Boolean, default: false }
  },

  alerts: [{
    alert: { type: Schema.Types.ObjectId, ref: 'Alert' },
    users: [{ type: Schema.Types.ObjectId, ref: 'User' }]
  }],

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
    rules: this.rules,

    country: this.country,
    status: this.status,
    employees: this.employees,
    rfc: this.rfc,
    billingEmail: this.billingEmail,
    businessName: this.businessName,
    businessType: this.businessType,
    accountType: this.accountType,
    trialStart: this.trialStart,
    trialEnd: this.trialEnd,
    availableUsers: this.availableUsers,
    billingStart: this.billingStart,
    billingEnd: this.billingEnd,
    salesRep: this.salesRep,
    wizardSteps: this.wizardSteps,
    alerts: this.alerts
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
    rules: this.rules,

    country: this.country,
    status: this.status,
    employees: this.employees,
    rfc: this.rfc,
    billingEmail: this.billingEmail,
    businessName: this.businessName,
    businessType: this.businessType,
    accountType: this.accountType,
    trialStart: this.trialStart,
    trialEnd: this.trialEnd,
    availableUsers: this.availableUsers,
    billingStart: this.billingStart,
    billingEnd: this.billingEnd,
    salesRep: this.salesRep,
    wizardSteps: this.wizardSteps,
    alerts: this.alerts
  }
}

organizationSchema.methods.endTrialPeriod = async function () {
  const User = mongoose.model('User')
  const owner = await User.findOne({'organizations.organization': this._id, accountOwner: true})
  assert(owner, 401, 'La orgnaización o tiene dueño')

  this.status = 'inactive'
  await this.save()

  const recipients = {
    email: owner.email,
    name: owner.name
  }
  sendEmail.run({
    recipients,
    args: data,
    template: 'trial',
    title: 'Período de prueba en Orax ha terminado.'
  })

  return {orgazation: this, user: owner}
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
