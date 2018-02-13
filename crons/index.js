const checkDatasets = require('./check-datasets')
const checkProjects = require('./check-projects')
const checkDatasetRows = require('./check-datasetrows')
// #Requires

module.exports = {
  'check-datasets': checkDatasets,
  'check-datasetrows': checkDatasetRows,
  'check-projects': checkProjects// #Exports
}
