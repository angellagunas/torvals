import React, { Component } from 'react'
import { loggedIn, verifyRole } from '~base/middlewares/'
import Page from '~base/page'
import Breadcrumb from '~base/components/base-breadcrumb'
import DeleteButton from '~base/components/base-deleteButton'
import Loader from '~base/components/spinner'
import { BaseTable } from '~base/components/base-table'
import api from '~base/api'
import Graph from '~base/components/graph'
import moment from 'moment'
import { graphColors } from '~base/tools'
import tree from '~core/tree'
import Select from '../projects/detail-tabs/select'
import _ from 'lodash'
import { toast } from 'react-toastify'

class ForecastCompare extends Component {
  constructor (props) {
    super(props)
    this.state = {
      loading: true,
      disabled: true,
      prices: false,
      catalogItems: {}
    }
    this.graphColors = graphColors.sort(function (a, b) { return 0.5 - Math.random() })
  }

  componentWillMount () {
    this.getForecasts()
  }

  async getForecasts () {
    let forecasts = tree.get('compareEngines')
    let catalogs = {}

    if (forecasts === undefined) {
      this.props.history.push('/forecast/detail/' + this.props.match.params.uuid)
      return
    }

    forecasts = Object.values(forecasts)
    forecasts.map(item => {
      item.catalogs.map(item => {
        catalogs[item.slug] = {...item, items: []}
      })
    })

    let cat = catalogs

    catalogs = await this.getCatalogs(Object.values(catalogs).map(item => {
      return item.uuid
    }))

    catalogs = _.groupBy(catalogs, 'type')

    for (const key in catalogs) {
      if (catalogs.hasOwnProperty(key)) {
        const element = catalogs[key]
        cat[key].items = element
      }
    }

    this.setState({
      forecasts: forecasts,
      catalogs: Object.values(cat),
      activeForecast: tree.get('activeForecast')
    }, () => {
      this.getTable()
      this.getGraph()
    })
  }

  async getCatalogs (items) {
    let url = '/app/forecastGroups/filters'
    try {
      let res = await api.post(url, {
        catalogs: items
      })

      if (res) {
        return res
      }
    } catch (e) {
      console.log(e)
    }
  }

  loadTable () {
    return (
      <div className='is-fullwidth has-text-centered subtitle has-text-primary'>
        {this.state.noData}
      </div>
    )
  }

  getColumns () {
    const catalogs = this.state.catalogs || []
    const catalogItems = catalogs.map((catalog, i) => {
      if (catalog.slug !== 'producto') {
        return (
        {
          'title': ` ${catalog.name}`,
          'property': catalog.slug,
          'default': 'N/A',
          'sortable': true,
          formatter: (row) => {
            return row.catalogs.map(item => {
              if (catalog.slug === item.type) {
                row[catalog.slug] = item.name
                return item.name
              }
            })
          }
        }
        )
      }
    }
    ).filter(item => item)

    const engines = Object.values(this.state.totals).map(item => {
      return (
      {
        title: item.name,
        property: item.name,
        default: 'N/A',
        sortable: true,
        formatter: (row) => {
          return row.engines.map(obj => {
            if (item.name === obj.name) {
              row[item.name] = obj.prediction
              let val = obj.prediction.toFixed().replace(/./g, (c, i, a) => {
                return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
              })
              return this.state.prices ? '$' + val : val
            }
          })
        }
      }
      )
    })

    let cols = [
      {
        title: 'Id',
        property: 'externalId',
        default: 'N/A',
        sortable: true,
        formatter: (row) => {
          return row.product.externalId
        }
      },
      {
        title: 'Producto',
        property: 'product.name',
        default: 'N/A',
        sortable: true,
        formatter: (row) => {
          return row.product.name
        }
      },
      ...catalogItems,
      ...engines
    ]

    return cols
  }

  handleSort (e) {
    let sorted = this.state.forecastTable
    if (e === 'externalId') {
      if (this.state.sortAscending) {
        sorted.sort((a, b) => {
          return parseInt(a.product[e]) - parseInt(b.product[e])
        })
      } else {
        sorted.sort((a, b) => { return parseInt(b.product[e]) - parseInt(a.product[e]) })
      }
    } else {
      if (this.state.sortAscending) {
        sorted = _.orderBy(sorted, [e], ['asc'])
      } else {
        sorted = _.orderBy(sorted, [e], ['desc'])
      }
    }

    this.setState({
      forecastTable: sorted,
      sortAscending: !this.state.sortAscending,
      sortBy: e
    }, () => {
      this.searchDatarows()
    })
  }

