const checkProjects = require('./check-projects')
const checkProjectCycleStatus = require('./check-project-cycle-status')
// #Requires

module.exports = {
  'check-projects': checkProjects,
  'check-project-cycle-status': checkProjectCycleStatus // #Exports
}
