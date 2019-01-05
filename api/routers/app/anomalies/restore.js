const Route = require('lib/router/route')
const { 
  Anomaly,
  Project,
  DataSetRow,
  AdjustmentRequest,
  User
} = require('models')
const ObjectId = require('mongodb').ObjectID

module.exports = new Route({
  method: 'post',
  path: '/restore/:uuid',
  handler: async function (ctx) {
    var data = ctx.request.body

    const project = await Project.findOne({uuid: ctx.params.uuid}).populate('activeDataset')

    ctx.assert(project, 404, 'Proyecto no encontrado')

    var batchSize = 1000
    var bulkOps = []
    var updateBulk = []

    let prediction = 0

    for (var anomaly of data.anomalies) {
      try {
        anomaly = await Anomaly.findOne({uuid: anomaly.uuid})
        if (anomaly) {
          
          bulkOps.push({
            updateOne: {
              'filter': {_id: anomaly._id},
              'update': {$set: {isDeleted: true}}
            }
          })

          prediction = data.rol === 'manager-level-1' ? 0 : anomaly.prediction

          updateBulk.push({
            'organization': anomaly.organization,
            'project': anomaly.project,
            'dataset': project.activeDataset._id,
            'apiData': anomaly.apiData,
            'product': anomaly.product,
            'salesCenter': anomaly.salesCenter,
            'channel': anomaly.channel,
            'cycle': anomaly.cycle,
            'period': anomaly.period,
            'data': {
              ...anomaly.data,
              'prediction': prediction,
              'sale': anomaly.data.sale,
              'forecastDate': anomaly.date,
              'semanaBimbo': anomaly.data.semanaBimbo,
              'adjustment': prediction,
              'localAdjustment': prediction
            }
          })
        }

        if (bulkOps.length === batchSize) {
          console.log("JPPPPPPP1")
          console.log(`${batchSize} anomalies saved!`)
          await Anomaly.bulkWrite(bulkOps)
          bulkOps = []

          let newDataSetRow = await DataSetRow.insertMany(updateBulk)

          if (data.rol === 'manager-level-1') {
            console.log("JPPPPPPP2")
            let user = await User.findOne({uuid: data.userUuid})

            for( let value of newDataSetRow){
              //value._id = ObjectId(value._id)
              value.data.prediction = prediction
              value.data.adjustment = prediction
              value.data.localAdjustment = prediction
              value.dataSetRow = ObjectId(value._id)
              value.newAdjustment = prediction
              value.requestBy = ObjectId(user._id)
              delete value._id
            }
            console.log("JPPPPPPP3")
            //await AdjustmentRequest.insertMany(updateBulk)
            await AdjustmentRequest.insertMany(newDataSetRow)

          }
          newDataSetRow = []
          //updateBulk = []
        }
      } catch (e) {
        ctx.throw(500, 'Error recuperando las anomalías')
      }
    }

    try {
      console.log("JJJJJJJJJJJP1")
      if (bulkOps.length > 0) {
        console.log("JJJJJJJJJJJP2")
        await Anomaly.bulkWrite(bulkOps)
        console.log("JJJJJJJJJJJP2***")
        //AQUI NO SE PONE bulkOps = []

        //await DataSetRow.insertMany(updateBulk)

        let newDataSetRow2 = await DataSetRow.insertMany(updateBulk)
        console.log("JJJJJJJJJJJP2*-*-*-*-*-*-*-*-*-*-")
        
        console.log("data.rol", data.rol)
        if (data.rol === 'manager-level-1') {
          console.log("JJJJJJJJJJJP3")
          let user = await User.findOne({uuid: data.userUuid})
          
            let newV = []

            for( let value of newDataSetRow2){
              console.log("value", value)
              let x = {
                ...value,
                organization: value.organization,
                project: value.project,
                datasetRow: ObjectId(newDataSetRow2._id),
                //dataset: '', ?????
                //lastAdjustment: '',
                //newAdjustment: '',
                requestedBy: ObjectId(user._id),
                approvedBy: null,
                rejectedBy: null,
                product: ObjectId(value.apiData.producto_id),
                //newProduct: '', ?????
                catalogItems: [],/// ?????
                status: null,
                cycle: value.cycle,
                period: value.period,
                dateRequested: new Date(),
                //dateApproved: '',
                //dateRejected: ''
                //uuid: '',
                //isDeleted: ''
              }
              newV.push(x)
              /*
              value.data.prediction = prediction
              value.data.adjustment = prediction
              value.data.localAdjustment = prediction
              value.newAdjustment = prediction
              
              console.log("value._id", value._id)
              console.log("user._id", user._id)
              value.dataSetRow = ObjectId(value._id)
              value.requestBy = ObjectId(user._id)
              */
            }
            console.log("JJJJJJJJP 4---")
            
            //await AdjustmentRequest.insertMany(updateBulk)
            await AdjustmentRequest.insertMany(newV)
            //await AdjustmentRequest.insertMany(updateBulk)
        }
      }
    } catch (e) {
      console.log(e)
      ctx.throw(500, 'Error recuperando las anomalías')
    }

    ctx.body = {
      data: 'ok'
    }
  }
})
