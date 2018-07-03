import React, { Component } from 'react'
import moment from 'moment'
import api from '~base/api'
import { toast } from 'react-toastify'
import _ from 'lodash'
import Loader from '~base/components/spinner'
import Graph from '~base/components/graph'
import Select from './select'
import Link from '~base/router/link'
import { BaseTable } from '~base/components/base-table'
import InputRange from 'react-input-range'
import 'react-input-range/lib/css/index.css'
import Checkbox from '~base/components/base-checkbox'

class TabHistorical extends Component {
  constructor(props) {
    super(props)
    this.state = {
      loading: true,
      totalAdjustment: 0,
      totalPrediction: 0,
      totalSale: 0,
      totalPSale: 0,
      mape: 0,
      searchTerm: '',
      sortBy: 'sale',
      sortAscending: true
    }
    this.selectedProjects = {}
    this.selectedItems = []

    this.selectedProjects[this.props.project.uuid] = this.props.project.uuid
    this.rules = this.props.rules

  }

  componentWillMount() {
    this.getAll()
  }

  moveTo(route) {
    this.props.history.push(route)
  }

  clear() {
    this.setState({
      filters: undefined,
      graphData: undefined,
      filteredData: undefined,
      mape: 0,
      totalAdjustment: 0,
      totalPrediction: 0,
      totalSale: 0,
      totalPSale: 0,
    })
  }

  async getAll() {
    let projects = Object.values(this.selectedProjects)

    if (projects.length <= 0) {
      return
    }
    try{
    let url = '/app/dashboard/projects'
    let res = await api.get(url, projects)
    
    this.getCatalogFilters(res.catalogItems)
    
    this.setState({
      loading: false,
      filters: res,
    }, async () => {
      await this.getDates()
      this.getGraph()
      this.getProductTable()
    })
    }catch(e){
      this.notify('Error al obtener los filtros ' + e.message, 5000, toast.TYPE.ERROR)
        this.setState({
          loading: false,
          noFilters: 'Error al obtener los filtros, contacte a un administrador'
        })
    }
  }

