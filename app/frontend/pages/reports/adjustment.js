import React, { Component } from 'react'
import { FormattedMessage, injectIntl } from 'react-intl'
import moment from 'moment'
import _ from 'lodash'
import { toast } from 'react-toastify'
import Select from '../projects/detail-tabs/select'
import Multiselect from '~base/components/base-multiselect'
import api from '~base/api'
import Page from '~base/page'
import { loggedIn } from '~base/middlewares/'
import DatePicker from '~base/components/date-picker'
import BaseModal from '~base/components/base-modal'
import Spinner from '~base/components/spinner'
import tree from '~core/tree'

class AdjustmentReport extends Component {
  constructor(props) {
    super(props)
    this.state = {
      projects: [],
      projectSelected: {},
      filtersLoading: true,
      isDownloading: false,
      downloadInfo: '',
      ceves: [],
      channels: [],
      filters: {
        canal: [],
        cycles: [],
        'centro-de-venta': []
      },
      formData: {
        cycle: 1
      },
      minDate: null,
      startDate: null,
      maxDate: null,
      endDate: null,
      error: false,
      errorMessage: ''
    }
    this.rules = tree.get('rule')
  }

  componentDidMount() {
    this.getProjects()
  }

  onDatesChange({ startDate, endDate }) {
    this.setState({
      startDate,
      endDate
    })
  }

  async getProjects() {
    const res = await api.get('/app/projects', {
      showOnDashboard: true
    })

    const activeProjects = res.data.filter(item => item.mainDataset)
    activeProjects[0].selected = true

    this.setState({
      projects: activeProjects,
      projectSelected: activeProjects[0]
    }, () => {
      this.getCatalogFilters()
    })
  }

  async getCatalogFilters() {
    const { filters } = this.state
    const res = await api.get('/app/catalogItems/canal')

    if (res) {
      this.setState({
        filters: {
          ...filters,
          canal: res.data
        },
        channels: [...res.data]
      }, async () => {
        await this.getCeves()
      })
    }
  }

  async getCeves() {
    const { filters } = this.state

    try {
      const res = await api.get(`/app/rows/filters/organization/${tree.get('organization').uuid}`)
      this.setState({
        filters: {
          ...filters,
          'centro-de-venta': res['centro-de-venta']
        },
        ceves: [...res['centro-de-venta']]
      }, async () => {
        await this.getFilters()
      })
    } catch (error) {
      console.error('CEVES ERROR', error)
    }
  }

  async getFilters() {
    const { projectSelected, filters } = this.state

    try {
      const res = await api.get(`/app/reports/filters/${projectSelected.activeDataset.uuid}`)

      let cycles = _.orderBy(res.cycles, 'dateStart', 'asc').slice(2, 6)
      cycles = cycles.map(item => ({
        ...item,
        name: `${moment.utc(item.dateStart).format('MMMM D')} - ${moment.utc(item.dateEnd).format('MMMM D')}`,
        viewName: `Ciclo ${item.cycle} (Periodo ${item.periodStart} - ${item.periodEnd})`
      }))

      const minDate = moment.utc(cycles[0].dateStart)
      const maxDate = moment.utc(cycles[cycles.length - 1].dateEnd)

      this.setState({
        minDate,
        startDate: minDate,
        maxDate,
        endDate: maxDate,
        filters: {
          ...filters,
          cycles
        },
        filtersLoading: false
      })
    } catch (e) {
      console.error(e)
      this.setState({
        filters: {
          ...filters,
          cycles: []
        },
        error: true,
        filtersLoading: false,
        errorMessage: this.formatTitle('adjustments.noFilters')
      })

      this.notify(
        `${this.formatTitle('adjustments.noFilters')} ${e.message}`,
        5000,
        toast.TYPE.ERROR
      )
    }
  }

