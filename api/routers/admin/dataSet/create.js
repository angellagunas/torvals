const Route = require('lib/router/route')
const lov = require('lov')
const crypto = require('crypto')

const {User, Role, DataSet, Organization} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/',
  validator: lov.object().keys({
    name: lov.string().required(),
    description: lov.string(),
    organization: lov.string().required()
  }),
  handler: async function (ctx) {
    const body = ctx.request.body
    const org = await Organization.findOne({uuid: body.organization})

    if(!org){
      ctx.throw(404, 'Organization not found')
    }

    const dataset = await DataSet.create({
      name: body.name,
      description: body.description,
      organization: org._id
    })

    ctx.body = {
      data: dataset
    }
  }
})
