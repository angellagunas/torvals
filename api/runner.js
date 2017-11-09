require('../config')
require('lib/databases/mongo')
require('lib/abraxas/api')

const { apiPort } = require('config/server')
const app = require('./')

app.listen(apiPort)
console.log(`Api started on port ${apiPort}`)
