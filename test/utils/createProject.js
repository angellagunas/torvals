const { Project } = require('models')

module.exports = function createProject (opts = {}) {
  const project = {
    name: "Project test",
    description: "Little description about the project",
  }

  return Project.create(Object.assign({}, project, opts))
}
