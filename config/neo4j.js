const env = require('./env')

const neo4j = {
  host: process.env.NEO4J_HOST,
  port: process.env.NEO4J_PORT,
  user: process.env.NEO4J_USER,
  password: process.env.NEO4J_PASSWORD
}

neo4j.url = `bolt://${neo4j.host}`

module.exports = {
  neo4j
}
