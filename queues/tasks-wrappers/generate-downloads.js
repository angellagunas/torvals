const generateDownload = require('../../tasks/dataset/generate-download')

module.exports = async function (job) {
  let a
  a = await generateDownload.run(job.data)
  return a
}
