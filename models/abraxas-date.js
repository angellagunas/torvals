const mongoose = require('mongoose')
const { Schema } = require('mongoose')
const { v4 } = require('uuid')
const dataTables = require('mongoose-datatables')
const moment = require('moment')

const abraxasDateSchema = new Schema({
  dateStart: { type: Date },
  dateEnd: { type: Date },
  week: { type: Number },
  month: { type: Number },
  year: { type: Number },
  externalId: { type: String },

  dateCreated: { type: Date, default: moment.utc },
  uuid: { type: String, default: v4 },
  isDeleted: { type: Boolean, default: false }
}, { usePushEach: true })

abraxasDateSchema.plugin(dataTables)

abraxasDateSchema.methods.toPublic = function () {
  return {
    uuid: this.uuid,
    dateCreated: this.dateCreated,
    week: this.week,
    month: this.month,
    year: this.year,
    externalId: this.externalId,
    dateStart: this.dateStart,
    dateEnd: this.dateEnd
  }
}

abraxasDateSchema.methods.format = function () {
  return {
    uuid: this.uuid,
    dateCreated: this.dateCreated,
    week: this.week,
    month: this.month,
    year: this.year,
    externalId: this.externalId,
    dateStart: this.dateStart,
    dateEnd: this.dateEnd
  }
}

module.exports = mongoose.model('AbraxasDate', abraxasDateSchema)
