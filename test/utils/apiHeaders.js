const { Organization } = require('models')

module.exports = async function(){
  const { createUser, createFullOrganization } = require('test/utils')

  const org = await createFullOrganization({
    name: 'Una org',
    description: 'Una descripción',
    slug: 'test-org'
  },{})

  const user = await createUser()
  const token = await user.createToken({type: 'session'})
  const jwt = token.getJwt()

  return {
    user: user,
    org: org,
    token: jwt,
    referer: 'http://'+org.slug+'.orax.com'
  }
}
