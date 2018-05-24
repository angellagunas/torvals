const model = require('seraph-model')

const Organization = model(db, 'organizations');

Organization.schema = {
  uuid: {
    type: String,
    required: true
  },
  name: {
    type: String
  }
}
