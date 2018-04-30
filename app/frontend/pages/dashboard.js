import React, { Component } from 'react'
import { Redirect } from 'react-router-dom'
import { branch } from 'baobab-react/higher-order'
import PropTypes from 'baobab-react/prop-types'
import moment from 'moment'
import _ from 'lodash'
import Link from '~base/router/link'
import api from '~base/api'
import Loader from '~base/components/spinner'
import Page from '~base/page'
import {loggedIn} from '~base/middlewares/'
import Graph from './projects/detail-tabs/graph'
import { BaseTable } from '~base/components/base-table'
import InputRange from 'react-input-range'
import 'react-input-range/lib/css/index.css'
import Checkbox from '~base/components/base-checkbox'

class Dashboard extends Component {
  constructor (props) {
    super(props)
    this.state = {
      loading: true,
      salesCentersCollapsed: true,
      channelsCollapsed: true,
      productsCollapsed: true,
      value: { min: 2, max: 10 },
      allProjects: false,
      allChannels: false,
      allSalesCenters: false,
      allProducts: false,
      totalAdjustment: 0,
      totalPrediction: 0,
      totalSale: 0,
      mape: 0,
      searchTerm: ''
    }
    this.selectedProjects = {}
    this.selectedSalesCenters = []
    this.selectedChannels = []
    this.selectedProducts = []
  }

  componentWillMount () {
    this.getProjects()
  }

  moveTo (route) {
    this.props.history.push(route)
  }

  clear () {
    this.setState({
      filters: undefined,
      salesCenters: undefined,
      channels: undefined,
      products: undefined,
      graphData: undefined
    })
  }

  async getProjects () {
    let url = '/app/projects'

    let res = await api.get(url)

    let activeProjects = res.data.filter(item => { return item.activeDataset })

    this.setState({
      projects: activeProjects,
      loading: false
    }, () => { this.checkAllProjects(true) })
  }

  checkAllProjects (value) {
    let aux = this.state.projects
    for (const project of aux) {
      project.selected = value
      if (value) { this.selectedProjects[project.uuid] = project.activeDataset._id } else { delete this.selectedProjects[project.uuid] }
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

  checkAllSC (value) {
    let aux = this.state.salesCenters
    for (const sc of aux) {
      sc.selected = value

      if (value) { this.selectedSalesCenters[sc.uuid] = sc.externalId } else { delete this.selectedSalesCenters[sc.uuid] }
    }
    this.setState({
      salesCenters: aux,
      allSalesCenters: value
    })
  }

  checkAllChannels (value) {
    let aux = this.state.channels
    for (const c of aux) {
      c.selected = value

      if (value) { this.selectedChannels[c.uuid] = c.externalId } else { delete this.selectedChannels[c.uuid] }
    }
    this.setState({
      channels: aux,
      allChannels: value
    })
  }

  checkAllProducts (value) {
    let aux = this.state.products
    for (const p of aux) {
      p.selected = value

      if (value) { this.selectedProducts[p.uuid] = p.externalId } else { delete this.selectedProductsc[p.uuid] }
    }
    this.setState({
      products: aux,
      allProducts: value
    })
  }

  async selectProject (e, value, project) {
    if (value) {
      this.selectedProjects[project.uuid] = project.activeDataset._id
    } else {
      delete this.selectedProjects[project.uuid]
      this.clear()
    }
    this.getAll()
  }

  selectSalesCenter (e, value, project) {
    console.log(e, value)
    if (value) {
      this.selectedSalesCenters[project.uuid] = project.uuid
    } else {
      delete this.selectedSalesCenters[project.uuid]
    }
  }

  selectChannel (e, value, project) {
    console.log(e, value)
    if (value) {
      this.selectedChannels[project.uuid] = project.uuid
    } else {
      delete this.selectedChannels[project.uuid]
    }
  }

  selectProduct (e, value, project) {
    console.log(e, value)
    if (value) {
      this.selectedProducts[project.uuid] = project.uuid
    } else {
      delete this.selectedProducts[project.uuid]
    }
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
      reloadGraph: true
    }, () => {
      this.checkAllChannels(true)
      this.checkAllSC(true)
      this.checkAllProducts(true)
      this.getGraph()
      this.getProducts()
      this.setState({
        reloadGraph: false
      })
    })
  }

