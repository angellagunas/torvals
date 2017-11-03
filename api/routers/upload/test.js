const Route = require('lib/router/route')

const { FileChunk } = require('models')
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

    identifier = cleanFileIdentifier(identifier)
    validateResumableRequest(chunkNumber, chunkSize, totalSize, identifier, filename)

    var chunk = await FileChunk.findOne({fileId: identifier})

    if (!chunk) {
      ctx.status = 203
      return
    }

    if (chunk.lastChunk >= chunkNumber) {
      ctx.body = 'OK'
      return
    }

    ctx.status = 203
    ctx.body = chunk.lastChunk
  }
})
