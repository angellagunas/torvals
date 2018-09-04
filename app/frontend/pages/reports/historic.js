import React, { Component } from 'react'
import { FormattedMessage, injectIntl
 } from 'react-intl'
import moment from 'moment'
import tree from '~core/tree'
import _ from 'lodash'
import Link from '~base/router/link'
import api from '~base/api'
import Loader from '~base/components/spinner'
import Page from '~base/page'
import { loggedIn } from '~base/middlewares/'
import Graph from '~base/components/graph'
import { BaseTable } from '~base/components/base-table'
import Checkbox from '~base/components/base-checkbox'
import { toast } from 'react-toastify'
import { defaultCatalogs } from '~base/tools'

class HistoricReport extends Component {
  constructor(props) {
    super(props)
    this.state = {
      loading: true,
      totalAdjustment: 0,
      totalPrediction: 0,
      totalSale: 0,
      totalPSale: 0,
      mapePrediction: 0,
      mapeAdjustment: 0,
      difference: 0,
      searchTerm: '',
      sortBy: 'sale',
      sortAscending: true,
      projectSelected: ''
    }
    this.selectedProjects = {}
    this.selectedItems = []

    this.currentRole = tree.get('user').currentRole.slug
    this.rules = tree.get('rule')

    moment.locale(this.formatTitle('dates.locale'))
  }

  findInCatalogs(slug) {
    let find = false
    defaultCatalogs.map(item => {
      if (item.value === slug) {
        find = true
      }
    })
    return find
  }

  componentWillMount() {
    this.getProjects()
  }

  moveTo(route) {
    this.props.history.push(route)
  }

  clear() {
    this.selectedChannels = []
    this.selectedSalesCenters = []
    this.selectedProducts = []
    this.setState({
      filters: undefined,
      graphData: undefined,
      filteredData: undefined,
      mapePrediction: 0,
      mapeAdjustment: 0,
      difference: 0,
      totalAdjustment: 0,
      totalPrediction: 0,
      totalSale: 0,
      totalPSale: 0,
    })
  }

  async getProjects() {
    let url = '/app/projects'

    let res = await api.get(url, {
      showOnDashboard: true
    })

    let activeProjects = res.data.filter(item => { return item.mainDataset })
    activeProjects[0].selected = true
    this.selectedProjects[activeProjects[0].uuid] = activeProjects[0]

    this.setState({
      projects: activeProjects,
      projectSelected: activeProjects[0],
      loading: false
    }, () => {
      this.getAll()
    })
  }

  async selectProject(project) {
    this.selectedProjects = {}
    this.selectedProjects[project.uuid] = project
    project.selected = true
    this.setState({
      projectSelected: project
    }, () => {
      this.getAll()
    })
  }

  async getAll() {
    let projects = Object.values(this.selectedProjects)

    if (projects.length <= 0) {
      return
    }

    let maxD = projects.map(d => moment.utc(d.dateMax))
    let minD = projects.map(d => moment.utc(d.dateMin))

    let url = '/app/dashboard/projects'
    let res = await api.get(url, projects.map(p => p.uuid))

    this.getCatalogFilters(res.catalogItems)

    this.setState({
      filters: res,
      dateMin: moment.min(minD),
      dateMax: moment.max(maxD)
    }, async () => {
      await this.getDates()
      this.getGraph()
    })
  }

