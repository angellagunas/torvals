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
  isDeleted: { type: Boolean, default: false },
  rule: {type: Schema.Types.ObjectId, ref: 'Rule'}
}, { usePushEach: true })

cycleSchema.methods.toPublic = function () {
  return {
    organization: this.organization,
    dateStart: this.dateStart,
    dateEnd: this.dateEnd,
    cycle: this.cycle,
    dateCreated: this.dateCreated,
    uuid: this.uuid,
    rule: this.rule
  }
}

cycleSchema.methods.toAdmin = function () {
  return {
    organization: this.organization,
    dateStart: this.dateStart,
    dateEnd: this.dateEnd,
    cycle: this.cycle,
    dateCreated: this.dateCreated,
    uuid: this.uuid,
    isDeleted: this.isDeleted,
    rule: this.rule
  }
}

cycleSchema.statics.getCurrent = async function (organization, rule) {
  const today = moment().format()
  return this.findOne({
    organization: organization,
    rule: rule,
    dateStart: { $lte: today },
    dateEnd: { $gte: today },
    isDeleted: false
  })
}

cycleSchema.statics.getAvailable = async function (organization, rule, cyclesAvailable) {
  const currentCycle = await this.getCurrent(organization, rule)
  const cycles = await this.find({
    organization: organization,
    rule: rule,
    dateStart: { $gte: currentCycle.dateStart },
    isDeleted: false
  }).sort({
    dateStart: 1
  }).limit(cyclesAvailable)
  return cycles
}

cycleSchema.statics.getBetweenDates = async function (organization, rule, minDate, maxDate) {
  const firstCycle = await this.findOne({
    organization: organization,
    rule: rule,
    isDeleted: false,
    dateStart: { $lte: minDate },
    dateEnd: { $gte: minDate }
  })

  const cycles = await this.find({
    organization: organization,
    rule: rule,
    dateStart: {
      $gte: (firstCycle) ? firstCycle.dateStart : minDate,
      $lte: maxDate
    },
    isDeleted: false
  }).sort({
    dateStart: 1
  })
  return cycles
}

module.exports = mongoose.model('Cycle', cycleSchema)