  async getGraph () {
    let url = '/app/dashboard/graphic/organizations'
    let res = await api.post(url, {
      date_start: moment().startOf('year').format('YYYY-MM-DD'),
      date_end: moment().endOf('year').format('YYYY-MM-DD')
    })
    console.log(res)

    let totalPSale = 0
    let totalSale = 0
    let totalPrediction = 0
    let totalAdjustment = 0
    let mape = 0

    /* res.data.map((item) => {
      totalAdjustment += item.adjustment
      totalPrediction += item.prediction
      totalSale += item.sale
    }) */

    res.prediction.map((item) => {
      totalPrediction += item.y
    })

    res.adjustment.map((item) => {
      totalAdjustment += item.y
    })

    res.previous_sale.map((item) => {
      totalPSale += item.y
    })

    res.sale.map((item) => {
      totalSale += item.y
    })

    mape = Math.abs(((totalSale - totalPrediction) / totalSale) * 100)

    if(mape === Infinity){
      mape = 0
    }

    this.setState({
      graphData: res,
      totalAdjustment,
      totalPrediction,
      totalSale,
      totalPSale,
      mape
    })
  }

  async getProducts () {
    let url = '/app/dashboard/comparation/organization'
    let res = await api.post(url, {
      date_start: moment().startOf('year').format('YYYY-MM-DD'),
      date_end: moment().endOf('year').format('YYYY-MM-DD')
    })
    console.log(res)
    this.setState({
      productTable: res
    }, () => {
      this.searchDatarows()
    })
  }

  showFilter (filter) {
    if (filter === 'salesCenters') {
      this.setState({
        salesCentersCollapsed: !this.state.salesCentersCollapsed,
        channelsCollapsed: true,
        productsCollapsed: true
      })
    } else if (filter === 'channels') {
      this.setState({
        salesCentersCollapsed: true,
        channelsCollapsed: !this.state.channelsCollapsed,
        productsCollapsed: true
      })
    } else if (filter === 'products') {
      this.setState({
        salesCentersCollapsed: true,
        channelsCollapsed: true,
        productsCollapsed: !this.state.productsCollapsed
      })
    }
  }