  async getGraph () {
    this.setState({
      loading: true
    })
    let url = '/app/forecastGroups/graph/compare/' + this.props.match.params.uuid
    try {
      let res = await api.post(url, {
        engines: this.state.forecasts.map(item => { return item.engine.uuid }),
        prices: this.state.prices,
        catalogItems: this.state.filters
      })

      if (res.data) {
        this.setState({
          graphData: res.data,
          totals: res.total,
          loading: false
        })
      }
    } catch (e) {
      console.log(e)
      this.notify('Error obteniendo gráfica ' + e.message, 5000, toast.TYPE.ERROR)
    }
  }

  showBy (prices) {
    this.setState({ prices },
      () => {
        this.getGraph()
        this.getTable()
      })
  }

  getCallback () {
    if (this.state.prices) {
      return function (label, index, labels) {
        let val = ''
        if (label <= 999) {
          val = label
        } else if (label >= 1000 && label <= 999999) {
          val = (label / 1000) + 'K'
        } else if (label >= 1000000 && label <= 999999999) {
          val = (label / 1000000) + 'M'
        }
        return '$' + val
      }
    } else {
      return function (label, index, labels) {
        if (label <= 999) {
          return label
        } else if (label >= 1000 && label <= 999999) {
          return (label / 1000) + 'K'
        } else if (label >= 1000000 && label <= 999999999) {
          return (label / 1000000) + 'M'
        }
      }
    }
  }

  getTooltipCallback () {
    if (this.state.prices) {
      return function (tooltipItem, data) {
        let label = ' '
        label += data.datasets[tooltipItem.datasetIndex].label || ''

        if (label) {
          label += ': '
        }
        let yVal = tooltipItem.yLabel.toFixed().replace(/./g, (c, i, a) => {
          return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
        })
        return label + '$' + yVal
      }
    } else {
      return function (tooltipItem, data) {
        let label = ' '
        label += data.datasets[tooltipItem.datasetIndex].label || ''

        if (label) {
          label += ': '
        }
        let yVal = tooltipItem.yLabel.toFixed().replace(/./g, (c, i, a) => {
          return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
        })
        return label + yVal
      }
    }
  }

  async getTable () {
    this.setState({
      loading: true
    })
    let url = '/app/forecastGroups/graph/compare/table/' + this.props.match.params.uuid
    try {
      let res = await api.post(url, {
        engines: this.state.forecasts.map(item => { return item.engine.uuid }),
        prices: this.state.prices,
        catalogItems: this.state.filters
      })

      if (res) {
        this.setState({
          forecastTable: res,
          loading: false
        }, () => {
          this.searchDatarows()
        })
      }
    } catch (e) {
      console.log(e)
      this.notify('Error obteniendo tabla ' + e.message, 5000, toast.TYPE.ERROR)
    }
  }


  async searchDatarows() {
    if (this.state.searchTerm === '') {
      this.setState({
        filteredData: this.state.forecastTable
      })

      return
    }

    const items = this.state.forecastTable.filter((item) => {
      const regEx = new RegExp(this.state.searchTerm, 'gi')
      const searchStr = `${item.product.externalId} ${item.product.name}`

      if (regEx.test(searchStr))
        return true

      return false
    })

    await this.setState({
      filteredData: items
    })
  }

  searchOnChange = (e) => {
    this.setState({
      searchTerm: e.target.value
    }, () => this.searchDatarows())
  }


  async filterChangeHandler(name, value) {
    let aux = this.state.catalogItems
    aux[name] = value
    this.setState({
      catalogItems: aux,
      filters: Object.values(aux)
    }, () => {
      this.getGraph()
      this.getTable()
    })
  }

