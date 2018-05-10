import React, { Component } from 'react'
import { Redirect } from 'react-router-dom'
import { branch } from 'baobab-react/higher-order'
import PropTypes from 'baobab-react/prop-types'
import moment from 'moment'
import tree from '~core/tree'
import _ from 'lodash'
import Link from '~base/router/link'
import api from '~base/api'
import Loader from '~base/components/spinner'
import Page from '~base/page'
import {loggedIn} from '~base/middlewares/'
import Graph from '~base/components/graph'
import { BaseTable } from '~base/components/base-table'
import InputRange from 'react-input-range'
import 'react-input-range/lib/css/index.css'
import Checkbox from '~base/components/base-checkbox'
import { toast } from 'react-toastify'

class Dashboard extends Component {
  constructor (props) {
    super(props)
    this.state = {
      loading: true,
      salesCentersCollapsed: true,
      channelsCollapsed: true,
      productsCollapsed: true,
      yearsCollapsed: true,
      minPeriod: 1,
      maxPeriod: 12,
      yearSelected: moment().get('year'),
      allProjects: false,
      allChannels: false,
      allSalesCenters: false,
      allProducts: false,
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
    this.selectedSalesCenters = []
    this.selectedChannels = []
    this.selectedProducts = []

    this.currentRole = tree.get('user').currentRole.slug
    
  }

  componentWillMount () {
    this.getProjects()
  }

  moveTo (route) {
    this.props.history.push(route)
  }

  clear () {
    this.selectedChannels = []
    this.selectedSalesCenters = []
    this.selectedProducts = []
    this.setState({
      filters: undefined,
      salesCenters: undefined,
      channels: undefined,
      products: undefined,
      graphData: undefined,
      filteredData: undefined,
      mape: 0,
      totalAdjustment: 0,
      totalPrediction: 0,
      totalSale: 0,
      totalPSale: 0,
    })
  }

  async getProjects () {
    let url = '/app/projects'

    let res = await api.get(url,{
      showOnDashboard: true
    })

    let activeProjects = res.data.filter(item => { return item.activeDataset })

    this.setState({
      projects: activeProjects,
      loading: false
    }, () => { this.checkAllProjects(true) })
  }

  checkAllProjects (value) {
    let aux = this.state.projects
    this.selectedProjects = {}
    for (const project of aux) {
      project.selected = value
      if (value) { this.selectedProjects[project.uuid] = project.uuid }
    }
    this.setState({
      projects: aux,
      allProjects: value
    })

    if (value) {
      this.getAll()
    } else {
      this.clear()
    }
  }

  async checkAllSC (value) {
    let aux = this.state.salesCenters
    this.selectedSalesCenters = []
    for (const sc of aux) {
      sc.selected = value

      if (value) { this.selectedSalesCenters[sc.uuid] = sc.uuid }
    }
    await this.setState({
      salesCenters: aux,
      allSalesCenters: value
    })
  }

  async checkAllChannels (value) {
    let aux = this.state.channels
    this.selectedChannels = []
    for (const c of aux) {
      c.selected = value
      if (value) { this.selectedChannels[c.uuid] = c.uuid }
    }
    await this.setState({
      channels: aux,
      allChannels: value
    })
  }

  async checkAllProducts (value) {
    let aux = this.state.products
    this.selectedProducts = []
    for (const p of aux) {
      p.selected = value

      if (value) { this.selectedProducts[p.uuid] = p.uuid }
    }
    await this.setState({
      products: aux,
      allProducts: value
    })
  }

  async selectProject (e, value, project) {
    if (value) {
      this.selectedProjects[project.uuid] = project.uuid
    } else {
      delete this.selectedProjects[project.uuid]
      this.clear()
    }

    project.selected = value    
    this.setState({
      allProjects: Object.keys(this.selectedProjects).length === this.state.projects.length
    })

    this.getAll()
  }

  selectSalesCenter (e, value, project) {
    if (value) {
      this.selectedSalesCenters[project.uuid] = project.uuid
    } else {
      delete this.selectedSalesCenters[project.uuid]
    }

    project.selected = value

    this.getGraph()
    this.getProductTable()
    this.setState({
      allSalesCenters: Object.keys(this.selectedSalesCenters).length === this.state.salesCenters.length
    })
  }

  selectChannel (e, value, project) {
    if (value) {
      this.selectedChannels[project.uuid] = project.uuid
    } else {
      delete this.selectedChannels[project.uuid]
    }

    project.selected = value

    this.getGraph()
    this.getProductTable()
    this.setState({
      allChannels: Object.keys(this.selectedChannels).length === this.state.channels.length
    })
  }

  selectProduct (e, value, project) {
    if (value) {
      this.selectedProducts[project.uuid] = project.uuid
    } else {
      delete this.selectedProducts[project.uuid]
    }

    project.selected = value
    
    this.getGraph()
    this.getProductTable()
    this.setState({
      allProducts: Object.keys(this.selectedProducts).length === this.state.products.length      
    })
  }

  async getAll () {
    let projects = Object.values(this.selectedProjects)

    if (projects.length <= 0) {
      return
    }

    let url = '/app/dashboard/projects'
    let res = await api.get(url, projects)

    this.setState({
      filters: res,
      salesCenters: res.salesCenters,
      channels: res.channels,
      products: res.products,
    }, async () => {
      await this.checkAllChannels(true)
      await this.checkAllSC(true)
      await this.checkAllProducts(true)
      await this.getDates()
      this.getGraph()
      this.getProductTable()
    })
  }

  async getGraph () {
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

    if(!this.state.waitingData){
    try {
      let url = '/app/organizations/local/historical'
      this.setState({
        waitingData: true
      })
      let res = await api.post(url, {
        date_start: moment([this.state.yearSelected, this.state.minPeriod - 1]).startOf('month').format('YYYY-MM-DD'),
        date_end: moment([this.state.yearSelected, this.state.maxPeriod - 1]).endOf('month').format('YYYY-MM-DD'),
        channels: Object.values(this.selectedChannels),
        salesCenters: Object.values(this.selectedSalesCenters),
        //products: Object.values(this.selectedProducts),
        projects: Object.values(this.selectedProjects)
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
        startPeriod: activePeriod[0],
        endPeriod: activePeriod[activePeriod.length - 1],
        waitingData: false
      })
      setTimeout( () => {
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
  else{
    console.log('esperando respuesta')
  }
  }

  getTopValue (data){
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
        date_start: moment([this.state.yearSelected, this.state.minPeriod - 1 ]).startOf('month').format('YYYY-MM-DD'),
        date_end: moment([this.state.yearSelected, this.state.maxPeriod - 1]).endOf('month').format('YYYY-MM-DD'),
        channels: Object.values(this.selectedChannels),
        salesCenters: Object.values(this.selectedSalesCenters),
       // products: Object.values(this.selectedProducts),
        projects: Object.values(this.selectedProjects)
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

  showFilter (filter) {
    if (filter === 'salesCenters') {
      this.setState({
        salesCentersCollapsed: !this.state.salesCentersCollapsed,
      })
    } else if (filter === 'channels') {
      this.setState({
        channelsCollapsed: !this.state.channelsCollapsed,
      })
    } else if (filter === 'products') {
      this.setState({
        productsCollapsed: !this.state.productsCollapsed,
      })
    } else if (filter === 'years') {
      this.setState({
        yearsCollapsed: !this.state.yearsCollapsed,        
      })
    }
  }

  getColumns () {
    let cols = [
      {
        'title': 'Id',
        'property': 'product.externalId',
        'default': 'N/A',
        'sortable': true,
        formatter: (row) =>{
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
        'sortable': true
      },
      {
        'title': 'Ajuste',
        'property': 'adjustment',
        'default': '0',
        'sortable': true
      },
      {
        'title': 'Venta',
        'property': 'sale',
        'default': '0',
        'sortable': true
      },
      {
        'title': 'Venta anterior',
        'property': 'previousSale',
        'default': '0',
        'sortable': true
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

  handleSort (e) {
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
    if(Object.keys(this.selectedProjects).length === 0){
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
      const url = '/app/dates/'

      try {
        let res = await api.get(url)
        var periods = []
        let years = new Set()

        res.data.map((date) => {
          years.add(date.year)
        })

        periods = this.getPeriods(res.data, Array.from(years)[0])

        this.setState({
          dates: res.data,
          periods: periods,
          years: Array.from(years),
          value: { min: periods[0].number, max: periods[periods.length - 1].number },
          yearSelected: Array.from(years)[0]
        })
      } catch (e) {
        this.notify('Error: No hay fechas disponíbles, intente más tarde', 5000, toast.TYPE.ERROR)
      }
  }

  getPeriods(data, year) {
    let periods = []
    const map = new Map()
    data.map((date) => {
      if (date.year === year) {
        const key = date.month
        const collection = map.get(key)
        if (!collection) {
          map.set(key, [date])
        } else {
          collection.push(date)
        }
      }
    })

    for (let i = 0; i < Array.from(map).length; i++) {
      const element = Array.from(map)[i]
      periods.push({
        number: element[0],
        name: `${moment(element[1][0].month, 'M').format('MMMM')}`,
        maxSemana: element[1][0].week,
        minSemana: element[1][element[1].length - 1].week
      })
    }

    return periods.reverse()
  }

  getPeriodDate (period, startOf) {
    if(startOf){
      return moment(period, 'M').startOf('month').format('MMMM')
    }
    else{
      return moment(period, 'M').endOf('month').format('MMMM')
    }
  }

  selectYear (item, value) {
    console.log(item, value)
    if(value){
    this.setState({ yearSelected: item, noData: undefined },
      () => {
        this.getGraph()
        this.getProductTable()
      })
    }
    else{
      this.setState({
        filteredData: undefined,
        graphData: undefined,
        noData: 'Debe seleccionar un año'
      })      
    }
  }

  setMinPeriod(number) {
    if(number <= this.state.maxPeriod){
      this.setState({
        minPeriod: number
      }, () => {
        this.getGraph()
        this.getProductTable()
      })
    }
    else{
      this.setState({
        minPeriod: this.state.maxPeriod,
        maxPeriod: number
      }, () => {
        this.getGraph()
        this.getProductTable()
      })
    }

  }

  setMaxPeriod(number) {
    if (number >= this.state.minPeriod) {
      this.setState({
        maxPeriod: number
      }, () => {
        this.getGraph()
        this.getProductTable()
      })
    }
    else {
      this.setState({
        maxPeriod: this.state.minPeriod,
        minPeriod: number
      }, () => {
        this.getGraph()
        this.getProductTable()
      })
    }
  }

  render () {
    const user = this.context.tree.get('user')

    const {
      loading
    } = this.state

    if (loading) {
      return <Loader />
    }

    if (this.state.redirect) {
      return <Redirect to='/landing' />
    }

    if (user.currentRole.slug === 'manager-level-1') {
      return <Redirect to={'/projects/' + user.currentProject.uuid} />
    }

    const graph = [
      {
        label: 'Predicción',
        color: '#187FE6',
        data: this.state.graphData ? this.state.graphData.map((item) => { return item.prediction }) : []
      },
      {
        label: 'Ajuste',
        color: '#30C6CC',
        data: this.state.graphData ? this.state.graphData.map((item) => { return item.adjustment }) : []
      },
      {
        label: 'Venta',
        color: '#0CB900',
        data: this.state.graphData ? this.state.graphData.map((item) => { return item.sale }) : []
      },
      {
        label: 'Venta Anterior',
        color: '#EF6950',
        data: this.state.graphData ? this.state.graphData.map((item) => { return item.previousSale }) : []
      }
    ]

    return (
      <div>
        <div className='section-header'>
          <h2>Dashboard</h2>
        </div>
        <div className='section'>
          <div className='columns filters-project '>
            <div className='column is-2-fullhd is-3'>
              <div className='columns is-multiline'>
                <div className='column is-12'>

                  <div className='card projects'>
                    <div className='card-header'>
                      <h1>
                        <span className='icon'>
                          <i className='fa fa-folder' />
                        </span>
                      Proyectos</h1>
                    </div>
                    <div className='card-content'>
                      <aside className='menu' disabled={this.state.waitingData}>
                        <div>
                          <Checkbox
                            checked={this.state.allProjects}
                            label={'Seleccionar Todos'}
                            handleCheckboxChange={(e, value) => this.checkAllProjects(value)}
                            key={'project'}
                            disabled={this.state.waitingData}
                        />
                        </div>
                        <ul className='menu-list'>
                          {this.state.projects &&
                          this.state.projects.map((item) => {
                            if (item.activeDataset) {
                              if (!item.selected) {
                                item.selected = false
                              }
                              return (
                                <li key={item.uuid}>
                                  <a>
                                    <Checkbox
                                      checked={item.selected}
                                      label={item.name}
                                      handleCheckboxChange={(e, value) => this.selectProject(e, value, item)}
                                      key={item.uuid}
                                      disabled={this.state.waitingData}                                      
                                    />

                                    <span className='icon is-pulled-right' onClick={() => { this.moveTo('/projects/' + item.uuid) }}>
                                      <i className={this.currentRole === 'consultor' ? 'fa fa-eye has-text-info' : 'fa fa-edit has-text-info'}/>
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
                        <li className='filters-item'>
                          <div className={this.state.yearsCollapsed ? 'collapsable-title' : 'collapsable-title active'}
                            onClick={() => { this.showFilter('years') }}>
                            <a>
                              <span className='icon'>
                                <i className={this.state.yearsCollapsed
                                  ? 'fa fa-plus' : 'fa fa-minus'} />
                              </span>
                              Año <strong>{this.state.years && this.state.years.length}</strong>
                            </a>
                          </div>
                          <aside className={this.state.yearsCollapsed
                            ? 'is-hidden' : 'menu'} disabled={this.state.waitingData}>
                            
                            <ul className='menu-list'>
                              {this.state.years &&
                                this.state.years.map((item) => {
                                  return (
                                    <li key={item}>
                                      <a>
                                        <Checkbox
                                          label={item}
                                          handleCheckboxChange={(e, value) => this.selectYear(item, value)}
                                          key={item}
                                          checked={item === this.state.yearSelected}
                                          disabled={this.state.waitingData}                                          
                                        />
                                      </a>
                                    </li>
                                  )
                                })
                              }
                            </ul>
                          </aside>
                        </li>

                        <li className='filters-item'>
                          <div className={this.state.channelsCollapsed ? 'collapsable-title' : 'collapsable-title active'}
                            onClick={() => { this.showFilter('channels') }}>
                            <a>
                              <span className='icon'>
                                <i className={this.state.channelsCollapsed
                                ? 'fa fa-plus' : 'fa fa-minus'} />
                              </span>
                            Canales <strong>{this.state.channels && this.state.channels.length}</strong>
                            </a>
                          </div>
                          <aside className={this.state.channelsCollapsed
                          ? 'is-hidden' : 'menu'} disabled={this.state.waitingData}>
                            <div>
                              <Checkbox
                                checked={this.state.allChannels}
                                label={'Seleccionar Todos'}
                                handleCheckboxChange={(e, value) => {
                                  this.checkAllChannels(value)
                                  this.getGraph()
                                  this.getProductTable()
                                }}
                                key={'channel'}
                                disabled={this.state.waitingData}                                
                            />
                            </div>
                            <ul className='menu-list'>
                              {this.state.channels &&
                              this.state.channels.map((item) => {
                                if (!item.selected){
                                  item.selected = false
                                }
                                return (
                                  <li key={item.uuid}>
                                    <a>
                                      <Checkbox
                                        label={item.name === 'Not identified' ? item.externalId + ' (No identificado)' : item.name}
                                        handleCheckboxChange={(e, value) => this.selectChannel(e, value, item)}
                                        key={item.uuid}
                                        checked={item.selected}
                                        disabled={this.state.waitingData}                                        
                                      />
                                      {item.name === 'Not identified' &&
                                        <span className='icon is-pulled-right' onClick={() => { this.moveTo('/catalogs/channels/' + item.uuid) }}>
                                        <i className={this.currentRole === 'consultor' ? 'fa fa-eye has-text-info' : 'fa fa-edit has-text-info'} />
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

                        <li className='filters-item'>
                          <div className={this.state.salesCentersCollapsed ? 'collapsable-title' : 'collapsable-title active'}
                            onClick={() => { this.showFilter('salesCenters') }}>
                            <a>
                              <span className='icon'>
                                <i className={this.state.salesCentersCollapsed
                                ? 'fa fa-plus' : 'fa fa-minus'} />
                              </span>
                            Centros de Venta <strong>{this.state.salesCenters && this.state.salesCenters.length}</strong>
                            </a>
                          </div>
                          <aside className={this.state.salesCentersCollapsed
                          ? 'is-hidden' : 'menu'} disabled={this.state.waitingData}>
                            <div>
                              <Checkbox
                                checked={this.state.allSalesCenters}
                                label={'Seleccionar Todos'}
                                handleCheckboxChange={(e, value) => {
                                  this.checkAllSC(value)
                                  this.getGraph()
                                  this.getProductTable()
                                }}
                                key={'salesCenter'}
                                disabled={this.state.waitingData}                                
                            />
                            </div>
                            <ul className='menu-list'>
                              {this.state.salesCenters &&
                              this.state.salesCenters.map((item) => {
                                if (!item.selected) {
                                  item.selected = false
                                }
                                return (
                                  <li key={item.uuid}>
                                    <a>
                                      <Checkbox
                                        label={item.name === 'Not identified' ? item.externalId + ' (No identificado)' : item.name}
                                        handleCheckboxChange={(e, value) => this.selectSalesCenter(e, value, item)}
                                        key={item.uuid}
                                        checked={item.selected}
                                        disabled={this.state.waitingData}                                        
                                      />
                                      {item.name === 'Not identified' &&
                                        <span className='icon is-pulled-right' onClick={() => { this.moveTo('/catalogs/salesCenters/' + item.uuid) }}>
                                          <i className={this.currentRole === 'consultor' ? 'fa fa-eye has-text-info' : 'fa fa-edit has-text-info'} />
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

                        {/* <li className='filters-item'>
                          <div className={this.state.productsCollapsed ? 'collapsable-title' : 'collapsable-title active'}
                            onClick={() => { this.showFilter('products') }}>
                            <a>
                              <span className='icon'>
                                <i className={this.state.productsCollapsed
                                ? 'fa fa-plus' : 'fa fa-minus'} />
                              </span>
                            Productos <strong>{this.state.products && this.state.products.length}</strong>
                            </a>
                          </div>
                          <aside className={this.state.productsCollapsed
                          ? 'is-hidden' : 'menu'}>
                            <div>
                              <Checkbox
                                checked={this.state.allProducts}
                                label={'Seleccionar Todos'}
                                handleCheckboxChange={(e, value) => {
                                  this.checkAllProducts(value)
                                  this.getGraph()
                                  this.getProductTable()
                                  this.setState({
                                    reloadGraph: false
                                  })
                                }}
                                key={'product'}
                                disabled={this.state.waitingData}
                            />
                            </div>
                            <ul className='menu-list'>
                              {this.state.products &&
                              this.state.products.map((item) => {
                                if (!item.selected){
                                  item.selected = false
                                }
                                return (
                                  <li key={item.uuid}>
                                    <a>
                                      <Checkbox
                                        label={item.name === 'Not identified' ? item.externalId + ' (No identificado)' : item.name}
                                        handleCheckboxChange={(e, value) => this.selectProduct(e, value, item)}
                                        key={item.uuid}
                                        checked={item.selected}
                                        disabled={this.state.waitingData}
                                      />
                                      {item.name === 'Not identified' &&
                                        <span className='icon is-pulled-right' onClick={() => { this.moveTo('/catalogs/products/' + item.uuid) }}>
                                          <i className={this.currentRole === 'consultor' ? 'fa fa-eye has-text-info' : 'fa fa-edit has-text-info'} />
                                        </span>
                                      }
                                    </a>
                                  </li>
                                )
                              })
                            }
                            </ul>
                          </aside>
                        </li> */}

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
                    
                    <p className='indicators-title'>Venta anterior</p>
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
                            ]}
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
                                  content: 'Periodo actual',
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
                </div>

                <div className='level-right'>
                 
                  {this.state.yearSelected &&
                    <div className='level-item'>
                    <div className='field'>
                      <label className='label'>Periodo inicial</label>
                      <div className='field is-grouped control'>

                      <div className='dropdown is-hoverable'>
                        <div className='dropdown-trigger'>
                          <button className='button is-static is-capitalized' aria-haspopup='true' aria-controls='dropdown-menu4'>
                            <span>{this.getPeriodDate(this.state.minPeriod, true) + ' ' + this.state.yearSelected}</span>
                            <span className='icon is-small'>
                              <i className='fa fa-angle-down' aria-hidden='true'></i>
                            </span>
                          </button>
                        </div>
                        <div className='dropdown-menu' id='dropdown-menu4' role='menu'>
                          <div className='dropdown-content'>
                            {this.state.periods && this.state.periods.map((item) => {
                              return (
                                <a key={item.number} className={this.state.minPeriod === item.number ? 'dropdown-item is-capitalized is-active' : 'dropdown-item is-capitalized'}
                                  onClick={() => this.setMinPeriod(item.number)}>
                                  {item.name + ' ' + this.state.yearSelected}
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
                  {this.state.yearSelected &&
                    <div className='level-item date-drop'>
                      <span className='icon'>
                        <i className='fa fa-minus' />
                      </span>
                    </div>
                  }
                  {this.state.yearSelected &&
                    <div className='level-item'>
                    <div className='field'>
                      <label className='label'>Periodo final</label>
                      <div className='field is-grouped control'>

                      <div className='dropdown is-hoverable'>
                        <div className='dropdown-trigger'>
                          <button className='button is-static is-capitalized' aria-haspopup='true' aria-controls='dropdown-menu4'>
                            <span>{this.getPeriodDate(this.state.maxPeriod, true) + ' ' + this.state.yearSelected}</span>
                            <span className='icon is-small'>
                              <i className='fa fa-angle-down' aria-hidden='true'></i>
                            </span>
                          </button>
                        </div>
                        <div className='dropdown-menu' id='dropdown-menu4' role='menu'>
                          <div className='dropdown-content'>
                            {this.state.periods && this.state.periods.map((item) => {
                              return (
                                <a key={item.number} className={this.state.maxPeriod === item.number ? 'dropdown-item is-capitalized is-active' : 'dropdown-item is-capitalized'}
                                  onClick={() => this.setMaxPeriod(item.number)}>
                                  {item.name + ' ' + this.state.yearSelected}
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

Dashboard.contextTypes = {
  tree: PropTypes.baobab
}

const branchedDashboard = branch({forecasts: 'forecasts'}, Dashboard)

export default Page({
  path: '/dashboard',
  title: 'Dashboard',
  icon: 'github',
  exact: true,
  validate: loggedIn,
  component: branchedDashboard
})
