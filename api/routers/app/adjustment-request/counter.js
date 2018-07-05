const ObjectId = require('mongodb').ObjectID
const Route = require('lib/router/route')
const moment = require('moment')
const _ = require('lodash')

const {DataSet, AdjustmentRequest, Role, SalesCenter, Channel, Cycle} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/counter/:uuid/',
  handler: async function (ctx) {
    let datasetId = ctx.params.uuid

    const dataset = await DataSet.findOne({
      'uuid': datasetId,
      'isDeleted': false,
      'organization': ctx.state.organization
    }).populate('rule')
    ctx.assert(dataset, 404, 'DataSet not found')

    let filters = {
      'dataset': ObjectId(dataset._id),
      'isDeleted': false,
      'status': 'created'
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
      var salesCenters = []

      salesCenters = await SalesCenter.find({
        groups: {$in: groups},
        organization: ctx.state.organization._id
      })

      filters['salesCenter'] = {$in: salesCenters}

      var channels = []

      channels = await Channel.find({
        groups: { $in: groups },
        organization: ctx.state.organization._id
      })

      filters['channel'] = {$in: channels}
    }

    let adjustmentRequests = await AdjustmentRequest.find(filters).populate('datasetRow')

    if (currentRole.slug === 'consultor-level-2' || currentRole.slug === 'manager-level-2') {
      let ranges = dataset.rule.rangesLvl2
      let cycles = await Cycle.find({
        organization: ctx.state.organization,
        rule: dataset.rule,
        dateStart: {$lte: moment.utc(dataset.dateMax), $gte: moment.utc(dataset.dateMin).subtract(1, 'days')}
      }).sort({'cycle': 1})

      cycles = cycles.map(item => {
        return {
          cycle: item.cycle,
          uuid: item.uuid,
          dateStart: item.dateStart,
          dateEnd: item.dateEnd
        }
      })

      adjustmentRequests = adjustmentRequests.filter(item => {
        let rangeIndex = _.findIndex(cycles, cycle => {
          return moment(cycle.dateStart).utc() <= moment(item.datasetRow.data.forecastDate).utc() &&
                 moment(cycle.dateEnd).utc() >= moment(item.datasetRow.data.forecastDate).utc()
        })

        let percentage = Math.round(((item.newAdjustment - item.lastAdjustment) / item.lastAdjustment) * 100)
        return percentage <= ranges[rangeIndex]
      })
    }

    ctx.body = {
      data: {created: adjustmentRequests.length}
    }
  }
})
