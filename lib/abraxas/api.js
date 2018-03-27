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

const processDataset = async function (externalId, requestBody) {
  const api = await apiData()
  console.log('url', `${api.hostname}${api.baseUrl}/process/datasets/${externalId}`)
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
const uploadDataset = async function (dataset) {
  const api = await apiData()
  console.log(`Sending ${dataset.name} dataset for preprocessing ...`)
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
const rowsDataset = async function (externalId) {
  const api = await apiData()
  var options = {
    url: `${api.hostname}${api.baseUrl}/rows/datasets/${externalId}`,
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
module.exports = {
  get: function () {
    return data
  },
  fetch: async function () {
    await fetchToken()
  },
  updatePrices: async function (etag, externalId, price) {
    const res = await updatePrices(etag, externalId, price)
    return res
  },
  getProject: async function (externalId) {
    const res = await getProject(externalId)
    return res
  },
  restoreAnomalies: async function (externalId, etag, requestBody) {
    const res = await restoreAnomalies(externalId, etag, requestBody)
    return res
  },
  processDataset: async function (dataset, requestBody) {
    const res = await processDataset(dataset, requestBody)
    return res
  },
  getDataset: async function (uuid) {
    const res = await getDataset(uuid)
    return res
  },
  revenueDataset: async function (externalId, whereQuery) {
    const res = await revenueDataset(externalId, whereQuery)
    return res
  },
  conciliateProject: async function (externalId, datasetExternalId) {
    const res = await conciliateProject(externalId, datasetExternalId)
    return res
  },
  downloadProject: async function (externalId, requestBody) {
    const res = await downloadProject(externalId, requestBody)
    return res
  },
  configForecast: async function (bodyRequest) {
    const res = await configForecast(bodyRequest)
    return res
  },
  postProject: async function (uuid) {
    const res = await postProject(uuid)
    return res
  },
  graphicProject: async function (externalId, bodyRequest) {
    const res = await graphicProject(externalId, bodyRequest)
    return res
  },
  /* Tasks */
  getDates: async function () {
    const res = await getDates()
    return res
  },
  getAnomalies: async function () {
    const res = await getAnomalies()
    return res
  },
  uploadDataset: async function (dataset) {
    const res = await uploadDataset(dataset)
    return res
  },
  rowsDataset: async function (externalId) {
    const res = await rowsDataset(externalId)
    return res
  },
  patchDataset: async function (datasetRow) {
    const res = await patchDataset(datasetRow)
    return res
  },
  runForecast: async function (configPrId) {
    const res = await runForecast(configPrId)
    return res
  },
  getForecast: async function (forecastId) {
    const res = await getForecast(forecastId)
    return res
  },
  conciliateForecast: async function (forecastId) {
    const res = await conciliateForecast(forecastId)
    return res
  },
  getPrices: async function () {
    const res = await getPrices()
    return res
  },
  filterProject: async function (externalId, dateMax) {
    const res = await filterProject(externalId, dateMax)
    return res
  }
}
