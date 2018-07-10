import React, { Component } from 'react'
import { loggedIn, verifyRole } from '~base/middlewares/'
import Page from '~base/page'
import Breadcrumb from '~base/components/base-breadcrumb'
import DeleteButton from '~base/components/base-deleteButton'
import Loader from '~base/components/spinner'
import { BaseTable } from '~base/components/base-table'
import Checkbox from '~base/components/base-checkbox'
import api from '~base/api'

class ForecastDetail extends Component {
  constructor (props) {
    super(props)
    this.state = {
      loading: true,
      disabled: true
    }
    this.engineSelected = {}
  }

  componentWillMount () {
    this.load()
  }
  async load () {
    let url = '/app/forecastGroups/' + this.props.match.params.uuid
    try {
      let res = await api.get(url)

      if (res) {
        this.setState({
          forecast: res,
          loading: false
        })
      }
    } catch (e) {
      console.log(e)
      // this.notify('Error obteniendo modelos ' + e.message, 5000, toast.TYPE.ERROR)
    }
  }

  loadTable () {
    return (
      <div className='is-fullwidth has-text-centered subtitle has-text-primary'>
        {this.state.noData}
      </div>
    )
  }
  deleteForecast (item) {
    console.log('Deleted', item)
  }

  getColumns () {
    let cols = [
      {
        'title': '',
        'abbreviate': true,
        'abbr': '',
        'property': 'checkbox',
        'default': '',
        formatter: (row, state) => {
          if (row.status === 'created') {
            if (!row.selected) {
              row.selected = false
            }
            return (
              <Checkbox
                label={row}
                handleCheckboxChange={(e, value) => this.selectEngine(value, row)}
                key={row}
                checked={row.selected}
                hideLabel />
            )
          }
        }
      },
      {
        'title': 'Modelo',
        'property': 'engine',
        'default': 'N/A',
        'sortable': true
      },
      {
        'title': 'Descripción',
        'property': 'description',
        'default': 'Sin descripción'
      },
      {
        'title': 'Estado',
        'property': 'status',
        'default': 'N/A',
        'sortable': true
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
    }, () => {
      this.searchDatarows()
    })
  }

  selectEngine (value, item) {
    if (value) {
      this.engineSelected[item.uuid] = item
    } else {
      delete this.engineSelected[item.uuid]
    }

    this.disableBtns()
  }

  disableBtns () {
    if (Object.keys(this.engineSelected).length === 0) {
      this.setState({
        disabled: true
      })
    } else {
      this.setState({
        disabled: false
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
    return (
      <div className='forecast-detail'>
        <div className='section-header'>
          <h2>Predicción {this.state.forecast.alias}</h2>
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
                    label: this.state.forecast.alias,
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
                <p className='indicators-title'>
                  <strong>Modelo</strong>
                </p>
                <p className='indicators-number has-text-success'>
                  0
                </p>
              </div>
            </div>
            <div className='column card'>
              {this.state.graphData && this.state.filteredData
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
                        },
                        ...vLines
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
                <p>Selecciona un modelo para conciliar.</p>
              </div>
            </div>
            <div className='level-right'>
              {this.state.forecast.type !== 'informative' &&
              <div className='level-item'>
                <button
                  className='button is-primary'
                  disabled={this.state.disabled}>
                 Consolidar
                </button>
              </div>
              }

              <div className='level-item'>
                <button
                  className='button is-primary'
                  disabled={this.state.disabled}>
                  <span className='icon'>
                    <i className='fa fa-eye' />
                  </span>
                </button>
              </div>

              <div className='level-item'>
                <button
                  className='button is-primary'
                  disabled={this.state.disabled}>
                  <span className='icon'>
                    <i className='fa fa-share-alt' />
                  </span>
                </button>
              </div>

              <div className='level-item'>
                <DeleteButton
                  iconOnly
                  objectName='Predicción'
                  objectDelete={() => this.deleteForecast(item)}
                  message={<span>¿Estas seguro de querer eliminar esta predicción?</span>}
                />
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
  path: '/forecast/detail/:uuid',
  title: 'Forecast',
  icon: 'bar-chart',
  exact: true,
  roles: 'consultor-level-3, analyst, orgadmin, admin',
  validate: [loggedIn, verifyRole],
  component: ForecastDetail
})
