const Route = require('lib/router/route')
const path = require('path')
const fs = require('fs')
const fsExtra = require('fs-extra')

const finishUpload = require('queues/finish-upload')
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
      ctx.throw(400, 'Falta especificar el campo fields')
    }

    var chunkNumber = parseInt(chunkData.fields.resumableChunkNumber)
    var chunkSize = parseInt(chunkData.fields.resumableChunkSize)
    var totalSize = parseInt(chunkData.fields.resumableTotalSize)
    var totalChunks = parseInt(chunkData.fields.resumableTotalChunks)
    var identifier = chunkData.fields.resumableIdentifier
    var filename = chunkData.fields.resumableFilename.replace(/\(|\)/g, '')
    var fileType = chunkData.fields.resumableType
    var datasetId = chunkData.fields.dataset
    identifier = `${cleanFileIdentifier(identifier)}-${datasetId}`
    var chunk = await FileChunk.findOne({fileId: identifier})

    const dataset = await DataSet.findOne({uuid: datasetId}).populate('fileChunk')
    ctx.assert(dataset, 404, 'Dataset no encontrado')

    if (String(dataset.organization) !== String(ctx.state.organization._id)) {
      ctx.throw(404, 'Dataset no encontrado')
    }

    try {
      validateResumableRequest(chunkNumber, chunkSize, totalSize, identifier, filename)
    } catch (e) {
      ctx.throw(400, e.message)
    }

    const tmpdir = path.resolve('.', 'media', 'uploads', identifier)

    if (chunk && chunk.lastChunk === 0) {
      fs.mkdir(tmpdir, (err) => {
        console.log('Folder already exists')
      })
    }

    if (!chunk && chunkNumber === 1) {
      chunk = await FileChunk.create({
        lastChunk: 0,
        fileType: fileType,
        fileId: identifier,
        filename: filename,
        path: tmpdir,
        totalChunks: totalChunks
      })

      fs.mkdir(tmpdir, (err) => {
        if (err) {
          console.log('El Folder ya existe')
        }
      })
      dataset.set({
        fileChunk: chunk,
        status: 'uploading',
        uploadedBy: ctx.state.user
      })
      await dataset.save()
    }

    if (!chunk || !dataset.fileChunk) {
      ctx.status = 203
      return
    }

    if (chunk && chunk.fileId !== dataset.fileChunk.fileId) {
      dataset.set({
        fileChunk: chunk,
        status: 'uploading',
        uploadedBy: ctx.state.user
      })
      await dataset.save()
    }

    chunk = dataset.fileChunk

    if (chunk.fileId !== identifier) {
      ctx.throw(404, 'El identificador Chunk no coincide')
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
      ctx.throw(400, 'Falta el parametro files')
    }

    const filePaths = []
    const files = ctx.request.body.files || {}

    try {
      for (let key in files) {
        const file = files[key]
        const filePath = path.join(tmpdir, filename + '.' + chunkNumber)
        const completeFilePath = path.join(tmpdir, filename)
        var reader
        var writer

        await new Promise((resolve, reject) => {
          reader = fs.createReadStream(file.path).on('open', () => {
            writer = fs.createWriteStream(filePath).on('open', () => {
              reader.pipe(writer)
              resolve()
            }).on('error', e => {
              console.error(e)
              reject(e)
            })
          })
        })

        let input = await fsExtra.readFile(file.path)
        await fsExtra.appendFile(completeFilePath, input)

        filePaths.push(filePath)
      }
    } catch (e) {
      dataset.set({
        status: 'error',
        error: e.message
      })

      chunk.set({
        uploaded: false,
        recreated: false,
        lastChunk: 0
      })

      await dataset.save()
      await chunk.save()

      ctx.throw(500, e.message)
    }

    chunk.lastChunk = chunkNumber
    await chunk.save()

    if (chunkNumber === 1) {
      const filePath = path.join(tmpdir, filename + '.' + chunkNumber)
      reader = fs.createReadStream(filePath)
      let data = ''
      let lines = []
      reader.on('data', async (chunkItem) => {
        data += chunkItem
        lines = data.split('\n')
        if (lines.length > 2) {
          reader.destroy()
          lines = lines.slice(0, 1)
          var headers = lines[0].split(',')
          await dataset.setColumns(headers)
        }

        if (chunkNumber === totalChunks) {
          dataset.set({
            status: 'configuring'
          })
          await dataset.save()
          chunk.set({
            recreated: true
          })
          await chunk.save()
          finishUpload.add({uuid: dataset.uuid})
        }
        await dataset.save()
      })
      .on('error', function (err) {
        console.log(err)
      })
    } else if (chunkNumber === totalChunks) {
      dataset.set({
        status: 'configuring'
      })
      await dataset.save()
      chunk.set({
        recreated: true
      })
      await chunk.save()
      finishUpload.add({uuid: dataset.uuid})
    }

    ctx.body = 'OK'
  }
})