  async getDataRows(channelId, ceveId) {
    const {
      startDate,
      endDate,
      projectSelected
    } = this.state

    try {
      const res = await api.post(`/app/rows/download/${projectSelected.uuid}`, {
        start_date: moment.utc(startDate).format('YYYY-MM-DD'),
        end_date: moment.utc(endDate).format('YYYY-MM-DD'),
        canal: channelId,
        'centro-de-venta': ceveId,
        searchTerm: '',
        showAdjusted: true,
        showNotAdjusted: true,
        noHeaders: true
      })

      return res
    } catch (error) {
      console.error(error)
      return ''
    }
  }

  getHeader() {
    return (
      <div className="section-header">
        <h2>
          <FormattedMessage
            id="report.adjustmentTitle"
            defaultMessage={`Reporte de Ajustes`}
          />
        </h2>
      </div>
    )
  }

  async filterChangeHandler(name, value) {
    const { projects, formData } = this.state
    if (name === 'project') {
      const project = projects.find(item => item.uuid === value)

      this.setState({
        projectSelected: project
      }, () => {
        this.getCatalogFilters()
      })
    } else {
      formData[name] = value
      this.setState({
        formData
      })
    }
  }

  notify(message = '', timeout = 5000, type = toast.TYPE.INFO) {
    let className = ''
    if (type === toast.TYPE.WARNING) {
      className = 'has-bg-warning'
    }
    if (!toast.isActive(this.toastId)) {
      this.toastId = toast(message, {
        autoClose: timeout,
        type,
        hideProgressBar: true,
        closeButton: false,
        className
      })
    } else {
      toast.update(this.toastId, {
        render: message,
        type,
        autoClose: timeout,
        closeButton: false,
        className
      })
    }
  }

  formatTitle(id) {
    const { intl } = this.props
    return intl.formatMessage({ id })
  }

  async download() {
    try {
      const {
        projectSelected,
        ceves,
        channels
      } = this.state
      let csv = ['centro-de-venta_id,centro-de-venta_name,canal_id,canal_name,producto_id,producto_name,fecha,periodo,prediccion,ajuste']

      for (let ceve of ceves) {
        for (let channel of channels) {
          this.setState({
            isDownloading: true,
            downloadInfo: `Obteniendo informacion para ${ceve.name} ${channel.name}`
          })

          try {
            const data = await this.getDataRows(ceve.uuid, channel.uuid)
            if (data) {
              csv = [...csv, data]
            }
          } catch (error) {
            this.notify(`¡Algo salio mal al cargar los datos para ${ceve.name} ${channel.name}!`, 10000, toast.TYPE.ERROR)
          }
        }
      }

      // Download CSV file
      const project = projectSelected.name || ''
      this.downloadCSV(csv.join('\n'), `Reporte-ajuste-Proyecto (${project}).csv`)
    } catch (error) {
      console.error(error)
      this.setState({
        isDownloading: false
      })
      this.notify('¡No se pudo completar la descarga!', 5000, toast.TYPE.ERROR)
    }
  }

  downloadCSV(csv, filename) {
    this.setState({
      downloadInfo: 'Generando reporte...'
    })

    // CSV file
    const csvFile = new Blob(['\ufeff', csv], { type: 'text/csv' })

    // Download link
    const downloadLink = document.createElement('a')

    // File name
    downloadLink.download = filename

    // Create a link to the file
    downloadLink.href = window.URL.createObjectURL(csvFile)

    // Hide download link
    downloadLink.style.display = 'none'

    // Add the link to DOM
    document.body.appendChild(downloadLink)

    // Click download link
    downloadLink.click()

    this.setState({
      downloadInfo: '',
      isDownloading: false
    })
  }