  async getGraph() {
    this.setState({
      filteredData: undefined,
      graphData: undefined,
      mapePrediction: 0,
      mapeAdjustment: 0,
      difference: 0,
      totalAdjustment: 0,
      totalPrediction: 0,
      totalSale: 0,
      totalPSale: 0,
      noData: undefined
    })

    if (!this.state.waitingData) {
      try {
        let url = '/app/projects/adjustment/historical/' + this.state.projectSelected.uuid
        this.setState({
          waitingData: true
        })
        let res = await api.post(url, {
          date_start: moment.utc([this.state.minPeriod.year, this.state.minPeriod.number - 1]).startOf('month').format('YYYY-MM-DD'),
          date_end: moment.utc([this.state.maxPeriod.year, this.state.maxPeriod.number - 1]).endOf('month').format('YYYY-MM-DD'),
          catalogItems: Object.keys(this.selectedItems),
          prices: this.state.prices
        })

        let totalPSale = 0
        let totalSale = 0
        let totalPrediction = 0
        let totalAdjustment = 0
        let mapePrediction = 0
        let mapeAdjustment = 0
        let difference = 0

        let data = res.data
        let activePeriod = []
        let topValue = 0

        data = _.orderBy(res.data,
          (e) => {
            return e.date
          }
          , ['asc'])

        let datasets = {}

        data.map((item) => {
          totalAdjustment += item.adjustment
          totalPrediction += item.prediction
          totalSale += item.sale
          totalPSale += item.previousSale

          if (moment(item.date).isBetween(moment().startOf('month'), moment().endOf('month'), null, '[]')) {
            activePeriod.push(item)
          }

          if(datasets[item.dataset]){
            datasets[item.dataset].push(item)
          }else{
            datasets[item.dataset] = [item]
          }

        })

        topValue = this.getTopValue(res.data)

        mapePrediction = res.mapePrediction
        mapeAdjustment = res.mapeAdjustment
        difference = res.difference


        this.setState({
          graphData: data,
          totalAdjustment,
          totalPrediction,
          totalSale,
          totalPSale,
          mapePrediction,
          mapeAdjustment,
          difference,
          topValue,
          reloadGraph: true,
          startPeriod: activePeriod[0],
          endPeriod: activePeriod[activePeriod.length - 1],
          waitingData: false,
          datasets
        })
        setTimeout(() => {
          this.setState({
            reloadGraph: false
          })
        }, 10)
      } catch (e) {
        this.notify('Error ' + e.message, 5000, toast.TYPE.ERROR)
        this.setState({
          noData: e.message + ', ' + this.formatTitle('dashboard.try')
        })
      }
    }
  }

