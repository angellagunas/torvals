const redis = require('redis')
const {promisify} = require('util')
const config = require('config')

var client = redis.createClient(config.redis)
const hGetAll = promisify(client.hgetall).bind(client)
const hSet = promisify(client.hset).bind(client)
const expire = promisify(client.expire).bind(client)

module.exports = {
  hGetAll,
  hSet,
  expire
}
