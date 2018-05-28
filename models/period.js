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

  if (this.cycle) { data.cycle = this.cycle.toPublic() }

  return data
}

module.exports = mongoose.model('Period', periodSchema)
