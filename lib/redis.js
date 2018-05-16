const redis = require('redis')
const {promisify} = require('util')

var client = redis.createClient()
const hGetAll = promisify(client.hgetall).bind(client)
const hSet = promisify(client.hset).bind(client)

module.exports = {
  hGetAll,
  hSet
}
