const Route = require('lib/router/route')

const { Product, Channel, Anomaly, SalesCenter, Project, Role, CatalogItem } = require('models')

module.exports = new Route({
  method: 'get',
  path: '/list/:uuid',
  handler: async function (ctx) {
    var filters = {}
    const project = await Project.findOne({uuid: ctx.params.uuid})

    ctx.assert(project, 404, 'Proyecto no encontrado')

    for (var filter in ctx.request.query) {
      if (filter === 'limit' || filter === 'start' || filter === 'sort') {
        continue
      }

      if (filter === 'semanaBimbo') {
        filters['semanaBimbo'] = ctx.request.query[filter]
        continue
      }

      if (filter === 'product') {
        filters[filter] = await Product.findOne({
          'uuid': ctx.request.query[filter],
          organization: ctx.state.organization
        })
        continue
      }

      if (filter === 'channel') {
        filters[filter] = await Channel.findOne({
          'uuid': ctx.request.query[filter],
          organization: ctx.state.organization
        })
        continue
      }

      if (filter === 'salesCenter') {
        filters[filter] = await SalesCenter.findOne({
          'uuid': ctx.request.query[filter],
          organization: ctx.state.organization
        })
        continue
      }
      if (filter === 'category') {
        var products = await Product.find({
          'category': ctx.request.query[filter],
          organization: ctx.state.organization
        })
        filters['product'] = { $in: products.map(item => { return item._id }) }
        continue
      }

      if (filter === 'requestId') {
        var requestId = ctx.request.query[filter]
        continue
      }

      if (filter === 'general') {
        let $or = []

        if (!isNaN(ctx.request.query[filter])) {
          $or.push({prediction: ctx.request.query[filter]})
        }

        let channelValues = []
        let channel = await Channel.find({
          name: new RegExp(ctx.request.query[filter], 'i'),
          isDeleted: false,
          organization: ctx.state.organization
        })
        channel.map(channel => {
          channelValues.push(channel._id)
        })

        if (channelValues.length) {
          $or.push({channel: {$in: channelValues}})
        }

        let productValues = []
        let product = await Product.find({
          '$or': [
            {name: new RegExp(ctx.request.query[filter], 'i')},
            {externalId: new RegExp(ctx.request.query[filter], 'i')}
          ],
          isDeleted: false,
          organization: ctx.state.organization
        })

        product.map(product => {
          productValues.push(product._id)
        })

        if (productValues.length) {
          $or.push({product: {$in: productValues}})
        }

        let salesCenterValues = []
        let salesCenter = await Product.find({
          '$or': [
            {name: new RegExp(ctx.request.query[filter], 'i')},
            {externalId: new RegExp(ctx.request.query[filter], 'i')}
          ],
          isDeleted: false,
          organization: ctx.state.organization
        })
        salesCenter.map(saleCenter => {
          salesCenterValues.push(saleCenter._id)
        })

        if (salesCenterValues.length) {
          $or.push({salesCenter: {$in: salesCenterValues}})
        }

        let catalogItemsValues = []
        let catalogItems = await CatalogItem.find({
          name: new RegExp(ctx.request.query[filter], 'i'),
          isDeleted: false,
          organization: ctx.state.organization
        })
        catalogItems.map(item => {
          catalogItemsValues.push(item._id)
        })

        if (catalogItemsValues.length) {
          $or.push({catalogItems: {$in: catalogItemsValues}})
        }

        if ($or.length) { filters['$or'] = $or }
      } else {
        if (!isNaN(parseInt(ctx.request.query[filter]))) {
          filters[filter] = parseInt(ctx.request.query[filter])
        } else {
          filters[filter] = ctx.request.query[filter]
        }
      }
    }

    const user = ctx.state.user
    var currentRole
    const currentOrganization = user.organizations.find(orgRel => {
      return ctx.state.organization._id.equals(orgRel.organization._id)
    })

    if (currentOrganization) {
      const role = await Role.findOne({_id: currentOrganization.role})

      currentRole = role.toPublic()
    }

    if (
      currentRole.slug === 'consultor-level-3' || currentRole.slug === 'manager-level-3'
    ) {
      var groups = user.groups
      if (!filters['salesCenter']) {
        var salesCenters = []

        salesCenters = await SalesCenter.find({
          groups: {$in: groups},
          organization: ctx.state.organization._id
        })

        filters['salesCenter'] = {$in: salesCenters}
      }

      if (!filters['channel']) {
        var channels = []

        channels = await Channel.find({
          groups: { $in: groups },
          organization: ctx.state.organization._id
        })

        filters['channel'] = {$in: channels}
      }
    }

    var rows = await Anomaly.dataTables({
      limit: ctx.request.query.limit || 20,
      skip: ctx.request.query.start,
      find: {
        isDeleted: false,
        ...filters,
        organization: ctx.state.organization._id,
        project: project._id
      },
      sort: ctx.request.query.sort || '-dateCreated',
      populate: ['salesCenter', 'product', 'channel', 'organization', 'catalogItems']
    })

    rows.data = rows.data.map(item => {
      return item.toPublic()
    })

    if (requestId) {
      rows['requestId'] = requestId
    }

    ctx.body = rows
  }
})
