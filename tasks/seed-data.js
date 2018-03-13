// node tasks/seed-data --file <file>
require('../config')
const connection = require('lib/databases/mongo')
const fs = require('fs')
const { User, Organization, Role } = require('models')
const slugify = require('underscore.string/slugify')
const lov = require('lov')
const verifyPrices = require('queues/update-prices')

var argv = require('minimist')(process.argv.slice(2))

var today = new Date()
var timestamp = today.getTime()

const output = fs.createWriteStream(
  './tasks/logs/seed-data-' + timestamp + '.txt'
)
const error = fs.createWriteStream(
  './tasks/logs/error-seed-data-' + timestamp + '.txt'
)

const schema = lov.object().required().keys({
  users: lov.array().required().items(
    lov.object().keys({
      email: lov.string().required(),
      password: lov.string().required(),
      name: lov.string().required()
    })
  ),
  admins: lov.array().required().items(
    lov.object().keys({
      email: lov.string().required(),
      password: lov.string().required(),
      name: lov.string().required()
    })
  ),
  organizations: lov.array().required().items(
    lov.object().keys({
      name: lov.string().required(),
      description: lov.string()
    })
  ),
  roles: lov.array().required().items(
    lov.object().keys({
      name: lov.string().required(),
      priority: lov.number(),
      isDefault: lov.boolean()
    })
  ),
  relations: lov.array().required().items(
    lov.object().keys({
      user: lov.string().required(),
      organization: lov.string().required(),
      role: lov.string().required()
    })
  )
})

var seedData = async function () {
  if (!argv.file) {
    throw new Error('A JSON file with the data is required!')
  }

  console.log('Starting ....')

  let data = {}

  try {
    console.log('Loading data from file ....')
    const saveFile = fs.readFileSync(
      argv.file,
      'utf8'
    )
    data = JSON.parse(saveFile)
  } catch (e) {
    error.write('Error when fetching data from Disk ' + e + '\n')
    console.log('---------------------------------------------------------')
    console.log('Error when fetching data from Disk ' + e)
    console.log('=========================================================')

    return
  }

  console.log('Validating data ....')
  let result = lov.validate(data, schema)

  if (result.error) {
    error.write('Data validation error: ' + result.error + '\n')
    console.log('---------------------------------------------------------')
    console.log('Data validation error: ' + result.error)
    console.log('=========================================================')

    return
  }

  console.log('Validation PASSED!')

  try {
    let defaultRole

    console.log('Saving roles ....')
    for (var role of data.roles) {
      const existingRole = await Role.findOne({
        name: role.name,
        slug: slugify(role.name),
      })

      if (!existingRole) {
        if (defaultRole && role.isDefault) {
          error.write("You can't have two default roles!" + '\n')
          console.log('---------------------------------------------------------')
          console.log("You can't have two default roles!")
          console.log('=========================================================')

          connection.close()
          return
        }

        const newRole = await Role.create({
          name: role.name,
          slug: slugify(role.name),
          isDefault: role.isDefault,
          priority: role.priority
        })


        if(role.isDefault) {
          defaultRole = newRole
        }
      } else {
        if (existingRole.isDefault) {
          defaultRole = existingRole
        }
      }
    }

    if(!defaultRole) {
      defaultRole = await Role.findOne({})

      defaultRole.isDefault = true
      defaultRole.save()
    }

    console.log('Saving users ....')
    for (var user of data.users) {
      const existingUser = await User.findOne({
        email: user.email,
        name: user.name,
        isAdmin: false,
        validEmail: true
      })

      if (!existingUser) {
        await User.create({
          email: user.email,
          password: user.password,
          name: user.name,
          isAdmin: false,
          validEmail: true,
        })
      }

      delete existingUser
    }

    console.log('Saving admins ....')
    for (var admin of data.admins) {
      const existingUser = await User.findOne({
        email: admin.email
      })

      if (!existingUser) {
        await User.create({
          email: admin.email,
          password: admin.password,
          name: admin.name,
          isAdmin: true,
          validEmail: true,
        })
      }

      delete existingUser
    }

    console.log('Saving organizations ....')
    for (var org of data.organizations) {
      const existingOrg = await Organization.findOne({
        name: org.name,
        slug: slugify(org.name)
      })

      if (!existingOrg) {
        const organizationCreated = await Organization.create({
          name: org.name,
          description: org.description,
          slug: slugify(org.name)
        })
        verifyPrices.add({uuid: organizationCreated.uuid})
      }

      delete existingOrg
    }

    console.log('Saving organizations and roles of users ....')
    for (var rel of data.relations) {
      const existingOrg = await Organization.findOne({
        name: rel.organization,
        slug: slugify(rel.organization)
      })

      const existingRole = await Role.findOne({
        name: rel.role,
        slug: slugify(rel.role)
      })

      const existingUser = await User.findOne({
        email: rel.user
      })

      if (!existingOrg || !existingRole || !existingUser) {
        console.log('Error!')
        console.log(`Can't save relation: ${rel.user} - ${rel.organization} - ${rel.role}`)
        continue
      }

      var pos = existingUser.organizations.findIndex(e => {
        return (
          String(e.organization) === String(existingOrg._id)
        )
      })

      if (pos >= 0) {
        `The user ${rel.user} already has the relation: ${rel.organization} - ${rel.role}`
        continue
      }

      pos = existingUser.organizations.findIndex(e => {
        return (
          String(e.organization) === String(existingOrg._id) &&
          String(e.role) === String(existingRole._id)
        )
      })

      if (pos >= 0) {
        console.log(
          `The user ${rel.user} already has the relation: ${rel.organization} - ${rel.role}`
        )
        continue
      }

      let orgObj = {organization: existingOrg, role: existingRole}

      existingUser.organizations.push(orgObj)

      await existingUser.save()

      delete existingOrg
      delete existingRole
      delete existingUser
    }
  } catch (e) {
    console.log('ERROR!!!!')
    console.log(e)
    output.write('ERROR!!!! \n')
    output.write(e)
    connection.close()
  }

  console.log('All done, bye!')
  connection.close()
}

if (require.main === module) {
  seedData()
} else {
  module.exports = seedData
}
