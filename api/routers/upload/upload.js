const Route = require('lib/router/route')
const path = require('path')
const fs = require('fs')

const { FileChunk, DataSet } = require('models')
const {
  cleanFileIdentifier,
  validateResumableRequest
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
    var fileType = chunkData.fields.resumableType
    var datasetId = chunkData.fields.dataset
    identifier = cleanFileIdentifier(identifier)

    var chunk = await FileChunk.findOne({fileId: identifier})
    const dataset = await DataSet.findOne({uuid: datasetId}).populate('fileChunk')
    ctx.assert(dataset, 404, 'Dataset not found')

    try {
      validateResumableRequest(chunkNumber, chunkSize, totalSize, identifier, filename)
    } catch (e) {
      ctx.throw(400, e.message)
    }

    if (chunk && !dataset.fileChunk) {
      dataset.set({
        fileChunk: chunk,
        status: chunk.recreated ? 'preprocessing' : 'uploading'
      })
      await dataset.save()
    }

    const tmpdir = path.join('.', 'media', 'uploads', identifier)

    if (!chunk && chunkNumber === 1) {
      chunk = await FileChunk.create({
        lastChunk: 0,
        fileType: fileType,
        fileId: identifier,
        filename: filename,
        path: tmpdir,
        totalChunks: totalChunks
      })

      try {
        await fs.mkdir(tmpdir)
      } catch (e) {
        console.log('File already exists!')
      }

      dataset.set({
        fileChunk: chunk,
        status: 'uploading',
        uploadedBy: ctx.state.user
      })
      await dataset.save()
    }

    if (chunk && chunkNumber === 1 && chunk.fileId !== dataset.fileChunk.fileId) {
      dataset.set({
        fileChunk: chunk,
        status: 'uploading',
        uploadedBy: ctx.state.user
      })
      await dataset.save()
    }

    if (!chunk) {
      ctx.status = 203
      return
    }

    chunk = dataset.fileChunk

    if (chunk.fileId !== identifier) {
      ctx.throw(404, "Chunk identifier doesn't match")
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
        const reader = fs.createReadStream(file.path)
        const writer = fs.createWriteStream(filePath)
        reader.pipe(writer)
        filePaths.push(filePath)
      }
    } catch (e) {
      ctx.throw(500, e.message)
    }

    chunk.lastChunk = chunkNumber

    if (chunkNumber === totalChunks) {
      dataset.set({ status: 'uploaded' })
      dataset.save()
    //   await dataset.recreateAndUploadFile()
    }

    chunk.save()
    ctx.body = 'OK'
  }
})
