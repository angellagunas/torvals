const mongoose = require('mongoose')
const { Schema } = require('mongoose')
const { v4 } = require('uuid')
const dataTables = require('mongoose-datatables')
const moment = require('moment')

const userReportSchema = new Schema({
  user: {type: Schema.Types.ObjectId, ref: 'User'},
  dataset: {type: Schema.Types.ObjectId, ref: 'DataSet'},
  cycle: {type: Schema.Types.ObjectId, ref: 'Cycle'},
  project: {type: Schema.Types.ObjectId, ref: 'Project'},
  status: {
    type: String,
    enum: [
      'finished',
      'in-progress'
    ],
    default: 'in-progress'
  },
  dateCreated: { type: Date, default: moment.utc },
  uuid: { type: String, default: v4 },
  isDeleted: { type: Boolean, default: false }
}, { usePushEach: true })

userReportSchema.plugin(dataTables)

userReportSchema.methods.toPublic = function () {
  return {
    user: this.user,
    dataset: this.dataset,
    cycle: this.cycle,
    status: this.status,
    dateCreated: this.dateCreated,
    uuid: this.uuid,
    isDeleted: this.isDeleted
  }
}

userReportSchema.methods.toAdmin = function () {
  return {
    user: this.user,
    dataset: this.dataset,
    cycle: this.cycle,
    status: this.status,
    dateCreated: this.dateCreated,
    uuid: this.uuid,
    isDeleted: this.isDeleted
  }
}

module.exports = mongoose.model('UserReport', userReportSchema)
