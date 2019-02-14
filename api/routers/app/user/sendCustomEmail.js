const Route = require('lib/router/route')
const lov = require('lov')
const crypto = require('crypto')
const ObjectId = require('mongodb').ObjectID

const { User } = require('models')
module.exports = new Route({
  method: 'post',
  path: '/sendEmail',
  handler: async function (ctx) {
    const userData = ctx.request.body
    let currentUser
    userExist = await User.find({
      'isDeleted': false
    })
    emails = userExist.map(item => {return item.email})
    names = userExist.map(item => {return item.name})
    for(item of emails){
      currentUser = await User.findOne({
        email: {$in: item}
      })
      if(userData.sendEmail)
      {
        userData.name= ''
        userData.email = item
        currentUser.sendCustomEmail(userData.subject, userData.body)
      }
    }

    ctx.body = {
      data: currentUser.toPublic()
    }
  }
})
