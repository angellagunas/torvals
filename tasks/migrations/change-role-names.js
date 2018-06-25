// node tasks/migrations/change-role-names
require('../../config')
const connection = require('lib/databases/mongo')
const {Role} = require('models')
const slugify = require('underscore.string/slugify')

var changeRoleNames = async function () {
  console.log('Starting .....')
  try {
    console.log('*****Changing role "Consultor" to "Consultor Level 3"')
    var roleObj = await Role.findOne({slug: 'consultor'})
    var newNameRole = 'Consultor Level 3'
    var newNameRoleSlug = slugify(newNameRole)

    var newRoleObj = await Role.findOne({slug: newNameRoleSlug})

    if (roleObj && !newRoleObj) {
      roleObj.name = newNameRole
      roleObj.slug = newNameRoleSlug
      await roleObj.save()
      console.log('Done "Consultor" to "Consultor Level 3" .....')
    } else {
      console.log('Role "Consultor" doesnt exits or role "Consultor Level 3" already exits')
    }

    console.log('*****Changing role "OpsManager" to "Manager Level 2"')
    roleObj = await Role.findOne({slug: 'opsmanager'})
    newNameRole = 'Manager Level 2'
    newNameRoleSlug = slugify(newNameRole)

    newRoleObj = await Role.findOne({slug: newNameRoleSlug})

    if (roleObj && !newRoleObj) {
      roleObj.name = newNameRole
      roleObj.slug = newNameRoleSlug
      await roleObj.save()
      console.log('Done "OpsManager" to "Manager Level 2" .....')
    } else {
      console.log('Role "OpsManager" doesnt exits or role "Manager Level 2" already exits')
    }

    console.log('*****Changing role "Manager Level 3" to "Consultor"')
    roleObj = await Role.findOne({slug: 'manager-level-3'})
    newNameRole = 'Consultor'
    newNameRoleSlug = slugify(newNameRole)

    newRoleObj = await Role.findOne({slug: newNameRoleSlug})

    if (roleObj && !newRoleObj) {
      roleObj.name = newNameRole
      roleObj.slug = newNameRoleSlug
      await roleObj.save()
      console.log('Done "Manager Level 3" to "Consultor" .....')
    } else {
      console.log('Role "Manager Level 3" doesnt exits or role "Consultor" already exits')
    }

    console.log('*****Changing role "LocalManager" to "Manager Level 1"')
    roleObj = await Role.findOne({slug: 'localmanager'})
    newNameRole = 'Manager Level 1'
    newNameRoleSlug = slugify(newNameRole)

    newRoleObj = await Role.findOne({slug: newNameRoleSlug})

    if (roleObj && !newRoleObj) {
      roleObj.name = newNameRole
      roleObj.slug = newNameRoleSlug
      await roleObj.save()
      console.log('Done "LocalManager" to "Manager Level 1" .....')
    } else {
      console.log('Role "LocalManager" doesnt exist or role "Manager Level 1" already exits')
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
