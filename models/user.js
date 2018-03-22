const mongoose = require('mongoose')
const { Schema } = require('mongoose')
const { v4 } = require('uuid')
const bcrypt = require('bcrypt')
const dataTables = require('mongoose-datatables')
const assert = require('http-assert')
const { aws } = require('../config')
const awsService = require('aws-sdk')

const Mailer = require('lib/mailer')

const SALT_WORK_FACTOR = parseInt(process.env.SALT_WORK_FACTOR)

const userSchema = new Schema({
  name: { type: String, required: true },
  password: { type: String },
  email: { type: String, required: true, unique: true, trim: true },
  validEmail: {type: Boolean, default: false},

  screenName: { type: String },
  displayName: { type: String },
  isAdmin: {type: Boolean, default: false},
  organizations: [{
    organization: { type: Schema.Types.ObjectId, ref: 'Organization' },
    role: { type: Schema.Types.ObjectId, ref: 'Role' },
    defaultProject: { type: Schema.Types.ObjectId, ref: 'Project' }

  }],
  groups: [{ type: Schema.Types.ObjectId, ref: 'Group' }],
  profilePicture: {
    url: { type: String },
    bucket: { type: String },
    region: { type: String }
  },

  isDeleted: { type: Boolean, default: false },

  resetPasswordToken: { type: String, default: v4 },
  inviteToken: { type: String, default: v4 },

  uuid: { type: String, default: v4 },
  apiToken: { type: String, default: v4 }
}, { usePushEach: true })

userSchema.pre('save', function (next) {
  if (this.isNew) {
    this.id = this._id.toString()
  }

  if (this.email) {
    this.email = this.email.toLowerCase()
  }

  next()
})

userSchema.pre('save', function (next) {
  if (!this.password || !this.isModified('password')) {
    return next()
  }

  try {
    const salt = bcrypt.genSaltSync(SALT_WORK_FACTOR)
    this.password = bcrypt.hashSync(this.password, salt)
  } catch (err) {
    return next(err)
  }

  return next()
})

// Methods
userSchema.methods.toPublic = function () {
  return {
    uuid: this.uuid,
    screenName: this.screenName,
    displayName: this.displayName,
    name: this.name,
    email: this.email,
    organizations: this.organizations,
    validEmail: this.validEmail,
    groups: this.groups,
    profileUrl: this.profileUrl,
    isAdmin: this.isAdmin
  }
}

userSchema.methods.toAdmin = function () {
  return {
    uuid: this.uuid,
    screenName: this.screenName,
    displayName: this.displayName,
    name: this.name,
    email: this.email,
    isAdmin: this.isAdmin,
    validEmail: this.validEmail,
    organizations: this.organizations,
    groups: this.groups,
    profileUrl: this.profileUrl
  }
}

userSchema.methods.validatePassword = async function (password) {
  const isValid = await new Promise((resolve, reject) => {
    bcrypt.compare(password, this.password, (err, compared) =>
      (err ? reject(err) : resolve(compared))
    )
  })

  return isValid
}

userSchema.methods.createToken = async function (options = {}) {
  const UserToken = mongoose.model('UserToken')

  const token = await UserToken.create({
    user: this._id,
    name: options.name,
    type: options.type || ''
  })

  return token
}

// Statics
userSchema.statics.auth = async function (email, password) {
  const userEmail = email.toLowerCase()
  const user = await this.findOne({email: userEmail, isDeleted: false}).populate('organizations.organization')
  assert(user, 401, 'Invalid email/password')

  const isValid = await new Promise((resolve, reject) => {
    bcrypt.compare(password, user.password, (err, compared) =>
      (err ? reject(err) : resolve(compared))
    )
  })

  assert(isValid, 401, 'Invalid email/password')

  return user
}

userSchema.statics.register = async function (options) {
  const {email} = options

  const emailTaken = await this.findOne({ email })
  assert(!emailTaken, 401, 'Email already in use')

  // create in mongoose
  const createdUser = await this.create(options)

  return createdUser
}

userSchema.statics.validateInvite = async function (email, token) {
  const userEmail = email.toLowerCase()
  const user = await this.findOne({email: userEmail, inviteToken: token})
  assert(user, 401, 'Invalid token! You should contact the administrator of this page.')

  return user
}

userSchema.statics.validateResetPassword = async function (email, token) {
  const userEmail = email.toLowerCase()
  const user = await this.findOne({email: userEmail, resetPasswordToken: token})
  assert(user, 401, 'Invalid token! You should contact the administrator of this page.')

  return user
}

userSchema.methods.uploadProfilePicture = async function (file) {
  if (!file) return false

  let fileName = `avatars/${v4()}.jpg`
  let bucket = aws.s3Bucket
  let contentType = file.split(';')[0]

  var s3File = {
    Key: fileName,
    Body: new Buffer(file.split(',')[1], 'base64'),
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

  this.profilePicture = {
    url: fileName,
    bucket: bucket,
    region: aws.s3Region
  }

  this.save()

  return true
}

userSchema.virtual('profileUrl').get(function () {
  if (this.profilePicture && this.profilePicture.url) {
    return 'https://s3.' + this.profilePicture.region + '.amazonaws.com/' + this.profilePicture.bucket + '/' + this.profilePicture.url
  }

  return 'https://s3.us-west-2.amazonaws.com/pythia-kore-dev/avatars/default.jpg'
})

userSchema.methods.validatePassword = async function (password) {
  const isValid = await new Promise((resolve, reject) => {
    bcrypt.compare(password, this.password, (err, compared) =>
      (err ? reject(err) : resolve(compared))
    )
  })

  return isValid
}

userSchema.methods.sendInviteEmail = async function () {
  this.inviteToken = v4()
  await this.save()

  const email = new Mailer('invite')

  const data = this.toJSON()
  data.url = process.env.APP_HOST + '/emails/invite?token=' + this.inviteToken + '&email=' + encodeURIComponent(this.email)

  await email.format(data)
  await email.send({
    recipient: {
      email: this.email,
      name: this.name
    },
    title: 'Invite to Pythia'
  })
}

userSchema.methods.sendResetPasswordEmail = async function (admin) {
  this.inviteToken = v4()
  await this.save()
  let url = process.env.APP_HOST

  if (admin) url = process.env.ADMIN_HOST + process.env.ADMIN_PREFIX

  const email = new Mailer('reset-password')

  const data = this.toJSON()
  data.url = url + '/emails/reset?token=' + this.resetPasswordToken + '&email=' + encodeURIComponent(this.email)

  await email.format(data)
  await email.send({
    recipient: {
      email: this.email,
      name: this.name
    },
    title: 'Reset passsword for Pythia'
  })
}

userSchema.plugin(dataTables, {
  formatters: {
    toAdmin: (user) => user.toAdmin(),
    toPublic: (user) => user.toAdmin()
  }
})

module.exports = mongoose.model('User', userSchema)
