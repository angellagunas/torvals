const checkDatasets = require('./check-datasets')
const checkProjects = require('./check-projects')
const checkDatasetRows = require('./check-datasetrows')
const checkPrices = require('./check-prices')
// #Requires

module.exports = {
  'check-datasets': checkDatasets,
  'check-datasetrows': checkDatasetRows,
  'check-projects': checkProjects, // #Exports
  'check-prices': checkPrices
}
