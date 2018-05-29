const { FileChunk } = require('models')

module.exports = function createFileChunk (opts = {}) {
  const chunk = {
    lastChunk: 1,
    fileType: "text/csv",
    fileId: "datasetsTest",
    filename: "forecasts_3-prods_2017-2018.csv",
    path: "test/fixtures/datasetsTest",
    totalChunks: 1
  }

  return FileChunk.create(Object.assign({}, chunk, opts))
}
