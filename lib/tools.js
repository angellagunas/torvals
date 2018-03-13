const traverse = require('traverse')
const fs = require('fs-extra')

function tvs (obj) {
  if (!(obj instanceof Object)) {
    return obj
  }

  return traverse(obj).map(function (x) {
    // eslint-disable-line array-callback-return
    if (this.key && this.key !== this.key.replace(/\./g, '')) {
      const key = this.key

      this.key = this.key.replace(/\./g, '')
      this.update(x)

      this.key = key
      this.delete()
    }
  })
}

var filterInt = function (value) {
  if (/^(\-|\+)?([0-9]+|Infinity)$/.test(value)) { return Number(value) }
  return NaN
}

var cleanFileIdentifier = function (identifier) {
  return identifier.replace(/^0-9A-Za-z_-/img, '')
}

var validateResumableRequest = function (chunkNumber, chunkSize, totalSize, identifier, filename, fileSize) {
    // Clean up the identifier
  identifier = cleanFileIdentifier(identifier)

    // Check if the request is sane
  if (chunkNumber === 0 || chunkSize === 0 || totalSize === 0 || identifier.length === 0 || filename.length === 0) {
    throw new Error('Invalid request')
  }
  var numberOfChunks = Math.max(Math.floor(totalSize / (chunkSize * 1.0)), 1)
  if (chunkNumber > numberOfChunks) {
    throw new Error('Size does not correspond to total number of chunks')
  }

  // Is the file too big?
  // if ($.maxFileSize && totalSize > $.maxFileSize) {
  //   return 'invalid_resumable_request2'
  // }

  if (typeof (fileSize) !== 'undefined') {
    if (chunkNumber < numberOfChunks && fileSize !== chunkSize) {
        // The chunk in the POST request isn't the correct size
      throw new Error('The chunk size does not correspond to the total number of chunks and file size')
    }
    if (numberOfChunks > 1 && chunkNumber === numberOfChunks && fileSize !== ((totalSize % chunkSize) + chunkSize)) {
        // The chunks in the POST is the last one, and the file is not the correct size
      throw new Error('Incorrect fileSize')
    }
    if (numberOfChunks === 1 && fileSize !== totalSize) {
        // The file is only a single chunk, and the data size does not fit
      throw new Error('Incorrect chunk size')
    }
  }

  return true
}

var recreateFile = async function (filename, chunks) {
  try {
    await fs.unlink(filename)
  } catch (e) {
    console.log('file not exists')
  }

  for (var i = 1; i <= chunks; i++) {
    var input = await fs.readFile(filename + '.' + i)
    await fs.appendFile(filename, input)
  }
}

var deleteChunks = async function (filename, chunks) {
  for (var i = 1; i <= chunks; i++) {
    await fs.unlink(filename + '.' + i)
  }
}

module.exports = {
  filterInt,
  tvs,
  cleanFileIdentifier,
  validateResumableRequest,
  recreateFile,
  deleteChunks
}
