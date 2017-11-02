const Route = require('lib/router/route')
const path = require('path')
const fs = require('fs')

const { FileChunk } = require('models')
const {
  cleanFileIdentifier,
  validateResumableRequest,
  recreateFile
} = require('lib/tools')

module.exports = new Route({
  method: 'post',
  path: '/',
  handler: async function (ctx) {
    const chunkData = ctx.request.body

    if (!chunkData.fields || Object.keys(chunkData.fields).length === 0) {
      ctx.throw(400, 'Fields parameter is missing!')
    }

    var chunkNumber = parseInt(chunkData.fields.resumableChunkNumber)
    var chunkSize = parseInt(chunkData.fields.resumableChunkSize)
    var totalSize = parseInt(chunkData.fields.resumableTotalSize)
    var totalChunks = parseInt(chunkData.fields.resumableTotalChunks)
    var identifier = chunkData.fields.resumableIdentifier
    var filename = chunkData.fields.resumableFilename

    identifier = cleanFileIdentifier(identifier)

    try {
      validateResumableRequest(chunkNumber, chunkSize, totalSize, identifier, filename)
    } catch (e) {
      ctx.throw(400, e.message)
    }

    var chunk = await FileChunk.findOne({fileId: identifier})
    const tmpdir = path.join('.', identifier)

    if (!chunk && chunkNumber === 1) {
      chunk = await FileChunk.create({
        lastChunk: 0,
        fileType: chunkData.resumableType,
        fileId: identifier,
        filename: filename
      })

      await fs.mkdirSync(tmpdir)
    }

    if (!chunk) {
      ctx.status = 203
      return
    }

    if (chunk.lastChunk >= chunkNumber) {
      ctx.status = 200
      return
    }

    if (chunk.lastChunk + 1 !== chunkNumber) {
      ctx.status = 203
      return
    }

    if (!chunkData.files || chunkData.files.length === 0) {
      ctx.throw(400, 'Files parameter is missing!')
    }

    const filePaths = []
    const files = ctx.request.body.files || {}

    try {
      for (let key in files) {
        const file = files[key]
        const filePath = path.join(tmpdir, filename + '.' + chunkNumber)
        // await fs.closeSync(await fs.openSync(filePath, 'a'))
        const reader = fs.createReadStream(file.path)
        const writer = fs.createWriteStream(filePath)
        reader.pipe(writer)
        filePaths.push(filePath)
      }
    } catch (e) {
      console.log('error! ' + e)
    }

    chunk.lastChunk = chunkNumber

    if (chunkNumber === totalChunks) {
      recreateFile(path.join(tmpdir, filename), totalChunks)
      chunk.recreated = true
    }

    chunk.save()
    ctx.body = 'OK'
  }
})
