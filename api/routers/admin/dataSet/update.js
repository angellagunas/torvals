const Route = require('lib/router/route')
const lov = require('lov')

const {User} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/:uuid',
  validator: lov.object().keys({
    name: lov.string().required(),
    description: lov.string()
  }),
  handler: async function (ctx) {
    
  }
})
