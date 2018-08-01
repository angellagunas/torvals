const Route = require('lib/router/route')
const { DataSet, CatalogItem, DataSetRow, Role, Cycle, Period } = require('models')
const moment = require('moment')

module.exports = new Route({
  method: 'post',
  path: '/sales/:uuid',
  handler: async function (ctx) {
    var data = ctx.request.body
    const dataset = await DataSet.findOne({uuid: ctx.params.uuid}).populate('rule project')
    ctx.assert(dataset, 404, 'Dataset no encontrado')

    const user = ctx.state.user
    await dataset.rule.populate('catalogs').execPopulate()

    let catalogs = dataset.rule.catalogs
    var currentRole
    const currentOrganization = user.organizations.find(orgRel => {
      return ctx.state.organization._id.equals(orgRel.organization._id)
    })

    if (currentOrganization) {
      const role = await Role.findOne({_id: currentOrganization.role})

      currentRole = role.toPublic()
    }
    var cycle = await Cycle.findOne({organization: ctx.state.organization, uuid: data.cycle})
    var periods = await Period.find({cycle: cycle._id})

    periods.ids = periods.map(item => {
      return item._id
    })

    var match = {
      'dataset': dataset._id,
      'data.adjustment': {
        '$ne': null
      },
      'data.prediction': {
        '$ne': null
      },
      'data.sale': {
        '$ne': null
      },
      'period': {
        '$in': periods.ids
      }
    }

    let previousStart = moment(cycle.dateStart, 'YYYY-MM-DD').subtract(1, 'years').utc()
    let previousEnd = moment(cycle.dateEnd, 'YYYY-MM-DD').subtract(1, 'years').utc()

    let previousPeriods = await Period.getBetweenDates(
      currentOrganization.organization._id,
      dataset.rule._id,
      previousStart.toDate(),
      previousEnd.toDate()
    )

    let matchPreviousSale = {
      'dataset': dataset.project.mainDataset,
      'data.adjustment': {
        '$ne': null
      },
      'data.prediction': {
        '$ne': null
      },
      'data.sale': {
        '$ne': null
      },
      'period': {
        $in: previousPeriods.map(item => { return item._id })
      }
    }

    let catalogItemsFilters = []

    for (let filter of Object.keys(data)) {
      var isCatalog = catalogs.find(item => {
        return item.slug === filter
      })

      if (isCatalog) {
        const cItem = await CatalogItem.findOne({uuid: data[filter]})
        catalogItemsFilters.push(cItem.id)
        continue
      }
    }

    if (catalogItemsFilters.length > 0) {
      let catalogItems = await CatalogItem.filterByUserRole(
        { _id: { $in: catalogItemsFilters } },
        currentRole.slug,
        user
      )
      match['catalogItems'] = { '$all': catalogItems }
    }

    if (
      currentRole.slug === 'manager-level-1' ||
      currentRole.slug === 'manager-level-2' ||
      currentRole.slug === 'consultor-level-2' ||
      currentRole.slug === 'consultor-level-3' ||
      currentRole.slug === 'manager-level-3'
    ) {
      if (catalogItemsFilters.length === 0) {
        let catalogItems = await CatalogItem.filterByUserRole(
            { },
            currentRole.slug,
            user
          )
        match['catalogItems'] = { '$in': catalogItems }
      }
    }

    let conditions = []
    let group = []
    if (data.prices) {
      conditions = [
        {
          '$lookup': {
            'from': 'prices',
            'localField': 'newProduct',
            'foreignField': 'product',
            'as': 'prices'
          }
        },
        {
          '$unwind': {
            'path': '$prices'
          }
        },
        {
          '$addFields': {
            'catalogsSize': {
              '$size': '$prices.catalogItems'
            }
          }
        },
        {
          '$match': {
            'catalogsSize': {
              '$gte': 1.0
            }
          }
        },
        {
          '$redact': {
            '$cond': [
              {
                '$setIsSubset': [
                  '$prices.catalogItems',
                  '$catalogItems'
                ]
              },
              '$$KEEP',
              '$$PRUNE'
            ]
          }
        }
      ]

      group = [
        {
          '$group': {
            '_id': '$period.period',
            'prediction': {
              '$sum': {
                '$multiply': [
                  '$data.prediction',
                  '$prices.price'
                ]
              }
            },
            'adjustment': {
              '$sum': {
                '$multiply': [
                  '$data.adjustment',
                  '$prices.price'
                ]
              }
            },
            'sale': {
              '$sum': {
                '$multiply': [
                  '$data.sale',
                  '$prices.price'
                ]
              }
            }
          }
        }
      ]
    } else {
      group = [
        {
          '$group': {
            '_id': '$period.period',
            'prediction': {
              '$sum': '$data.prediction'
            },
            'adjustment': {
              '$sum': '$data.adjustment'
            },
            'sale': {
              '$sum': '$data.sale'
            }
          }
        }
      ]
    }

    var statement = [
      {
        '$match': match
      },
      {
        '$lookup': {
          'from': 'catalogitems',
          'localField': 'newProduct',
          'foreignField': '_id',
          'as': 'products'
        }
      },
      {
        '$unwind': {
          'path': '$products',
          'includeArrayIndex': 'arrayIndex',
          'preserveNullAndEmptyArrays': false
        }
      },
      ...conditions,
      {
        '$lookup': {
          'from': 'periods',
          'localField': 'period',
          'foreignField': '_id',
          'as': 'period'
        }
      },
      ...group,
      {
        '$project': {
          'period': '$_id',
          'prediction': 1,
          'adjustment': 1
        }
      },
      {
        '$sort': {
          'period': 1
        }
      }
    ]

    var previousStatement = [
      {
        '$match': matchPreviousSale
      },
      {
        '$lookup': {
          'from': 'catalogitems',
          'localField': 'newProduct',
          'foreignField': '_id',
          'as': 'products'
        }
      },
      {
        '$unwind': {
          'path': '$products',
          'includeArrayIndex': 'arrayIndex',
          'preserveNullAndEmptyArrays': false
        }
      },
      ...conditions,
      {
        '$lookup': {
          'from': 'periods',
          'localField': 'period',
          'foreignField': '_id',
          'as': 'period'
        }
      },
      ...group,
      {
        '$project': {
          'period': '$_id',
          'prediction': 1,
          'adjustment': 1,
          'sale': 1
        }
      },
      {
        '$sort': {
          'period': 1
        }
      }
    ]

    var res = await DataSetRow.aggregate(statement)
    var previous = await DataSetRow.aggregate(previousStatement)

    ctx.body = {
      data: res,
      previous: previous
    }
  }
})