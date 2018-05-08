const { RequestLog } = require('models')
const req = require('request-promise-native')
var qs = require('qs')
const { URL } = require('url')
const { tvs } = require('./tools')
const _ = require('lodash')

async function request (options) {
  var headers = {}
  var query = ''
  var host = ''
  var path = ''
  var reqBody = {}
  var ip = ''
  var method = 'GET'
  const MAX_SIZE = 1000

  if (!options.uri && !options.url) {
    throw new Error('URI | URL is a required argument!')
  }

  headers = options.headers || {}
  method = options.method || 'GET'
  var urlAux = options.url || options.uri

  if (typeof urlAux === 'string' && !options.baseUrl) {
    urlAux = new URL(urlAux)
  } else if (typeof urlAux === 'string' && options.baseUrl) {
    urlAux = new URL(`${urlAux}${options.baseUrl}`)
  }

  host = urlAux.origin
  path = urlAux.pathname

  if (options.qs && typeof options.qs === 'string') {
    query = options.qs
  } else if (options.qs && typeof options.qs === 'object') {
    query = qs.stringify(options.qs)
  } else if (urlAux.search && typeof urlAux.search === 'string') {
    query = urlAux.search
  }

  if (options.body) {
    if (options.json) {
      reqBody = options.body
    } else {
      reqBody = {content: options.body}
    }
  }

  const reqData = {
    headers,
    query,
    host,
    path,
    body: reqBody,
    type: 'outbound',
    status: 200,
    response: undefined,
    ip,
    method
  }

  var reqDataLog = _.cloneDeep(reqData)

  try {
    var response = await req(options)
    response = tvs(response)
    reqData.response = response
    reqDataLog = _.cloneDeep(reqData)

    if (reqDataLog.response && reqDataLog.response._items && reqDataLog.response._items.length > MAX_SIZE) {
      reqDataLog.response._items = _.sampleSize(reqDataLog.response._items, MAX_SIZE)
      reqDataLog.response._items.push('and ' + (reqData.response._items.length - MAX_SIZE) + ' more ')
    }

    if (options.persist) {
      await RequestLog.create(reqDataLog)
    }

    return response
  } catch (e) {
    reqDataLog.status = e.statusCode || 500
    reqDataLog.error = {
      message: e.message,
      stack: e.stack
    }

    if (options.persist) {
      await RequestLog.create(reqDataLog)
    }

    throw e
  }
}

const fn = request

fn.get = async function (url, query, persist = true) {
  return request({url, query, persist, method: 'GET'})
}
fn.post = async function (url, data, persist = true) {
  return request({url, body: data, persist, method: 'POST'})
}
fn.put = async function (url, data, persist = true) {
  return request({url, query: data, persist, method: 'PUT'})
}
fn.update = async function (url, data, persist = true) {
  return request({url, query: data, persist, method: 'UPDATE'})
}
fn.delete = async function (url, persist = true) {
  return request({url, persist, method: 'DELETE'})
}

module.exports = fn
