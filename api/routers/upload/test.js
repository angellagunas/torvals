const Route = require('lib/router/route')

const { DataSet } = require('models')
const { cleanFileIdentifier, validateResumableRequest } = require('lib/tools')

module.exports = new Route({
  method: 'get',
  path: '/',
  handler: async function (ctx) {
    const chunkData = ctx.request.query

    if (!chunkData || Object.keys(chunkData).length === 0) {
      ctx.throw(400, 'Fields parameter is missing!')
    }

    var chunkNumber = parseInt(chunkData.resumableChunkNumber)
    var chunkSize = parseInt(chunkData.resumableChunkSize)
    var totalSize = parseInt(chunkData.resumableTotalSize)
    var identifier = chunkData.resumableIdentifier
    var filename = chunkData.resumableFilename
    var datasetId = chunkData.dataset
    const dataset = await DataSet.findOne({uuid: datasetId}).populate('fileChunk')
    ctx.assert(dataset, 404, 'Dataset not found')

    identifier = cleanFileIdentifier(identifier)
    validateResumableRequest(chunkNumber, chunkSize, totalSize, identifier, filename)

    var chunk = dataset.fileChunk

    if (!chunk) {
      ctx.status = 203
      return
    }

    if (chunk.fileId !== identifier) {
      ctx.throw(404, "Chunk identifier doesn't match")
    }

    if (chunk.lastChunk >= chunkNumber) {
      if (chunk.totalChunks === chunkNumber) {
        dataset.set({ status: 'uploaded' })
        dataset.save()
      //   await dataset.recreateAndUploadFile()
      }

      ctx.body = 'OK'
      return
    }

    ctx.status = 203
    ctx.body = chunk.lastChunk
  }
})
