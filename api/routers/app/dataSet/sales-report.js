const Route = require('lib/router/route')
const { DataSet, CatalogItem, DataSetRow, Role, Cycle, Period } = require('models')
const moment = require('moment')

module.exports = new Route({
  method: 'post',
  path: '/sales/:uuid',
  handler: async function (ctx) {
    const data = ctx.request.body
    const dataset = await DataSet.findOne({ uuid: ctx.params.uuid }).populate('rule project')
    ctx.assert(dataset, 404, 'Dataset no encontrado')

    const user = ctx.state.user
    await dataset.rule.populate('catalogs').execPopulate()

    let catalogs = dataset.rule.catalogs
    let currentRole
    const currentOrganization = user.organizations.find(orgRel => {
      return ctx.state.organization._id.equals(orgRel.organization._id)
    })

    if (currentOrganization) {
      const role = await Role.findOne({ _id: currentOrganization.role })

      currentRole = role.toPublic()
    }
    const cycle = await Cycle.findOne({ organization: ctx.state.organization, uuid: data.cycle })
    const periods = await Period.find({ cycle: cycle._id })

    const periodsIds = periods.map(item => {
      return item._id
    })

    let match = {
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
        '$in': periodsIds
      }
    }

    const previousStart = moment(cycle.dateStart, 'YYYY-MM-DD').subtract(1, 'years').utc()
    const previousEnd = moment(cycle.dateEnd, 'YYYY-MM-DD').subtract(1, 'years').utc()

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
      const isCatalog = catalogs.find(item => {
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

    const permissions = [
      'manager-level-1' ,
      'manager-level-2',
      'manager-level-3',
      'consultor-level-2' ,
      'consultor-level-3' 
    ]
    if (permissions.includes(currentRole.slug) && catalogItemsFilters.length === 0) {
      let catalogItems = await CatalogItem.filterByUserRole(
          { },
          currentRole.slug,
          user
        )
      match['catalogItems'] = { '$in': catalogItems }
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

    const statement = [
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

    const previousStatement = [
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

    const res = await DataSetRow.aggregate(statement)
    const previous = await DataSetRow.aggregate(previousStatement)

    ctx.body = {
      data: res,
      previous: previous
    }
  }
})