  moveItems(type, assigned, itemId) {
    const { filters, ceves, channels } = this.state
    const isCeve = type === 'ceves'
    const prop = isCeve ? 'ceves' : 'channels'
    const selected = isCeve ? ceves : channels

    if (!assigned) {
      const group = filters[isCeve ? 'centro-de-venta' : 'canal'].find(item => item.uuid === itemId)

      if (selected.findIndex(item => item.uuid === itemId) !== -1) {
        return
      }

      this.setState({
        [prop]: [...selected, group]
      })
    } else {
      const index = (isCeve ? ceves : channels).findIndex(item => item.uuid === itemId)

      if (index === -1) {
        return
      }

      selected.splice(index, 1)

      this.setState({
        [prop]: selected
      })
    }
  }

  render() {
    const {
      filters,
      ceves,
      channels,
      projects,
      projectSelected,
      minDate,
      maxDate,
      startDate,
      endDate,
      isDownloading,
      downloadInfo,
      filtersLoading,
      error,
      errorMessage
    } = this.state

    if (error) {
      return (
        <div className="detail-page">
          {this.getHeader()}
          <div className="section columns">
            <div className="column">
              <article className="message is-danger">
                <div className="message-header">
                  <p>Error</p>
                </div>
                <div className="message-body">
                  {errorMessage}
                </div>
              </article>
            </div>
          </div>
        </div>
      )
    }

    if (filtersLoading) {
      return (
        <div className="detail-page">
          {this.getHeader()}
          <div className="section columns">
            <div className="column is-centered">
              <Spinner />
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="detail-page">
        {this.getHeader()}
        <div className="section columns is-multiline is-padingless-top">
          <div className="column">
            <div className="section level selects is-clearfix">
              <div className="level-left">
                {projectSelected && (
                  <div className="level-item">
                    <Select
                      label={this.formatTitle('adjustments.project')}
                      name="project"
                      value={projectSelected.uuid}
                      optionValue="uuid"
                      optionName="name"
                      type="text"
                      options={projects}
                      onChange={(name, value) => this.filterChangeHandler(name, value)}
                    />
                  </div>)
                }

                <div className="level-item">
                  <DatePicker
                    label={this.formatTitle('adjustments.dateRange')}
                    minDate={minDate}
                    maxDate={maxDate}
                    initialStartDate={startDate}
                    initialEndDate={endDate}
                    onChange={dates => this.onDatesChange(dates)}
                  />
                </div>

                <div className="level-right">
                  <div className="level-item">

                    <div className="field">
                      <label className="label">
                        <br />
                      </label>
                      <div className="control">
                        <button
                          type="button"
                          className="button is-primary"
                          disabled={!!isDownloading}
                          onClick={() => this.download()}
                        >
                          <span className="icon" title="Descargar">
                            <i className="fa fa-download" />
                          </span>
                          <p>{this.formatTitle('report.adjustmentDownload')}</p>
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card-content">
          <Multiselect
            availableTitle="Centros de ventas disponibles"
            assignedTitle="Asignados"
            availableList={filters['centro-de-venta']}
            assignedList={ceves}
            dataFormatter={item => item.name || 'N/A'}
            availableClickHandler={itemId => this.moveItems('ceves', false, itemId)}
            assignedClickHandler={itemId => this.moveItems('ceves', true, itemId)}
          />
        </div>

        <div className="card-content">
          <Multiselect
            availableTitle="Canales disponibles"
            assignedTitle="Asignados"
            availableList={filters.canal}
            assignedList={channels}
            dataFormatter={item => item.name || 'N/A'}
            availableClickHandler={itemId => this.moveItems('channels', false, itemId)}
            assignedClickHandler={itemId => this.moveItems('channels', true, itemId)}
          />
        </div>

        {isDownloading && (
          <BaseModal
            title="Descargando"
            className="is-active"
            hideModal={() => {}}
          >
            <div>
              <h4>
                {downloadInfo}
              </h4>
              <br />
              <Spinner />
            </div>
          </BaseModal>
        )
        }
      </div>
    )
  }
}

export default Page({
  path: '/reports/adjustment',
  exact: true,
  validate: loggedIn,
  component: injectIntl(AdjustmentReport),
  title: 'Reporte de ajustes',
  icon: 'history',
  roles: 'orgadmin'
})
