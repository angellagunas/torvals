const seraph = require("seraph")
const config = require('config/neo4j')

const neo4jCon = seraph({
  bolt: true,
  server: config.neo4j.url,
  user: config.neo4j.user,
  pass: config.neo4j.password,
  id: "uuid"
})

module.exports = neo4jCon
