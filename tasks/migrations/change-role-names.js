// node tasks/migrations/change-role-names
require('../../config')
const connection = require('lib/databases/mongo')
const {Role} = require('models')
const slugify = require('underscore.string/slugify')

var changeRoleNames = async function () {
  console.log('Starting .....')
  try {
    console.log('*****Changing role "Supervisor Ops" to "OpsManager"')
    var roleObj = await Role.findOne({slug: 'supervisor-ops'})
    var newNameRole = 'OpsManager'
    var newNameRoleSlug = slugify(newNameRole)

    var newRoleObj = await Role.findOne({slug: newNameRoleSlug})

    if (roleObj && !newRoleObj) {
      roleObj.name = newNameRole
      roleObj.slug = newNameRoleSlug
      await roleObj.save()
      console.log('Done "Supervisor Ops" to "OpsManager" .....')
    } else {
      console.log('Role "Supervisor Ops" doesnt exits or role "OpsManager" already exits')
    }

    console.log('*****Changing role "Supervisor" to "EnterpriseManager"')
    roleObj = await Role.findOne({slug: 'supervisor'})
    newNameRole = 'EnterpriseManager'
    newNameRoleSlug = slugify(newNameRole)

    newRoleObj = await Role.findOne({slug: newNameRoleSlug})

    if (roleObj && !newRoleObj) {
      roleObj.name = newNameRole
      roleObj.slug = newNameRoleSlug
      await roleObj.save()
      console.log('Done "Supervisor" to "EnterpriseManager" .....')
    } else {
      console.log('Role "Supervisor" doesnt exits or role "EnterpriseManager" already exits')
    }

    console.log('*****Changing role "Ops" to "LocalManager"')
    roleObj = await Role.findOne({slug: 'ops'})
    newNameRole = 'LocalManager'
    newNameRoleSlug = slugify(newNameRole)

    newRoleObj = await Role.findOne({slug: newNameRoleSlug})

    if (roleObj && !newRoleObj) {
      roleObj.name = newNameRole
      roleObj.slug = newNameRoleSlug
      await roleObj.save()
      console.log('Done "Ops" to "LocalManager" .....')
    } else {
      console.log('Role "Ops" doesnt exits or role "LocalManager" already exits')
    }

    console.log('*****Changing role "Analista" to "Analyst"')
    roleObj = await Role.findOne({slug: 'analista'})
    newNameRole = 'Analyst'
    newNameRoleSlug = slugify(newNameRole)

    newRoleObj = await Role.findOne({slug: newNameRoleSlug})

    if (roleObj && !newRoleObj) {
      roleObj.name = newNameRole
      roleObj.slug = newNameRoleSlug
      await roleObj.save()
      console.log('Done "Analista" to "Analyst" .....')
    } else {
      console.log('Role "Analista" doesnt exits or role "Analyst" already exits')
    }

    console.log('*****Changing role "Admin Organizacion" to "OrgAdmin"')
    roleObj = await Role.findOne({slug: 'admin-organizacion'})
    newNameRole = 'OrgAdmin'
    newNameRoleSlug = slugify(newNameRole)

    newRoleObj = await Role.findOne({slug: newNameRoleSlug})

    if (roleObj && !newRoleObj) {
      roleObj.name = newNameRole
      roleObj.slug = newNameRoleSlug
      await roleObj.save()
      console.log('Done "Admin Organizacion" to "OrgAdmin" .....')
    } else {
      console.log('Role "Admin Organizacion" doesnt exits or role "OrgAdmin" already exits')
    }
  } catch (e) {
    console.log('ERROR!!!!')
    console.log(e)
  }

  console.log('All done! Bye!')
  connection.close()
}

if (require.main === module) {
  changeRoleNames()
} else {
  module.exports = changeRoleNames
}