  getColumns () {
    let cols = [
      {
        'title': 'Id',
        'property': 'product',
        'default': 'N/A',
        'sortable': true
      },
      {
        'title': 'Producto',
        'property': 'product_name',
        'default': 'N/A',
        'sortable': true
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
        'property': 'previus_sale',
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
          let mape = Math.abs(((row.sale - row.prediction) / row.sale) * 100)

          if(mape === Infinity){
            return '0.00%'
          }
          else if (mape <= 7) {
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

    if (e === 'product') {
      if (this.state.sortAscending) {
        sorted.sort((a, b) => { return parseFloat(a[e]) - parseFloat(b[e]) })
      } else {
        sorted.sort((a, b) => { return parseFloat(b[e]) - parseFloat(a[e]) })
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
    })
  }

  async searchDatarows() {
    console.log(this.state.searchTerm, this.state.productTable)
    if (this.state.searchTerm === '') {
      this.setState({
        filteredData: this.state.productTable
      })

      return
    }

    const items = this.state.productTable.filter((item) => {
      const regEx = new RegExp(this.state.searchTerm, 'gi')
      const searchStr = `${item.product} ${item.product_name}`

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
        data: this.state.graphData ? this.state.graphData.prediction.map((item) => { return item.y }) : []
      },
      {
        label: 'Ajuste',
        color: '#30C6CC',
        data: this.state.graphData ? this.state.graphData.adjustment.map((item) => { return item.y }) : []
      },
      {
        label: 'Venta',
        color: '#0CB900',
        data: this.state.graphData ? this.state.graphData.sale.map((item) => { return item.y }) : []
      },
      {
        label: 'Venta Anterior',
        color: '#EF6950',
        data: this.state.graphData ? this.state.graphData.previous_sale.map((item) => { return item.y }) : []
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
                      <aside className='menu'>
                        <div>
                          <Checkbox
                            checked={this.state.allProjects}
                            label={'Seleccionar Todos'}
                            handleCheckboxChange={(e, value) => this.checkAllProjects(value)}
                            key={'project'}
                        />
                        </div>
                        <ul className='menu-list'>
                          {this.state.projects &&
                          this.state.projects.map((item) => {
                            if (item.activeDataset) {
                              return (
                                <li key={item.uuid}>
                                  <a>
                                    <Checkbox
                                      checked={item.selected}
                                      label={item.name}
                                      handleCheckboxChange={(e, value) => this.selectProject(e, value, item)}
                                      key={item.uuid}
                                    />

                                    <span className='icon is-pulled-right' onClick={() => { this.moveTo('/projects/' + item.uuid) }}>
                                      <i className='fa fa-eye has-text-info' />
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
                          ? 'is-hidden' : 'menu'}>
                            <div>
                              <Checkbox
                                checked={this.state.allChannels}
                                label={'Seleccionar Todos'}
                                handleCheckboxChange={(e, value) => this.checkAllChannels(value)}
                                key={'project'}
                            />
                            </div>
                            <ul className='menu-list'>
                              {this.state.channels &&
                              this.state.channels.map((item) => {
                                return (
                                  <li key={item.uuid}>
                                    <a>
                                      <Checkbox
                                        label={item.name}
                                        handleCheckboxChange={(e, value) => this.selectChannel(e, value, item)}
                                        key={item.uuid}
                                        checked={item.selected}
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
                          ? 'is-hidden' : 'menu'}>
                            <div>
                              <Checkbox
                                checked={this.state.allSalesCenters}
                                label={'Seleccionar Todos'}
                                handleCheckboxChange={(e, value) => this.checkAllSC(value)}
                                key={'project'}
                            />
                            </div>
                            <ul className='menu-list'>
                              {this.state.salesCenters &&
                              this.state.salesCenters.map((item) => {
                                return (
                                  <li key={item.uuid}>
                                    <a>
                                      <Checkbox
                                        label={item.name}
                                        handleCheckboxChange={(e, value) => this.selectSalesCenter(e, value, item)}
                                        key={item.uuid}
                                        checked={item.selected}
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
                                handleCheckboxChange={(e, value) => this.checkAllProducts(value)}
                                key={'project'}
                            />
                            </div>
                            <ul className='menu-list'>
                              {this.state.products &&
                              this.state.products.map((item) => {
                                return (
                                  <li key={item.uuid}>
                                    <a>
                                      <Checkbox
                                        label={item.name}
                                        handleCheckboxChange={(e, value) => this.selectProduct(e, value, item)}
                                        key={item.uuid}
                                        checked={item.selected}
                                      />
                                    </a>
                                  </li>
                                )
                              })
                            }
                            </ul>
                          </aside>
                        </li>

                      </ul>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            <div className='column dash-graph'>
              <div className='columns box'>
                <div className='column is-3 is-paddingless'>
                  <div className='notification is-info has-text-centered'>
                    <h1 className='title is-2'>{this.state.mape.toFixed(2)}%</h1>
                    <h2 className='subtitle has-text-weight-bold'>MAPE PREDICCIÓN</h2>
                  </div>
                  <div>
                    <p className='subtitle is-6'>Venta total</p>
                    <p className='title is-5 has-text-success'>{this.state.totalSale.toFixed().replace(/./g, (c, i, a) => {
                      return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
                    })}</p>

                    <p className='subtitle is-6'>Ajuste total</p>
                    <p className='title is-5 has-text-teal'>{this.state.totalAdjustment.toFixed().replace(/./g, (c, i, a) => {
                      return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
                    })}</p>

                    <p className='subtitle is-6'>Predicción total</p>
                    <p className='title is-5 has-text-info'>{this.state.totalPrediction.toFixed().replace(/./g, (c, i, a) => {
                      return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
                    })}</p>
                  </div>
                </div>
                <div className='column card'>
                  {this.state.graphData &&
                  <Graph
                    data={graph}
                    reloadGraph={this.state.reloadGraph}
                    legend={{
                      display: true,
                      position: 'top',
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
                    labels={this.state.graphData.prediction.map((item, key) => { return item.x })}
                    />
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
                  <div className='level-item range-slider'>
                    <InputRange
                      formatLabel={value => `Periodo ${value}`}
                      maxValue={12}
                      minValue={1}
                      value={this.state.value}
                      onChange={value => this.setState({ value })} />
                  </div>

                  <div className='level-item'>
                    <span className='button is-static has-20-margin-top'>Marzo 2018</span>
                  </div>
                  <div className='level-item'>
                    <span className='icon has-20-margin-top'>
                      <i className='fa fa-minus' />
                    </span>
                  </div>
                  <div className='level-item'>
                    <span className='button is-static has-20-margin-top'>Mayo 2018</span>
                  </div>
                </div>
              </div>

              { this.state.filteredData
              ? this.state.filteredData.length > 0
                  ? <BaseTable
                    className='dash-table is-fullwidth'
                    data={this.state.filteredData}
                    columns={this.getColumns()}
                    handleSort={(e) => { this.handleSort(e) }}
                  />
                  : <section className='section'>
                    <center>
                      <h2 className='has-text-info'>No hay productos que mostrar</h2>
                    </center>
                  </section>
              : <section className='section'>
                <center>
                  <h1 className='has-text-info'>Cargando productos</h1>
                  <Loader />
                </center>
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
