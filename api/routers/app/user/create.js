const Route = require('lib/router/route')
const lov = require('lov')
const crypto = require('crypto')
const ObjectId = require('mongodb').ObjectID

const {User, Role, Group, Project} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/',
  validator: lov.object().keys({
    email: lov.string().email().required(),
    name: lov.string().required()
  }),
  handler: async function (ctx) {
    const userData = ctx.request.body

    if (!userData.password && !userData.sendInvite) {
      ctx.throw(400, 'Password o invitación requeridos')
    }

    if (!userData.password) {
      userData.password = crypto.randomBytes(15).toString('base64')
    }

    var currentRole
    var currentOrganization
    if (ctx.state.organization) {
      currentOrganization = ctx.state.user.organizations.find(orgRel => {
        return ctx.state.organization._id.equals(orgRel.organization._id)
      })

      if (currentOrganization) {
        const role = await Role.findOne({_id: currentOrganization.role})

        currentRole = role
      }
    }

    if (currentRole.slug === 'consultor-level-3' || currentRole.slug === 'manager-level-3') {
      userData.role = currentRole._id
    }

    userData.role = await Role.findOne({ uuid: userData.role })

    if (!userData.role) {
      let defaultRole = await Role.findOne({isDefault: true})
      if (!defaultRole) {
        defaultRole = await Role.create({
          name: 'Default',
          slug: 'default',
          description: 'Default role',
          isDefault: true
        })
      }

      userData.role = defaultRole
    }

    if (!ctx.state.organization) {
      ctx.throw(404, 'Organización no encontrada')
    }

    let orgObj = {
      organization: ctx.state.organization,
      role: userData.role
    }

    if (userData.project) {
      const project = await Project.findOne({'uuid': userData.project})
      ctx.assert(project, 404, 'Proyecto no encontrado')
      orgObj.defaultProject = project
    }

    userData.organizations = [orgObj]

    var group = userData.group
    userData.group = undefined

    let user = await User.findOne({email: userData.email})

    if (user) {
      let actualOrg = user.organizations.find(item => {
        return String(item.organization._id) === String(ctx.state.organization._id)
      })

      if (!actualOrg) {
        user.organizations.push(orgObj)
        user.markModified('organizations')
        user.save()
      } else {
        ctx.throw(400, 'Usuario existente!')
      }
    } else {
      user = await User.register(userData)
    }

    if (group) {
      group = await Group.findOne({'uuid': group})
      ctx.assert(group, 404, 'Grupo no encontrada')

      if (user.groups.find(item => { return String(item) === String(group._id) })) {
        ctx.throw(400, 'Solamente puedes agregar el usuario al grupo una vez')
      }

      user.groups.push(group)
      group.users.push(user)
      await group.save()
    }

    if (currentRole.slug === 'manager-level-2') {
      var statement = [
        {
          '$match': { '_id': ObjectId(ctx.state.user._id) }
        },
        {
          '$lookup': {
            'from': 'groups',
            'localField': 'groups',
            'foreignField': '_id',
            'as': 'infoGroup'
          }
        },
        {
          '$unwind': {
            'path': '$infoGroup'
          }
        },
        {
          '$match': {
            'infoGroup.organization': ObjectId(ctx.state.organization._id)
          }
        }
      ]

      var currentUserGroups = await User.aggregate(statement)

      for (let currentGroup of currentUserGroups) {
        if (!group || (group && String(group._id) !== String(currentGroup.infoGroup._id))) {
          user.groups.push(currentGroup.infoGroup)

          await Group.findOneAndUpdate(
            {'_id': currentGroup.infoGroup._id},
            {$push: {'users': user._id}}
          )
        }
      }
    }

    await user.save()

    if (userData.sendInvite) {
      user.sendInviteEmail()
    }

    ctx.body = {
      data: user.toPublic()
    }
  }
})
