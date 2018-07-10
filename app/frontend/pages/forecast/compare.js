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

class ForecastCompare extends Component {
  constructor (props) {
    super(props)
    this.state = {
      loading: true,
      disabled: true
    }
    this.graphColors = graphColors.sort(function (a, b) { return 0.5 - Math.random() })
  }

  componentWillMount () {
    this.getForecasts()
    this.getGraph()
  }

  async getForecasts () {
    let forecasts = Object.values(tree.get('compareEngines'))
    console.log(forecasts)
    let catalogs = {}
    if (forecasts === undefined) {
      this.props.history.push('/forecast/detail/' + this.props.match.params.uuid)
    }
    forecasts.map(item => {
      item.catalogs.map(item => {
        catalogs[item.uuid] = item
      })
    })

    catalogs = Object.values(catalogs).map(async item => {
      return {
        ...item,
        items: this.getCatalogs(item)
      }
    })

    this.setState({
      forecasts: forecasts,
      catalogs: catalogs
    })

    console.log(catalogs)
  }

  async getCatalogs (item) {
    let url = '/app/catalogItems/' + item.slug
    try {
      let res = await api.get(url)

      if (res.data) {
        return res.data
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
    let cols = [
      {
        title: 'Modelo',
        property: 'engine.name',
        default: 'N/A',
        sortable: true,
        formatter: (row) => {
          return row.engine.name
        }
      },
      {
        title: 'Descripción',
        property: 'engine.description',
        default: 'Sin descripción',
        formatter: (row) => {
          return row.engine.description
        }
      },
      {
        title: 'Estado',
        property: 'status',
        default: 'N/A',
        sortable: true,
        formatter: (row) => {
          if (row.status === 'created') {
            return 'Creado'
          } else if (row.status === 'ready') {
            return 'Completado'
          } else {
            return 'En Proceso'
          }
        }
      }
    ]

    return cols
  }

  handleSort (e) {
    let sorted = this.state.engineTable

    if (this.state.sortAscending) {
      sorted = _.orderBy(sorted, [e], ['asc'])
    } else {
      sorted = _.orderBy(sorted, [e], ['desc'])
    }

    this.setState({
      engineTable: sorted,
      sortAscending: !this.state.sortAscending,
      sortBy: e
    })
  }

  async getGraph () {
    let url = '/app/forecastGroups/graph/' + this.props.match.params.uuid
    try {
      let res = await api.post(url, {})

      if (res.data) {
        this.setState({
          graphData: res.data,
          totals: res.total,
          loading: false
        })
      }
    } catch (e) {
      console.log(e)
      // this.notify('Error obteniendo modelos ' + e.message, 5000, toast.TYPE.ERROR)
    }
  }

  showBy (prices) {
    this.setState({ prices },
      () => {
        this.getGraph()
        this.getProductTable()
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
          <h2>Predicción {this.state.alias}</h2>
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
                    path: '/forecast/detail',
                    label: 'Detalle',
                    current: true
                  },
                  {
                    path: '/forecast/detail',
                    label: this.state.alias,
                    current: true
                  }
                ]}
                align='left'
              />
            </div>
          </div>
          <div className='level-right'>
            <div className='level-item'>
              <DeleteButton
                titleButton={'Eliminar'}
                objectName='Predicción'
                objectDelete={this.deleteObject}
                message={`¿Está seguro que desea eliminar el predicción?`}
              />
            </div>
          </div>
        </div>

        <div className='section'>
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
                          {item.prediction}
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

          <div className='columns is-multiline'>
            {this.state.catalogs && this.state.catalogs.map((item, key) => {
              return (
                <div key={key} className='column is-narrow'>
                  <Select
                    label={item.name}
                    name={key}
                    value={item.items[0]}
                    optionValue='uuid'
                    optionName='name'
                    options={item.items}
                    onChange={(name, value) => { this.filterChangeHandler(name, value) }}
                  />
                </div>
              )
            })}

          </div>

        </div>

        <div className='scroll-table'>
          <div className='scroll-table-container'>

            <BaseTable
              className='dash-table is-fullwidth'
              data={this.state.forecast}
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
