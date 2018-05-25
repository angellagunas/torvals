const neo4j = require("neo4j-driver").v1
const config = require('config/neo4j')

const driver = neo4j.driver(
  config.neo4j.url,
  neo4j.auth.basic(
    config.neo4j.user,
    config.neo4j.password
  )
)

module.exports = driver