  async getGraph() {
    this.setState({
      filteredData: undefined,
      graphData: undefined,
      mape: 0,
      totalAdjustment: 0,
      totalPrediction: 0,
      totalSale: 0,
      totalPSale: 0,
      noData: undefined
    })

    if (!this.state.waitingData) {
      try {
        let url = '/app/organizations/local/historical'
        this.setState({
          waitingData: true
        })
        let res = await api.post(url, {
          date_start: moment.utc([this.state.minPeriod.year, this.state.minPeriod.number - 1]).startOf('month').format('YYYY-MM-DD'),
          date_end: moment.utc([this.state.maxPeriod.year, this.state.maxPeriod.number - 1]).endOf('month').format('YYYY-MM-DD'),
          projects: Object.values(this.selectedProjects),
          catalogItems: Object.keys(this.selectedItems)
        })

        let totalPSale = 0
        let totalSale = 0
        let totalPrediction = 0
        let totalAdjustment = 0
        let mape = 0

        let data = res.data
        let activePeriod = []
        let topValue = 0

        data = _.orderBy(res.data,
          (e) => {
            return e.date
          }
          , ['asc'])

        data.map((item) => {
          totalAdjustment += item.adjustment
          totalPrediction += item.prediction
          totalSale += item.sale
          totalPSale += item.previousSale

          if (moment(item.date).isBetween(moment().startOf('month'), moment().endOf('month'), null, '[]')) {
            activePeriod.push(item)
          }
        })

        topValue = this.getTopValue(res.data)

        mape = res.mape

        if (isNaN(mape) || mape === Infinity || mape === null) {
          mape = 0
        }

        this.setState({
          graphData: data,
          totalAdjustment,
          totalPrediction,
          totalSale,
          totalPSale,
          mape,
          topValue,
          reloadGraph: true,
          startPeriod: moment.utc().startOf(this.rules.cycle).format('YYYY-MM-DD'),
          endPeriod: moment.utc().endOf(this.rules.cycle).format('YYYY-MM-DD'),
          waitingData: false
        })
        setTimeout(() => {
          this.setState({
            reloadGraph: false
          })
        }, 10)
      } catch (e) {
        this.notify('Error ' + e.message, 5000, toast.TYPE.ERROR)
        this.setState({
          noData: e.message + ', intente más tarde'
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

  async getProductTable() {
    try {
      let url = '/app/organizations/local/table'
      let res = await api.post(url, {
        date_start: moment.utc([this.state.minPeriod.year, this.state.minPeriod.number - 1]).startOf('month').format('YYYY-MM-DD'),
        date_end: moment.utc([this.state.maxPeriod.year, this.state.maxPeriod.number - 1]).endOf('month').format('YYYY-MM-DD'),
        projects: Object.values(this.selectedProjects),
        catalogItems: Object.keys(this.selectedItems)
      })
      this.setState({
        productTable: res.data,
        sortAscending: false
      }, () => {
        this.searchDatarows()
        this.handleSort(this.state.sortBy)
      })
    }
    catch (e) {
      this.notify('Error ' + e.message, 5000, toast.TYPE.ERROR)
      this.setState({
        noData: e.message + ', intente más tarde'
      })
    }
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
        if(item.type === filter){
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
        'title': 'Id',
        'property': 'product.externalId',
        'default': 'N/A',
        'sortable': true,
        formatter: (row) => {
          return row.product.externalId
        }
      },
      {
        'title': 'Producto',
        'property': 'product.name',
        'default': 'N/A',
        'sortable': true,
        formatter: (row) => {
          return row.product.name
        }
      },
      {
        'title': 'Predicción',
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
        'title': 'Ajuste',
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
        'title': 'Venta',
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
        'title': 'Venta año anterior',
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
          <h1 className='has-text-info'>Debes seleccionar al menos un proyecto</h1>
        </center>
      )
    }
    else if (Object.keys(this.selectedProjects).length !== 0 && !this.state.noData) {
      return (
        <center>
          <h1 className='has-text-info'>Cargando, un momento por favor</h1>
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
    let dateMin = moment.utc(this.props.project.dateMin)
    let dateMax = moment.utc(this.props.project.dateMax)

    if(dateMin.isBefore(moment.utc('2017-01-01'))){
      dateMin = moment.utc('2017-01-01')
    }

    while (dateMin.format('MMMM YYYY') !== dateMax.format('MMMM YYYY')){
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

    this.setState({
      periods: p,
      minPeriod: {number: 1, name: "enero", year: 2018},
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
        this.getProductTable()
      })
    }
    else {
      this.setState({
        minPeriod: this.state.maxPeriod,
        maxPeriod: item
      }, () => {
        this.getGraph()
        this.getProductTable()
      })
    }

  }

  setMaxPeriod(item) {
    let min = moment.utc([this.state.minPeriod.year, this.state.minPeriod.number - 1])
    let max = moment.utc([item.year, item.number - 1])
    if (max.isAfter(min)){
      this.setState({
        maxPeriod: item
      }, () => {
        this.getGraph()
        this.getProductTable()
      })
    }
    else {
      this.setState({
        maxPeriod: this.state.minPeriod,
        minPeriod: item
      }, () => {
        this.getGraph()
        this.getProductTable()
      })
    }
  }


  findName = (name) => {
    let find = ''

    if (!this.rules) return find

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
        isOpen: true
      }))
      .value()
    
    this.setState({
      catalogItems: filters
    }, () => {
      filters.map(item => {
        if (item.type !== 'Producto' && item.type !== 'Precio'){
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
          else{
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
    this.getProductTable()
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
      if (item.type !== 'Producto' && item.type !== 'Precio'){
      return (
        <li key={item.type} className='filters-item'>
          <div className={item.isOpen ? 'collapsable-title' : 'collapsable-title active'}
            onClick={() => { this.showFilter(item.type) }}>
            <a>
              <span className='icon'>
                <i className={item.isOpen
                  ? 'fa fa-plus' : 'fa fa-minus'} />
              </span>
              {item.type} <strong>{item.objects && item.objects.length}</strong>
            </a>
          </div>
          <aside className={item.isOpen
            ? 'is-hidden' : 'menu'} disabled={this.state.waitingData}>
            <div>
              <Checkbox
                checked={item.selectAll}
                label={'Seleccionar Todos'}
                handleCheckboxChange={(e, value) => {
                  this.checkAllItems(value, item.type)
                  this.getGraph()
                  this.getProductTable()
                }}
                key={item.type}
                disabled={this.state.waitingData}
              />
            </div>
            <ul className='menu-list'>
              {item.objects &&
                item.objects.map((obj) => {
                  if (obj.selected === undefined) {
                    obj.selected = true
                  }
                  let name = obj.name === 'Not identified' ? obj.externalId + ' (No identificado)' : obj.externalId + ' ' + obj.name

                  return (
                    <li key={obj.uuid}>
                      <a>
                        <Checkbox
                          label={<span title={name}>{name}</span>}
                          handleCheckboxChange={(e, value) => this.selectItem(e, value, obj, item )}
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

  render() {

    const {
      loading
    } = this.state

    if (loading) {
      return <Loader />
    }

    if(this.state.noFilters){
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

    const graph = [
      {
        label: 'Predicción',
        color: '#187FE6',
        data: this.state.graphData ? this.state.graphData.map((item) => { return item.prediction !== 0 ? item.prediction : null }) : []
      },
      {
        label: 'Ajuste',
        color: '#30C6CC',
        data: this.state.graphData ? this.state.graphData.map((item) => { return item.adjustment !== 0 ? item.adjustment : null }) : []
      },
      {
        label: 'Venta',
        color: '#0CB900',
        data: this.state.graphData ? this.state.graphData.map((item) => { return item.sale !== 0 ? item.sale : null }) : []
      },
      {
        label: 'Venta año anterior',
        color: '#EF6950',
        data: this.state.graphData ? this.state.graphData.map((item) => { return item.previousSale !== 0 ? item.previousSale : null}) : []
      }
    ]

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
      <div>
        <div className='section'>
          <div className='columns filters-project '>
            <div className='column is-2-fullhd is-3'>
              <div className='columns is-multiline'>
                <div className='column is-12'>
                  <div className='card filters'>
                    <div className='card-header'>
                      <h1>
                        <span className='icon'>
                          <i className='fa fa-filter' />
                        </span>
                        Filtros</h1>
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
              <div className='columns box'>
                <div className='column is-3 is-2-widescreen is-paddingless'>
                  <div className='notification is-info has-text-centered'>
                    <h1 className='title is-2'>{this.state.mape.toFixed(2) || '0.00'}%</h1>
                    <h2 className='subtitle has-text-weight-bold'>MAPE</h2>
                  </div>
                  <div className='indicators'>
                    <p className='indicators-title'>Venta total</p>
                    <p className='indicators-number has-text-success'>{this.state.totalSale.toFixed().replace(/./g, (c, i, a) => {
                      return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
                    })}</p>

                    <p className='indicators-title'>Venta año anterior</p>
                    <p className='indicators-number has-text-danger'>{this.state.totalPSale.toFixed().replace(/./g, (c, i, a) => {
                      return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
                    })}</p>

                    <p className='indicators-title'>Ajuste total</p>
                    <p className='indicators-number has-text-teal'>{this.state.totalAdjustment.toFixed().replace(/./g, (c, i, a) => {
                      return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
                    })}</p>

                    <p className='indicators-title'>Predicción total</p>
                    <p className='indicators-number has-text-info'>{this.state.totalPrediction.toFixed().replace(/./g, (c, i, a) => {
                      return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
                    })}</p>

                  </div>
                </div>
                <div className='column card'>
                  {this.state.graphData && this.state.filteredData ?
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
                            label: function (tooltipItem, data) {
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
                        }}
                        labels={this.state.graphData.map((item) => { return item.date })}
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
                                  callback: function (label, index, labels) {
                                    if (label <= 999) {
                                      return label
                                    } else if (label >= 1000 && label <= 999999) {
                                      return (label / 1000) + 'K'
                                    } else if (label >= 1000000 && label <= 999999999) {
                                      return (label / 1000000) + 'M'
                                    }
                                  },
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
                                  content: 'Periodo actual',
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
                </div>

                <div className='level-right'>
                  {this.state.minPeriod &&
                    <div className='level-item'>
                    <div className='field'>
                      <label className='label'>Periodo inicial</label>
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

                    <div className='level-item date-drop'>
                      <span className='icon'>
                        <i className='fa fa-minus' />
                      </span>
                    </div>

                  {this.state.maxPeriod &&
                    <div className='level-item'>
                     <div className='field'>
                        <label className='label'>Periodo final</label>
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

              {this.state.filteredData && this.state.graphData
                ? this.state.filteredData.length > 0
                  ? <div className='scroll-table'>
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
                  : <section className='section'>
                    <center>
                      <h1 className='has-text-info'>No hay productos que mostrar, intente con otro filtro</h1>
                    </center>
                  </section>
                : <section className='section'>
                  {this.loadTable()}
                </section>
              }
            </div>
          </div>
        </div>
      </div>
    )
  }
}
export default TabHistorical