  getTopValue(data) {
    let maxPrediction = Math.max.apply(Math, data.map(function (item) { return item.prediction }))
    let maxAdjustment = Math.max.apply(Math, data.map(function (item) { return item.adjustment }))
    let maxSale = Math.max.apply(Math, data.map(function (item) { return item.sale }))
    let maxPrevSale = Math.max.apply(Math, data.map(function (item) { return item.previousSale }))

    return Math.max(maxPrediction, maxAdjustment, maxSale, maxPrevSale)
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

  showFilter(filter) {
    let catalogItems = this.state.catalogItems
    catalogItems.map(item => {
      if (item.type === filter) {
        item.isOpen = !item.isOpen
      }
    })
    this.setState({
      catalogItems
    })
  }

  getColumns() {
    let cols = [
      {
        'title': this.formatTitle('tables.colId'),
        'property': 'product.externalId',
        'default': 'N/A',
        'sortable': true,
        formatter: (row) => {
          return row.product.externalId
        }
      },
      {
        'title': this.formatTitle('tables.colProduct'),
        'property': 'product.name',
        'default': 'N/A',
        'sortable': true,
        formatter: (row) => {
          return row.product.name
        }
      },
      {
        'title': this.formatTitle('tables.colForecast'),
        'property': 'prediction',
        'default': '0',
        'sortable': true,
        formatter: (row) => {
          if (row.prediction) {
            return row.prediction.toFixed().replace(/./g, (c, i, a) => {
              return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
            })
          }
        }
      },
      {
        'title': this.formatTitle('tables.colAdjustment'),
        'property': 'adjustment',
        'default': '0',
        'sortable': true,
        formatter: (row) => {
          if (row.adjustment) {
            return row.adjustment.toFixed().replace(/./g, (c, i, a) => {
              return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
            })
          }
        }
      },
      {
        'title': this.formatTitle('tables.colSales'),
        'property': 'sale',
        'default': '0',
        'sortable': true,
        formatter: (row) => {
          if (row.sale) {
            return row.sale.toFixed().replace(/./g, (c, i, a) => {
              return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
            })
          }
        }
      },
      {
        'title': this.formatTitle('tables.colLast'),
        'property': 'previousSale',
        'default': '0',
        'sortable': true,
        formatter: (row) => {
          if (row.previousSale) {
            return row.previousSale.toFixed().replace(/./g, (c, i, a) => {
              return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
            })
          }
        }
      },
      {
        'title': 'MAPE',
        'property': 'mape',
        'default': '0.00%',
        'sortable': true,
        'className': 'has-text-weight-bold',
        formatter: (row) => {
          let mape = 0

          if (row.mape) {
            mape = row.mape
          }
          else {
            mape = Math.abs(((row.sale - row.prediction) / row.sale) * 100)

            if (mape === Infinity) {
              mape = 0
            }
          }


          if (mape <= 7) {
            return <span className='has-text-success'>{mape.toFixed(2)}%</span>
          } else if (mape > 7 && mape <= 14) {
            return <span className='has-text-warning'>{mape.toFixed(2)}%</span>
          } else if (mape > 14) {
            return <span className='has-text-danger'>{mape.toFixed(2)}%</span>
          }
        }
      }
    ]

    return cols
  }

  handleSort(e) {
    let sorted = this.state.productTable

    if (e === 'product.externalId') {
      if (this.state.sortAscending) {
        sorted.sort((a, b) => { return parseFloat(a.product.externalId) - parseFloat(b.product.externalId) })
      } else {
        sorted.sort((a, b) => { return parseFloat(b.product.externalId) - parseFloat(a.product.externalId) })
      }
    } else {
      if (this.state.sortAscending) {
        sorted = _.orderBy(sorted, [e], ['asc'])
      } else {
        sorted = _.orderBy(sorted, [e], ['desc'])
      }
    }

    this.setState({
      productTable: sorted,
      sortAscending: !this.state.sortAscending,
      sortBy: e
    }, () => {
      this.searchDatarows()
    })

  }

  async searchDatarows() {
    if (this.state.searchTerm === '') {
      this.setState({
        filteredData: this.state.productTable
      })

      return
    }

    const items = this.state.productTable.filter((item) => {
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

  loadTable() {
    if (Object.keys(this.selectedProjects).length === 0) {
      return (
        <center>
          <h1 className='has-text-info'>
            <FormattedMessage
              id="report.projectsEmptyMsg"
              defaultMessage={`Debes seleccionar al menos un proyecto`}
            />
          </h1>
        </center>
      )
    }
    else if (Object.keys(this.selectedProjects).length !== 0 && !this.state.noData) {
      return (
        <center>
          <h1 className='has-text-info'>
            <FormattedMessage
              id="report.loadingMsg"
              defaultMessage={`Cargando, un momento por favor`}
            />
          </h1>
          <Loader />
        </center>
      )
    } else {
      return (
        <div className='is-fullwidth has-text-centered subtitle has-text-primary'>
          {this.state.noData}
        </div>
      )
    }
  }

  async getDates() {
    let d = []
    let p = []
    let dateMin = moment.utc(this.state.dateMin)
    let dateMax = moment.utc(this.state.dateMax)

    if (dateMin.isBefore(moment.utc('2017-01-01'))) {
      dateMin = moment.utc('2017-01-01')
    }

    while (dateMin.format('MMMM YYYY') !== dateMax.format('MMMM YYYY')) {
      d.push(dateMin)
      dateMin = moment.utc(dateMin).add(1, 'month')
    }

    d.push(dateMin)

    for (let i = 0; i < d.length; i++) {
      p.push({
        number: d[i].get('month') + 1,
        name: `${d[i].format('MMMM')}`,
        year: d[i].get('year')
      })
    }

    let min = p[0]
    p.map(item => {
      if(item.year === 2018 && item.number === 1){
        min = item
      }
    })

    this.setState({
      periods: p,
      minPeriod: min || { number: 1, name: "enero", year: 2018 },
      maxPeriod: p[p.length - 1]
    })
  }


  setMinPeriod(item) {
    let max = moment.utc([this.state.maxPeriod.year, this.state.maxPeriod.number - 1])
    let min = moment.utc([item.year, item.number - 1])
    if (min.isBefore(max)) {
      this.setState({
        minPeriod: item
      }, () => {
        this.getGraph()
      })
    }
    else {
      this.setState({
        minPeriod: this.state.maxPeriod,
        maxPeriod: item
      }, () => {
        this.getGraph()
      })
    }

  }

  setMaxPeriod(item) {
    let min = moment.utc([this.state.minPeriod.year, this.state.minPeriod.number - 1])
    let max = moment.utc([item.year, item.number - 1])
    if (max.isAfter(min)) {
      this.setState({
        maxPeriod: item
      }, () => {
        this.getGraph()
      })
    }
    else {
      this.setState({
        maxPeriod: this.state.minPeriod,
        minPeriod: item
      }, () => {
        this.getGraph()
      })
    }
  }


  findName = (name) => {
    let find = ''
    this.rules.catalogs.map(item => {
      if (item.slug === name) {
        find = item.name
      }
    })
    return find
  }

  async getCatalogFilters(catalogs) {
    let filters = _(catalogs)
      .groupBy(x => x.type)
      .map((value, key) => ({
        type: this.findName(key),
        objects: value,
        selectAll: true,
        isOpen: true,
        slug: key
      }))
      .value()

    this.setState({
      catalogItems: filters
    }, () => {
      filters.map(item => {
        if (item.type !== 'Producto' && item.type !== 'Precio') {
          this.checkAllItems(item.selectAll, item.type)
        }
      })
    })
  }

  async checkAllItems(value, type) {
    let aux = this.state.catalogItems
    aux.map(item => {
      if (item.type === type) {
        for (const s of item.objects) {
          s.selected = value
          if (value) {
            this.selectedItems[s.uuid] = s
          }
          else {
            delete this.selectedItems[s.uuid]
          }
        }
      }
    })

    await this.setState({
      catalogItems: aux
    })
  }

  selectItem(e, value, obj, item) {
    let aux = this.state.catalogItems

    if (value) {
      this.selectedItems[obj.uuid] = obj
    } else {
      delete this.selectedItems[obj.uuid]
    }

    obj.selected = value
    item.selectAll = this.countItems(obj.type) === item.objects.length

    this.getGraph()
    this.setState({
      catalogItems: aux
    })
  }

  countItems(type) {
    let count = 0
    Object.values(this.selectedItems).map(item => {
      if (type === item.type) {
        count++
      }
    })
    return count
  }

  makeFilters() {
    return this.state.catalogItems.map(item => {
      if (item.type !== 'Producto' && item.type !== 'Precio') {
        let title = item.type
        if (this.findInCatalogs(item.slug)) {
          title = this.formatTitle('catalogs.' + item.slug)
        }
        return (
          <li key={item.type} className='filters-item'>
            <div className={item.isOpen ? 'collapsable-title' : 'collapsable-title active'}
              onClick={() => { this.showFilter(item.type) }}>
              <a>
                <span className='icon'>
                  <i className={item.isOpen
                    ? 'fa fa-plus' : 'fa fa-minus'} />
                </span>
                {title} <strong>{item.objects && item.objects.length}</strong>
              </a>
            </div>
            <aside className={item.isOpen
              ? 'is-hidden' : 'menu'} disabled={this.state.waitingData}>
              <div>
                <Checkbox
                  checked={item.selectAll}
                  label={this.formatTitle('dashboard.selectAll')}
                  handleCheckboxChange={(e, value) => {
                    this.checkAllItems(value, item.type)
                    this.getGraph()
                  }}
                  key={'channel'}
                  disabled={this.state.waitingData}
                />
              </div>
              <ul className='menu-list'>
                {item.objects &&
                  item.objects.map((obj) => {
                    if (obj.selected === undefined) {
                      obj.selected = true
                    }
                    
                  let name = obj.name === 'Not identified' ? obj.externalId + ' ' + this.formatTitle('dashboard.unidentified') : obj.externalId + ' ' + obj.name

                    return (
                      <li key={obj.uuid}>
                        <a>
                          <Checkbox
                            label={<span title={name}>{name}</span>}
                            handleCheckboxChange={(e, value) => this.selectItem(e, value, obj, item)}
                            key={obj.uuid}
                            checked={obj.selected}
                            disabled={this.state.waitingData}
                          />
                          {obj.name === 'Not identified' &&
                            <span className='icon is-pulled-right' onClick={() => { this.moveTo('/catalogs/' + obj.type + '/' + obj.uuid) }}>
                              <i className={this.props.currentRole === 'consultor-level-3' ? 'fa fa-eye has-text-info' : 'fa fa-edit has-text-info'} />
                            </span>
                          }
                        </a>
                      </li>
                    )
                  })
                }
              </ul>
            </aside>
          </li>
        )
      }
    })
  }

  getRandColor(brightness) {
    let rgb = [Math.random() * 256, Math.random() * 256, Math.random() * 256];
    let mix = [brightness * 51, brightness * 51, brightness * 51]; //51 => 255/5
    let mixedrgb = [rgb[0] + mix[0], rgb[1] + mix[1], rgb[2] + mix[2]].map((x) => { return Math.round(x / 2.0) })
    return "rgb(" + mixedrgb.join(",") + ")";
  }


  showBy(prices) {
    this.setState({ prices },
      () => {
        this.getGraph()
      })
  }

  getCallback() {
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
    }
    else {
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

  getTooltipCallback() {
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
    }
    else {
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

  formatTitle(id) {
    return this.props.intl.formatMessage({ id: id })
  }

  render() {
    const user = tree.get('user')

    const {
      loading
    } = this.state

    if (loading) {
      return <Loader />
    }

    let callbackLabels = this.getCallback()
    let tooltipCallback = this.getTooltipCallback()

    if (this.state.noFilters) {
      return (
        <div className='section columns'>
          <div className='column'>
            <article className="message is-danger">
              <div className="message-header">
                <p>Error</p>
              </div>
              <div className="message-body">
                {this.state.noFilters}
              </div>
            </article>
          </div>
        </div>
      )
    }


    let graph = []

    let labels = {}

    let prediction = {}


    if (this.state.graphData){
      this.state.graphData.map((item) => {
        labels[item.date] = item.date
        prediction[item.date] = item.prediction !== undefined ? item.prediction : null
      })

      prediction = Object.values(prediction)
      labels = Object.keys(labels)

      graph = [
        {
          label: this.formatTitle('tables.colForecast'),
          color: '#187FE6',
          data: prediction
        }
      ]

      Object.values(this.state.datasets).map((arr, key) => {
        let data = Array(labels.length).fill(null);

        arr.map((item) => {
          let index = labels.indexOf(item.date)
          if ( index !== -1) {
            data[index] = item.adjustment !== undefined ? item.adjustment : null
          }
        })

        graph.push({
          label: this.formatTitle('datasets.adjustment') + ' ' + (key + 1),
          color: this.getRandColor(4),
          data: data
        })
      })
    }

    const vLines = (this.state.graphData || []).map(item => ({
      drawTime: 'beforeDatasetsDraw',
      type: 'line',
      mode: 'vertical',
      scaleID: 'x-axis-0',
      value: item.date,
      borderColor: 'rgba(233, 238, 255, 1)',
      borderWidth: 1
    }))


    return (
      <div className='historic-view'>
        <div className='section-header'>
          <h2>
            <FormattedMessage
              id="report.historicTitle"
              defaultMessage={`Histórico de ajustes`}
            />
          </h2>
        </div>
        <div className='section'>
          <div className='columns filters-project '>
            <div className='column is-3'>
              <div className='columns is-multiline'>
                <div className='column is-12'>

                  <div className='card projects'>
                    <div className='card-header'>
                      <h1>
                        <span className='icon'>
                          <i className='fa fa-folder' />
                        </span>
                        <FormattedMessage
                          id="report.projects"
                          defaultMessage={`Proyectos`}
                        />
                      </h1>
                    </div>
                    <div className='card-content'>
                      <aside className='menu' disabled={this.state.waitingData}>
                        <ul className='menu-list'>
                          {this.state.projects &&
                            this.state.projects.map((item) => {
                              if (item.mainDataset) {
                                if (!item.selected) {
                                  item.selected = false
                                }
                                return (
                                  <li key={item.uuid}>
                                    <a>
                                      <div className="field" key={item.uuid}>
                                        <input
                                          className="is-checkradio is-info is-small"
                                          id={item.name}
                                          type="radio"
                                          name='project'
                                          checked={this.selectedProjects[item.uuid] !== undefined}
                                          disabled={this.state.waitingData}
                                          onChange={() => this.selectProject(item)} />
                                        <label htmlFor={item.name}>
                                          {<span title={item.name}>{item.name}</span>}
                                        </label>
                                      </div>
                                      <span className='icon is-pulled-right' onClick={() => { this.moveTo('/projects/' + item.uuid) }}>
                                        <i className={this.currentRole === 'consultor-level-3' ? 'fa fa-eye has-text-info' : 'fa fa-edit has-text-info'} />
                                      </span>
                                    </a>
                                  </li>
                                )
                              }
                            })
                          }
                        </ul>
                      </aside>
                    </div>
                  </div>

                </div>
                <div className='column is-12'>

                  <div className='level dash-graph'>
                      {this.state.minPeriod &&
                        <div className='level-item'>
                          <div className='field'>
                            <label className='label'>
                              <FormattedMessage
                                id="report.initial"
                                defaultMessage={`Inicial`}
                              />
                            </label>
                            <div className='field is-grouped control'>
                              <div className={this.state.waitingData ? 'dropdown is-disabled' : 'dropdown is-hoverable'}>
                                <div className='dropdown-trigger'>
                                  <button className='button is-static is-capitalized' aria-haspopup='true' aria-controls='dropdown-menu4'>
                                    <span>{this.state.minPeriod.name + ' ' + this.state.minPeriod.year}</span>
                                    <span className='icon is-small'>
                                      <i className='fa fa-angle-down' aria-hidden='true'></i>
                                    </span>
                                  </button>
                                </div>
                                <div className='dropdown-menu' id='dropdown-menu4' role='menu'>
                                  <div className='dropdown-content'>
                                    {this.state.periods && this.state.periods.map((item, key) => {
                                      return (
                                        <a key={key} className={this.state.minPeriod.number === item.number &&
                                          this.state.minPeriod.name === item.name &&
                                          this.state.minPeriod.year === item.year ? 'dropdown-item is-capitalized is-active' : 'dropdown-item is-capitalized'}
                                          onClick={() => this.setMinPeriod(item)}>
                                          {item.name + ' ' + item.year}
                                        </a>
                                      )
                                    })}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      }

                      <div className='level-item date-drop is-hidden-desktop-only'>
                        <span className='icon'>
                          <i className='fa fa-minus' />
                        </span>
                      </div>

                      {this.state.maxPeriod &&
                        <div className='level-item'>
                          <div className='field'>
                            <label className='label'>
                              <FormattedMessage
                                id="report.final"
                                defaultMessage={`Final`}
                              />
                            </label>
                            <div className='field is-grouped control'>
                              <div className={this.state.waitingData ? 'dropdown is-disabled' : 'dropdown is-hoverable'}>
                                <div className='dropdown-trigger'>
                                  <button className='button is-static is-capitalized' aria-haspopup='true' aria-controls='dropdown-menu4'>
                                    <span>{this.state.maxPeriod.name + ' ' + this.state.maxPeriod.year}</span>
                                    <span className='icon is-small'>
                                      <i className='fa fa-angle-down' aria-hidden='true'></i>
                                    </span>
                                  </button>
                                </div>
                                <div className='dropdown-menu' id='dropdown-menu4' role='menu'>
                                  <div className='dropdown-content'>
                                    {this.state.periods &&
                                      this.state.periods.slice(this.state.periods.indexOf(this.state.minPeriod), this.state.periods.length)
                                        .map((item, key) => {
                                          return (
                                            <a key={key} className={this.state.maxPeriod === item ? 'dropdown-item is-capitalized is-active' : 'dropdown-item is-capitalized'}
                                              onClick={() => this.setMaxPeriod(item)}>
                                              {item.name + ' ' + item.year}
                                            </a>
                                          )
                                        })}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      }
                  </div>

                </div>

                <div className='column is-12'>
                  <div className="field has-pad-sides-5">
                    <label className='label'>
                      <FormattedMessage
                        id="report.showBy"
                        defaultMessage={`Mostrar por`}
                      />:
                    </label>
                    <div className='control'>

                      <div className="field is-grouped">
                        <div className='control'>

                          <input
                            className="is-checkradio is-info is-small"
                            id='showByquantity'
                            type="radio"
                            name='showBy'
                            checked={!this.state.prices}
                            disabled={this.state.waitingData}
                            onChange={() => this.showBy(false)} />
                          <label htmlFor='showByquantity'>
                            <span title='Cantidad'>
                              <FormattedMessage
                                id="report.quantity"
                                defaultMessage={`Cantidad`}
                              />
                            </span>
                          </label>
                        </div>

                        <div className='control'>
                          <input
                            className="is-checkradio is-info is-small"
                            id='showByprice'
                            type="radio"
                            name='showBy'
                            checked={this.state.prices}
                            disabled={this.state.waitingData}
                            onChange={() => this.showBy(true)} />
                          <label htmlFor='showByprice'>
                            <span title='Precio'>
                              <FormattedMessage
                                id="report.price"
                                defaultMessage={`Precio`}
                              />
                            </span>
                          </label>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

                <div className='column is-12'>

                  <div className='card filters'>
                    <div className='card-header'>
                      <h1>
                        <span className='icon'>
                          <i className='fa fa-filter' />
                        </span>
                        <FormattedMessage
                          id="report.filters"
                          defaultMessage={`Filtros`}
                        />
                      </h1>
                    </div>
                    <div className='card-content'>

                      <ul>
                        {this.state.catalogItems &&
                          this.makeFilters()
                        }
                      </ul>
                    </div>
                  </div>

                </div>
              </div>
            </div>


            <div className='column dash-graph'>
              {this.state.projectSelected &&
                <h1 className='report-title'>
                  <FormattedMessage
                    id="report.historicResults"
                    defaultMessage={`Resultados de histórico por rango de tiempo en proyecto`}
                  />
                 <strong> {this.state.projectSelected.name}</strong>
                </h1>
              }
              <div className='columns'>
                <div className='column is-paddingless'>
                  <div className='notification is-info has-text-centered'>
                    <h1 className='title is-2'>{this.state.mapePrediction.toFixed(2) || '0.00'}%</h1>
                    <h2 className='subtitle has-text-weight-bold'>
                      <FormattedMessage
                        id="report.historicColumns1"
                        defaultMessage={`MAPE Predicción`}
                      />
                    </h2>
                  </div>
                </div>

                <div className='column is-paddingless'>
                  <div className='notification is-info-dark-1 has-text-centered'>
                    <h1 className='title is-2'>{this.state.mapeAdjustment.toFixed(2) || '0.00'}%</h1>
                    <h2 className='subtitle has-text-weight-bold'>
                      <FormattedMessage
                        id="report.historicColumns2"
                        defaultMessage={`MAPE Ajuste`}
                      />
                    </h2>
                  </div>
                </div>

                <div className='column is-paddingless'>
                  <div className='notification is-info-dark-2 has-text-centered'>
                    <h1 className='title is-2'>{this.state.difference.toFixed(2) || '0.00'}%</h1>
                    <h2 className='subtitle has-text-weight-bold'>
                      <FormattedMessage
                        id="report.historicColumns3"
                        defaultMessage={`Diferencia Predicción - Ajuste`}
                      />
                    </h2>
                  </div>
                </div>
              </div>
              <div className='columns box'>
                <div className='column card'>
                  {this.state.graphData ?
                    this.state.graphData.length > 0 ?
                      <Graph
                        data={graph}
                        maintainAspectRatio={false}
                        responsive={true}
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
                        labels={labels}
                        scales={
                          {
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
                          }
                        }
                        annotation={this.state.startPeriod && this.state.startPeriod.date &&
                          {
                            annotations: [
                              {
                                drawTime: 'beforeDatasetsDraw',
                                type: 'box',
                                xScaleID: 'x-axis-0',
                                yScaleID: 'y-axis-0',
                                xMin: this.state.startPeriod.date,
                                xMax: this.state.endPeriod.date,
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
                                value: this.state.startPeriod.date,
                                borderColor: 'rgba(233, 238, 255, 1)',
                                borderWidth: 1,
                                label: {
                                  backgroundColor: 'rgb(233, 238, 255)',
                                  content: 'Actual',
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
                          <h1 className='has-text-info'>
                            <FormattedMessage
                              id="report.noInfo"
                              defaultMessage={`No hay datos que mostrar, intente con otro filtro`}
                            />
                          </h1>
                        </center>
                      </section>
                    : <section className='section has-30-margin-top'>
                      {this.loadTable()}
                    </section>
                  }

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default Page({
  path: '/reports/historic',
  exact: true,
  validate: loggedIn,
  component: injectIntl(HistoricReport),
  title: 'Histórico de ajustes',
  icon: 'history',
  roles: 'consultor-level-3, analyst, orgadmin, admin, consultor-level-2, manager-level-2, manager-level-3'
})
