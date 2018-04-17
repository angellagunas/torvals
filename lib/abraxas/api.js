const config = require('config')
const request = require('lib/request')
const abraxas = config.abraxas
const { Token } = require('models')
const moment = require('moment')

var data = {
  hostname: abraxas.abraxasHostname,
  baseUrl: abraxas.abraxasBaseUrl
}

const fetchToken = async function () {
  var options = {
    url: abraxas.abraxasHostname + '' + abraxas.abraxasBaseUrl + '/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: {
      email: abraxas.abraxasUser,
      password: abraxas.abraxasSecret
    },
    json: true,
    persist: true
  }

  try {
    const token = await Token.findOne({expires: {$gte: moment.utc()}})

    if (token) {
      data.token = token.token
    } else {
      var res = await request(options)
      data.token = res.token
      await Token.create({
        'token': res.token
      })
    }
  } catch (e) {
    console.log('No se pudo iniciar sesión en Abraxas!')
  }
}

const apiData = async function () {
  try {
    var apiData = data

    if (!apiData.token) {
      await fetchToken()
      apiData = data
    }

    return apiData
  } catch (e) {
    throw new Error('Error en el servidor de abraxas')
  }
}

const sendRequest = async function (options) {
  try {
    var res = await request(options)

    return res
  } catch (e) {
    let errorString = /<title>(.*?)<\/title>/g.exec(e.message)

    if (!errorString) {
      errorString = []
      errorString[1] = e.message
    }

    if (e.statusCode === 401) {
      await Token.findOneAndRemove({'token': data.token})
    }

    throw new Error('Abraxas API: ' + errorString[1])
  }
}

const getProject = async function (externalId) {
  const api = await apiData()

  var options = {
    url: `${api.hostname}${api.baseUrl}/projects/${externalId}`,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${api.token}`
    },
    json: true,
    persist: true
  }

  const response = await sendRequest(options)
  return response
}

const conciliateProject = async function (externalId, datasetExternalId) {
  const api = await apiData()

  var options = {
    url: `${api.hostname}${api.baseUrl}/conciliation/projects/${externalId}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${api.token}`
    },
    body: {
      dataset_id: datasetExternalId
    },
    json: true,
    persist: true
  }

  const response = await sendRequest(options)
  return response
}

const downloadProject = async function (externalId, requestBody) {
  const api = await apiData()

  var options = {
    url: `${api.hostname}${api.baseUrl}/download/projects/${externalId}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${api.token}`
    },
    body: requestBody,
    json: true,
    persist: true
  }

  const response = await sendRequest(options)
  return response
}

const postProject = async function (uuid) {
  const api = await apiData()

  var options = {
    url: `${api.hostname}${api.baseUrl}/projects`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${api.token}`
    },
    body: {
      uuid: uuid
    },
    json: true,
    persist: true
  }

  const response = await sendRequest(options)
  return response
}

const graphicProject = async function (externalId, bodyRequest) {
  const api = await apiData()

  var options = {
    url: `${api.hostname}${api.baseUrl}/graphic/projects/${externalId}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${api.token}`
    },
    body: bodyRequest,
    json: true,
    persist: true
  }

  const response = await sendRequest(options)
  return response
}

const filterProject = async function (externalId, dateMax) {
  const api = await apiData()

  var options = {
    url: `${api.hostname}${api.baseUrl}/filter/projects/${externalId}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${api.token}`
    },
    body: {
      filter_date_end: dateMax
    },
    json: true,
    persist: true
  }

  const response = await sendRequest(options)
  return response
}

const processDataset = async function (externalId, requestBody) {
  const api = await apiData()

  var options = {
    url: `${api.hostname}${api.baseUrl}/process/datasets/${externalId}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${api.token}`
    },
    body: requestBody,
    json: true,
    persist: true
  }

  const response = await sendRequest(options)
  return response
}

const getDataset = async function (uuid) {
  const api = await apiData()

  var options = {
    url: `${api.hostname}${api.baseUrl}/datasets/${uuid}`,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${api.token}`
    },
    json: true,
    persist: true
  }

  const response = await sendRequest(options)
  return response
}

const revenueDataset = async function (externalId, whereQuery) {
  const api = await apiData()

  var options = {
    url: `${api.hostname}${api.baseUrl}/revenue/datasets/${externalId}${whereQuery}`,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${api.token}`
    },
    json: true,
    persist: true
  }

  const response = await sendRequest(options)
  return response
}

