const checkDatasets = require('./check-datasets')
const checkProjects = require('./check-projects')
const checkDatasetRows = require('./check-datasetsrows')
// #Requires

module.exports = {
  'check-datasets': checkDatasets,
  'check-datasetrows': checkDatasetRows,
  'check-projects': checkProjects // #Exports

}
