const mongoose = require('mongoose')
const { Schema } = require('mongoose')
const { v4 } = require('uuid')
const moment = require('moment')

const cycleSchema = new Schema({
  organization: {type: Schema.Types.ObjectId, ref: 'Organization', required: true},
  dateStart: { type: Date },
  dateEnd: { type: Date },
  cycle: { type: Number },
  dateCreated: { type: Date, default: moment.utc },
  uuid: { type: String, default: v4 },
  isDeleted: { type: Boolean, default: false }
}, { usePushEach: true })

cycleSchema.methods.toPublic = function () {
  return {
    dateStart: this.dateStart,
    dateEnd: this.dateEnd,
    cycle: this.cycle,
    dateCreated: this.dateCreated,
    uuid: this.uuid,
    isDeleted: this.isDeleted
  }
}

cycleSchema.methods.toAdmin = function () {
  return {
    dateStart: this.dateStart,
    dateEnd: this.dateEnd,
    cycle: this.cycle,
    dateCreated: this.dateCreated,
    uuid: this.uuid,
    isDeleted: this.isDeleted
  }
}

module.exports = mongoose.model('Cycle', cycleSchema)
