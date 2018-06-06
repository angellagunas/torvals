const mongoose = require('mongoose')
const { Schema } = require('mongoose')
const { v4 } = require('uuid')
const moment = require('moment')

const periodSchema = new Schema({
  organization: {type: Schema.Types.ObjectId, ref: 'Organization', required: true},
  dateStart: { type: Date },
  dateEnd: { type: Date },
  cycle: { type: Schema.Types.ObjectId, ref: 'Cycle', required: true },
  period: {type: Number},
  dateCreated: { type: Date, default: moment.utc },
  uuid: { type: String, default: v4 },
  isDeleted: { type: Boolean, default: false }
}, { usePushEach: true })

periodSchema.methods.toPublic = function () {
  var data = {
    organization: this.organization,
    dateStart: this.dateStart,
    dateEnd: this.dateEnd,
    period: this.period,
    dateCreated: this.dateCreated,
    uuid: this.uuid
  }

  if (this.cycle) { data.cycle = this.cycle.toPublic() }

  return data
}

periodSchema.methods.toAdmin = function () {
  var data = {
    organization: this.organization,
    dateStart: this.dateStart,
    dateEnd: this.dateEnd,
    period: this.period,
    dateCreated: this.dateCreated,
    uuid: this.uuid,
    isDeleted: this.isDeleted
  }

  if (this.cycle) { data.cycle = this.cycle.toAdmin() }

  return data
}

periodSchema.statics.getBetweenDates = async function(organization, minDate, maxDate) {
  const firstPeriod = await this.findOne({
    organization: organization,
    isDeleted: false,
    dateStart: { $lte: minDate },
    dateEnd: { $gte: minDate }
  })
  const periods = await this.find({
    organization: organization,
    dateStart: {
      $gte: firstPeriod.dateStart,
      $lte: maxDate
    },
    isDeleted: false
  }).sort({
    dateStart: 1
  })
  return periods
}

module.exports = mongoose.model('Period', periodSchema)
