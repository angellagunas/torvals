const model = require('seraph-model')

const Dataset = model(db, 'datasets');

Dataset.schema = {
  uuid: {
    type: String,
    required: true
  },
  name: {
    type: String
  }
}
