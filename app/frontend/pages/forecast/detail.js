import React, { Component } from 'react'
import { loggedIn, verifyRole } from '~base/middlewares/'
import Page from '~base/page'
import Breadcrumb from '~base/components/base-breadcrumb'
import DeleteButton from '~base/components/base-deleteButton'
import Loader from '~base/components/spinner'
import { BaseTable } from '~base/components/base-table'
import Checkbox from '~base/components/base-checkbox'
import api from '~base/api'
import Graph from '~base/components/graph'
import moment from 'moment'
import { graphColors } from '~base/tools'
import tree from '~core/tree'
import { toast } from 'react-toastify'
import BaseModal from '~base/components/base-modal'
import Select from 'react-select'
import 'react-select/dist/react-select.css'

class ForecastDetail extends Component {
  constructor (props) {
    super(props)
    this.state = {
      loading: true,
      disabled: true
    }
    this.engineSelected = {}
    this.graphColors = graphColors.sort(function (a, b) { return 0.5 - Math.random() })
  }

  componentWillMount () {
    this.getForecasts()
    this.getGraph()
  }

  async getForecasts () {
    let url = '/app/forecastGroups/' + this.props.match.params.uuid
    try {
      let res = await api.get(url)

      if (res.forecasts) {
        this.setState({
          alias: res.alias,
          forecast: res.forecasts,
          type: res.type
        })

        tree.set('activeForecast', {
          alias: res.alias,
          type: res.type
        })

        tree.commit()
      }
    } catch (e) {
      console.log(e)
      this.notify('Error obteniendo predicción ' + e.message, 5000, toast.TYPE.ERROR)
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
    let colorClass = 'status-info'
    let cols = [
      {
        title: '',
        abbreviate: true,
        abbr: '',
        property: 'checkbox',
        default: '',
        formatter: (row, state) => {
          if (row.status === 'created') {
            if (!row.selected) {
              row.selected = false
            }
            if (row.status === 'created') {
              colorClass = 'status-info'
            } else if (row.status === 'ready') {
              colorClass = 'status-ready'
            } else {
              colorClass = 'status-process'
            }
            return (
              <Checkbox
                label={row}
                handleCheckboxChange={(e, value) => this.selectEngine(value, row)}
                key={row}
                checked={row.selected}
                hideLabel
                // disabled={row.status !== 'ready'}
                 />
            )
          }
        }
      },
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
        className: colorClass,
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

  selectEngine (value, item) {
    if (value) {
      this.engineSelected[item.uuid] = item
    } else {
      delete this.engineSelected[item.uuid]
    }

    if (Object.values(this.engineSelected).length === 1) {
      this.setState({
        engineConciliate: Object.values(this.engineSelected)[0]
      })
    } else {
      this.setState({
        engineConciliate: undefined
      })
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
      this.notify('Error obteniendo gráfica ' + e.message, 5000, toast.TYPE.ERROR)
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

  compare () {
    tree.set('compareEngines', this.engineSelected)
    tree.commit()
    this.props.history.push('/forecast/compare/' + this.props.match.params.uuid)
  }

  notify (message = '', timeout = 5000, type = toast.TYPE.INFO) {
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

  showConciliate () {
    this.setState({
      conciliateModal: ' is-active'
    })
  }

  hideConciliate () {
    this.setState({
      conciliateModal: ''
    })
  }

  async finishUpConciliate () {
    let url = '/app/forecasts/conciliate/' + this.state.engineConciliate.uuid
    try {
      let res = await api.get(url)

      if (res) {
        await this.hideConciliate()
        this.props.history.push('/forecast')
      }
    } catch (e) {
      console.log(e)
      this.notify('Error conciliando ' + e.message, 5000, toast.TYPE.ERROR)
    }
  }

  conciliateMsg () {
    return (
      <BaseModal
        title={'Conciliar predicción'}
        className={this.state.conciliateModal}
        hideModal={() => this.hideConciliate()}>
        <p>¿Estás seguro de utilizar la predicción del modelo
          <strong> {this.state.engineConciliate && this.state.engineConciliate.engine.name} </strong> en tu proyecto?<br />
          No podrás crear otra predicción conciliable hasta el siguiente ciclo de predicciones.
        </p>
        <br />
        <div className='buttons org-rules__modal'>
          <button
            className='button generate-btn is-primary is-pulled-right'
            onClick={() => this.finishUpConciliate()}>
          Conciliar
        </button>
          <button
            className='button generate-btn is-danger is-pulled-right'
            onClick={() => this.hideConciliate()}>
          Cancelar
        </button>
        </div>
      </BaseModal>
    )
  }

  async getUsers () {
    let url = '/app/users'
    try {
      let res = await api.get(url)

      if (res.data) {
        this.setState({
          users: res.data.map(item => {
            return {label: item.name, value: item.email}
          })
        }, () => {
          this.showShareModal()
        })
      }
    } catch (e) {
      console.log(e)
      this.notify('Error obteniendo usuarios ' + e.message, 5000, toast.TYPE.ERROR)
    }
  }

  handleSelectChange (usersEmails) {
    this.setState({ usersEmails })
  }

  shareModal () {
    return (
      <BaseModal
        title={'Compartir predicción'}
        className={'shareModal ' + this.state.shareModal}
        hideModal={() => this.hideShareModal()}>
        <p>Selecciona los usuarios con quienes quieres compartir la predicción.</p>
        <br />
        <br />

        <Select
          closeOnSelect={false}
          multi
          onChange={(value) => this.handleSelectChange(value)}
          placeholder='Seleccionar usuario(s)'
          removeSelected
          simpleValue
          value={this.state.usersEmails}
          options={this.state.users}
        />
        <br />
        <br />

        <div className='buttons org-rules__modal'>
          <button
            className='button generate-btn is-primary is-pulled-right'
            onClick={() => this.finishUpShare()}
            disabled={!this.state.usersEmails || this.state.usersEmails === ''}>
            Compartir
        </button>
          <button
            className='button generate-btn is-danger is-pulled-right'
            onClick={() => this.hideShareModal()}>
            Cancelar
        </button>
        </div>
      </BaseModal>
    )
  }

  showShareModal () {
    this.setState({
      shareModal: ' is-active'
    })
  }

  hideShareModal () {
    this.setState({
      shareModal: ''
    })
  }

  async finishUpShare () {
    let url = '/app/forecasts/share'
    try {
      let res = await api.post(url, {
        users: this.state.usersEmails,
        forecasts: Object.keys(this.engineSelected)
      })

      if (res) {
        await this.hideShareModal()
      }
    } catch (e) {
      console.log(e)
      this.notify('Error compartiendo ' + e.message, 5000, toast.TYPE.ERROR)
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
          <h2>Predicción {this.state.alias}
            <span className='is-pulled-right forecast-detail-type-dates'>
              <span className='is-pulled-right'>{this.state.forecast &&
                moment.utc(this.state.forecast[0].dateStart).format('MMMM YYYY')
                }</span>
              <span className='is-pulled-right'>-</span>
              <span className='is-pulled-right'>{this.state.forecast &&
                moment.utc(this.state.forecast[0].dateEnd).format('MMMM YYYY')
              }</span>
              <span className='is-pulled-right'>{this.state.type === 'compatible' ? 'Conciliable'
                : this.state.type === 'informative' ? 'Informativo' : 'Creado'}</span>
            </span>
          </h2>
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
              <button className='button is-primary'
                onClick={() => {
                  this.props.history.push('/forecast')
                }}>
                Regresar
                </button>
            </div>
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

        {
            this.state.forecast && this.state.forecast.length === 0
            ? <div className='section'>
              <article className='message is-info'>
                <div className='message-header has-text-weight-bold'>
                  <p>Información de predicciones</p>
                </div>
                <div className='message-body is-size-6 has-text-centered'>
                  <span className='icon is-large has-text-info'>
                    <i className='fa fa-magic fa-2x' />
                  </span>
                  <span className='is-size-5'>
                  Aún no hay datos disponibles para esta predicción.
                  <br />
                  Este proceso puede tomar tiempo.
                  Te avisaremos por correo cuando el proceso termine.
                </span>
                  <br />
                  <br />
                </div>
              </article>
            </div>
          : <div>
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
                      <p className='indicators-number' style={{color: item.color}}>
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
                    <h1 className='has-text-info'>No hay datos que mostrar, intente más tarde</h1>
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
                  {this.state.type !== 'informative' &&
                  <div className='level-item'>
                    <button
                      className='button is-primary'
                      disabled={
                        this.state.disabled ||
                        Object.values(this.engineSelected).length > 1}
                      onClick={() => { this.showConciliate() }} >
                      Conciliar
                  </button>
                  </div>
              }

                  <div className='level-item'>
                    <button
                      className='button is-primary'
                      disabled={this.state.disabled}
                      onClick={() => this.compare()} >
                      <span className='icon'>
                        <i className='fa fa-eye' />
                      </span>
                    </button>
                  </div>

                  <div className='level-item'>
                    <button
                      className='button is-primary'
                      disabled={this.state.disabled}
                      onClick={() => this.getUsers()} >
                      <span className='icon'>
                        <i className='fa fa-share-alt' />
                      </span>
                    </button>
                  </div>

                  <div className='level-item'>
                    <DeleteButton
                      iconOnly
                      objectName='Predicción'
                      disabled={this.state.disabled}
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
                  data={this.state.forecast}
                  columns={this.getColumns()}
                  handleSort={(e) => { this.handleSort(e) }}
                  sortAscending={this.state.sortAscending}
                  sortBy={this.state.sortBy}
            />
              </div>
            </div>
          </div>
          }
        {this.conciliateMsg()}
        {this.shareModal()}
      </div>
    )
  }
}

export default Page({
  path: '/forecast/detail/:uuid',
  title: 'Predicciones',
  icon: 'bar-chart',
  exact: true,
  roles: 'consultor-level-3, analyst, orgadmin, admin',
  validate: [loggedIn, verifyRole],
  component: ForecastDetail
})