const uploadDataset = async function (dataset) {
  const api = await apiData()

  var options = {
    url: `${api.hostname}${api.baseUrl}/upload/file/datasets`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${api.token}`
    },
    body: {
      project_id: dataset.project.externalId,
      path: dataset.url
    },
    json: true,
    persist: true
  }

  const response = await sendRequest(options)
  return response
}

const rowsDataset = async function (externalId, page = 1) {
  const api = await apiData()

  var options = {
    url: `${api.hostname}${api.baseUrl}/rows/datasets/${externalId}`,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${api.token}`
    },
    qs: {
      page: page
    },
    json: true,
    persist: true
  }

  const response = await sendRequest(options)
  return response
}

const patchDataset = async function (datasetRow) {
  const api = await apiData()

  var options = {
    url: `${api.hostname}${api.baseUrl}/datasets/${datasetRow.dataset.externalId}`,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${api.token}`,
      'If-Match': `${datasetRow.dataset.etag}`
    },
    body: {
      data_rows_id: datasetRow.externalId,
      adjustment: datasetRow.data.localAdjustment
    },
    json: true,
    persist: true
  }

  const response = await sendRequest(options)
  return response
}

const configForecast = async function (bodyRequest) {
  const api = await apiData()

  var options = {
    url: `${api.hostname}${api.baseUrl}/configs_pr/`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${api.token}`
    },
    body: bodyRequest,
    json: true,
    persist: true
  }

  const response = await sendRequest(options)
  return response
}

const runForecast = async function (configPrId) {
  const api = await apiData()

  var options = {
    url: `${api.hostname}${api.baseUrl}/run/forecasts/${configPrId}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${api.token}`
    },
    json: true,
    persist: true
  }

  const response = await sendRequest(options)
  return response
}

const getForecast = async function (forecastId) {
  const api = await apiData()

  var options = {
    url: `${api.hostname}${api.baseUrl}/forecasts/${forecastId}`,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${api.token}`
    },
    json: true,
    persist: true
  }

  const response = await sendRequest(options)
  return response
}

const conciliateForecast = async function (forecastId) {
  const api = await apiData()

  var options = {
    url: `${api.hostname}${api.baseUrl}/conciliation/forecasts/${forecastId}`,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${api.token}`
    },
    json: true,
    persist: true
  }

  const response = await sendRequest(options)
  return response
}

const updatePrices = async function (etag, externalId, price) {
  const api = await apiData()

  var options = {
    url: `${api.hostname}${api.baseUrl}/prices/organizations/all`,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${api.token}`,
      'If-Match': `${etag}`
    },
    body: {
      _id: externalId,
      price: price
    },
    json: true,
    persist: true
  }

  const response = await sendRequest(options)
  return response
}

const getPrices = async function () {
  const api = await apiData()

  var options = {
    url: `${api.hostname}${api.baseUrl}/prices/organizations/all`,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${api.token}`
    },
    body: {},
    json: true,
    persist: true
  }

  const response = await sendRequest(options)
  return response
}

const restoreAnomalies = async function (externalId, etag, requestBody) {
  const api = await apiData()

  var options = {
    url: `${api.hostname}${api.baseUrl}/restore_anomalies/projects/${externalId}`,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${api.token}`,
      'If-Match': etag
    },
    body: requestBody,
    json: true,
    persist: true
  }

  const response = await sendRequest(options)
  return response
}

const getAnomalies = async function (externalId) {
  const api = await apiData()

  var options = {
    url: `${api.hostname}${api.baseUrl}/anomalies/projects/${externalId}`,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${api.token}`
    },
    body: {},
    json: true,
    persist: true
  }

  const response = await sendRequest(options)
  return response
}

const getDates = async function () {
  const api = await apiData()

  var options = {
    url: `${api.hostname}${api.baseUrl}/dates`,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${api.token}`
    },
    body: {},
    json: true,
    persist: true
  }

  const response = await sendRequest(options)
  return response
}

module.exports = {
  get: function () {
    return data
  },
  fetch: async function () {
    await fetchToken()
  },
  getProject,
  conciliateProject,
  downloadProject,
  postProject,
  graphicProject,
  filterProject,
  processDataset,
  getDataset,
  revenueDataset,
  uploadDataset,
  rowsDataset,
  patchDataset,
  configForecast,
  runForecast,
  getForecast,
  conciliateForecast,
  updatePrices,
  getPrices,
  restoreAnomalies,
  getAnomalies,
  getDates
}
