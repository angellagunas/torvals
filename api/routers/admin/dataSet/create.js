const Route = require('lib/router/route')
const lov = require('lov')
const crypto = require('crypto')

const {User, Role, DataSet} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/',
  validator: lov.object().keys({
    name: lov.string().required(),
	description: lov.string().required(),
	path: lov.string().required(),
	organization: lov.string().trim().required(),
	uploadedBy: lov.string().trim().required(),
	type: lov.string().required(),
	status: lov.string().required(),
	/*columns: lov.array().items(lov.object().keys({
	    isDate: lov.boolean().required(),
	    analyze: lov.string().required(),
	    isOperationFilter: lov.boolean().required(),
	    isAnalysisFilter: lov.boolean().required(),
	    distinctValues: lov.string().required()
	}))*/
	
  }),
  
  handler: async function (ctx) {
    const datasetData = ctx.request.body

    const dataset = await DataSet.create(datasetData)
    ctx.body = {
      data: dataset
    }
    
  }
})