  notify(message = '', timeout = 5000, type = toast.TYPE.INFO) {
    if (!toast.isActive(this.toastId)) {
      this.toastId = toast(message, {
        autoClose: timeout,
        type: type,
        hideProgressBar: true,
        closeButton: false
      })
    } else {
      toast.update(this.toastId, {
        render: message,
        type: type,
        autoClose: timeout,
        closeButton: false
      })
    }
  }

  render () {
    if (this.state.loading) {
      return <div className='column is-fullwidth has-text-centered subtitle has-text-primary'>
        Cargando, un momento por favor
          <Loader />
      </div>
    }
    const graph = []
    const totals = []
    let callbackLabels = this.getCallback()
    let tooltipCallback = this.getTooltipCallback()

    if (this.state.graphData && this.state.totals) {
      Object.values(this.state.totals).map((item, key) => {
        let color = this.graphColors[key]
        totals.push({
          name: item.name,
          prediction: item.prediction,
          color: color
        })
        graph.push({
          label: item.name,
          color: color,
          data: this.state.graphData ? this.state.graphData.map((item) => { return item.prediction !== 0 ? item.prediction : null }) : []
        })
      })
    }

    return (
      <div className='forecast-detail'>
        <div className='section-header'>
          <h2>Predicción {this.state.activeForecast.alias}</h2>
        </div>
        <div className='level'>
          <div className='level-left'>
            <div className='level-item'>
              <Breadcrumb
                path={[
                  {
                    path: '/',
                    label: 'Inicio',
                    current: false
                  },
                  {
                    path: '/forecast',
                    label: 'Predicciones',
                    current: false
                  },
                  {
                    path: '/forecast/detail/' + this.props.match.params.uuid,
                    label: 'Detalle',
                    current: false
                  },
                  {
                    path: '/forecast/detail',
                    label: this.state.activeForecast.alias,
                    current: true
                  },
                  {
                    path: '/forecast/compare',
                    label: 'Comparar',
                    current: true
                  }
                  
                ]}
                align='left'
              />
            </div>
          </div>
          <div className='level-right'>
            <div className='level-item'>
              <div className='level-item'>
                <button className='button is-primary'
                  onClick={() => {
                    this.props.history.push('/forecast/detail/' + this.props.match.params.uuid)
                  }}>
                  Regresar
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className='section'>

          <div className='columns is-multiline filters'>
            {this.state.catalogs && this.state.catalogs.map((item, key) => {
              return (
                <div key={key} className='column is-narrow'>
                  <Select
                    label={item.name}
                    name={key}
                    placeholder='Todos'
                    value={this.state.catalogItems[key]}
                    optionValue='uuid'
                    optionName='name'
                    options={item.items}
                    onChange={(name, value) => { this.filterChangeHandler(name, value) }}
                  />
                </div>
              )
            })}

          </div>

          <div className='columns box'>
            <div className='column is-3 is-2-widescreen is-paddingless'>
              <div className='indicators'>
                {
                  totals && totals.map(item => {
                    return (
                      <div key={item.name}>
                        <p className='indicators-title is-capitalized'>
                          <strong>{item.name}</strong>
                        </p>
                        <p className='indicators-number' style={{ color: item.color }}>

                          {
                            this.state.prices ? '$' +
                              item.prediction.toFixed().replace(/./g, (c, i, a) => {
                                return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
                              })
                              : item.prediction.toFixed().replace(/./g, (c, i, a) => {
                                return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
                              })
                          }
                        </p>
                      </div>
                    )
                  })
                }

              </div>
            </div>
            <div className='column card'>
              {this.state.graphData
                ? this.state.graphData.length > 0
                  ? <Graph
                    data={graph}
                    maintainAspectRatio={false}
                    responsive
                    reloadGraph={this.state.reloadGraph}
                    legend={{
                      display: true,
                      position: 'right',
                      fontSize: 11,
                      labels: {
                        boxWidth: 10,
                        fontStyle: 'normal',
                        fontFamily: "'Roboto', sans-serif",
                        usePointStyle: false,
                        padding: 12
                      }
                    }}
                    tooltips={{
                      mode: 'index',
                      intersect: true,
                      titleFontFamily: "'Roboto', sans-serif",
                      bodyFontFamily: "'Roboto', sans-serif",
                      bodyFontStyle: 'bold',
                      callbacks: {
                        label: tooltipCallback
                      }
                    }}
                    labels={this.state.graphData.map((item) => { return item.date })}
                    scales={{
                      xAxes: [
                        {
                          ticks: {
                            callback: function (label, index, labels) {
                              return moment.utc(label).format('DD-MM-YYYY')
                            },
                            fontSize: 11
                          },
                          gridLines: {
                            display: false
                          }
                        }
                      ],
                      yAxes: [
                        {
                          ticks: {
                            callback: callbackLabels,
                            fontSize: 11
                          },
                          gridLines: {
                            display: false
                          },
                          display: true
                        }
                      ]
                    }}
                    annotation={this.state.startPeriod &&
                      {
                        annotations: [
                          {
                            drawTime: 'beforeDatasetsDraw',
                            type: 'box',
                            xScaleID: 'x-axis-0',
                            yScaleID: 'y-axis-0',
                            xMin: this.state.startPeriod,
                            xMax: this.state.endPeriod,
                            yMin: 0,
                            yMax: this.state.topValue,
                            backgroundColor: 'rgba(233, 238, 255, 0.5)',
                            borderColor: 'rgba(233, 238, 255, 1)',
                            borderWidth: 1
                          },
                          {
                            drawTime: 'afterDatasetsDraw',
                            id: 'vline',
                            type: 'line',
                            mode: 'vertical',
                            scaleID: 'x-axis-0',
                            value: this.state.startPeriod,
                            borderColor: 'rgba(233, 238, 255, 1)',
                            borderWidth: 1,
                            label: {
                              backgroundColor: 'rgb(233, 238, 255)',
                              content: 'Ciclo actual',
                              enabled: true,
                              fontSize: 10,
                              position: 'top',
                              fontColor: '#424A55'
                            }
                          }
                        ]
                      }
                    }
                  />
                  : <section className='section has-30-margin-top'>
                    <center>
                      <h1 className='has-text-info'>No hay datos que mostrar, intente con otro filtro</h1>
                    </center>
                  </section>
                : <section className='section has-30-margin-top'>
                  {this.loadTable()}
                </section>
              }

            </div>
          </div>

          <div className='level'>
            <div className='level-left'>
              <div className='level-item'>

                <div className='field'>
                  <label className='label'>Búsqueda general</label>
                  <div className='control has-icons-right'>
                    <input
                      className='input'
                      type='text'
                      value={this.state.searchTerm}
                      onChange={this.searchOnChange} placeholder='Buscar' />

                    <span className='icon is-small is-right'>
                      <i className='fa fa-search fa-xs' />
                    </span>
                  </div>
                </div>
              </div>

              <div className='level-item'>
                <div className='field'>
                  <label className='label'>Mostrar por: </label>
                  <div className='control'>

                    <div className='field is-grouped'>
                      <div className='control'>

                        <input
                          className='is-checkradio is-info is-small'
                          id='showByquantity'
                          type='radio'
                          name='showBy'
                          checked={!this.state.prices}
                          disabled={this.state.waitingData}
                          onChange={() => this.showBy(false)} />
                        <label htmlFor='showByquantity'>
                          <span title='Cantidad'>Cantidad</span>
                        </label>
                      </div>

                      <div className='control'>
                        <input
                          className='is-checkradio is-info is-small'
                          id='showByprice'
                          type='radio'
                          name='showBy'
                          checked={this.state.prices}
                          disabled={this.state.waitingData}
                          onChange={() => this.showBy(true)} />
                        <label htmlFor='showByprice'>
                          <span title='Precio'>Precio</span>
                        </label>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        <div className='scroll-table'>
          <div className='scroll-table-container'>

            <BaseTable
              className='dash-table is-fullwidth'
              data={this.state.filteredData}
              columns={this.getColumns()}
              handleSort={(e) => { this.handleSort(e) }}
              sortAscending={this.state.sortAscending}
              sortBy={this.state.sortBy}
            />
          </div>
        </div>

      </div>
    )
  }
}

export default Page({
  path: '/forecast/compare/:uuid',
  title: 'Forecast',
  icon: 'bar-chart',
  exact: true,
  roles: 'consultor-level-3, analyst, orgadmin, admin',
  validate: [loggedIn, verifyRole],
  component: ForecastCompare
})
