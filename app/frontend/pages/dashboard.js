import React, { Component } from 'react'
import { Redirect } from 'react-router-dom'
import { branch } from 'baobab-react/higher-order'
import PropTypes from 'baobab-react/prop-types'
import moment from 'moment'

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
      value: { min: 2, max: 10 }
    }
    this.selectedProjects = {}
    this.selectedSalesCenters = []
    this.selectedChannels = []
    this.selectedProducts = []
  }

  componentWillMount () {
    this.load()
    this.getProjects()
  }

  async load () {
    var url = '/app/dashboard/'
    const body = await api.get(url)

    this.setState({
      dashboard: body,
      loading: false
    })
  }

  async getProjects () {
    let url = '/app/projects'

    let res = await api.get(url)

    let activeProjects = res.data.filter(item => { return item.activeDataset })

    this.setState({
      projects: activeProjects
    })
  }

  checkAll (e, value) {
    let aux = this.state.projects
    for (const project of aux) {
      project.selected = value
      if (value) { this.selectedProjects[project.uuid] = project } else { delete this.selectedProjects[project.uuid] }
    }
    this.setState({
      projects: aux
    })

    if (value) { this.getAll() }
  }

  async selectProject (e, value, project) {
    console.log(project)
    if (value) {
      this.selectedProjects[project.uuid] = project.activeDataset._id
    } else {
      delete this.selectedProjects[project.uuid]
      this.setState({
        filters: undefined,
        salesCenters: undefined,
        channels: undefined,
        products: undefined
      })
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
    let url = '/app/dashboard/projects'
    let res = await api.post(url, Object.values(this.selectedProjects))

    this.setState({
      filters: res,
      salesCenters: res.salesCenters,
      channels: res.channels,
      products: res.products
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
        'property': 'externalId',
        'default': 'N/A',
        'sortable': true
      },
      {
        'title': 'Producto',
        'property': 'name',
        'default': 'N/A',
        'sortable': true
      },
      {
        'title': 'Fecha',
        'property': 'dateCreated',
        'default': 'N/A',
        'sortable': true,
        formatter: (row) => {
          return moment.utc(row.dateCreated).local().format('DD/MM/YYYY hh:mm a')
        }
      }
    ]

    return cols
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

    const graphData = [
      {
        label: 'Predicción',
        color: '#187FE6',
        data: this.state.products ? this.state.products.map((item, key) => { return Number(item.externalId) }) : []
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
                            checked={false}
                            label={'Seleccionar Todos'}
                            handleCheckboxChange={(e, value) => this.checkAll(e, value)}
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

                                    <span className='icon is-pulled-right '>
                                      <Link to={'/projects/' + item.uuid}>
                                        <i className='fa fa-eye has-text-info' />
                                      </Link>

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
                                checked={false}
                                label={'Seleccionar Todos'}
                                handleCheckboxChange={(e, value) => this.checkAll(e, value)}
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
                                checked={false}
                                label={'Seleccionar Todos'}
                                handleCheckboxChange={(e, value) => this.checkAll(e, value)}
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
                                checked={false}
                                label={'Seleccionar Todos'}
                                handleCheckboxChange={(e, value) => this.checkAll(e, value)}
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
                    <h1 className='title is-2'>6.86%</h1>
                    <h2 className='subtitle has-text-weight-bold'>MAPE PREDICCIÓN</h2>
                  </div>
                  <div>
                    <p className='subtitle is-6'>Venta total</p>
                    <p className='title is-5 has-text-success'>$1,156,202.94</p>

                    <p className='subtitle is-6'>Ajuste total</p>
                    <p className='title is-5 has-text-teal'>$1,156,202.94</p>

                    <p className='subtitle is-6'>Predicción total</p>
                    <p className='title is-5 has-text-info'>$1,156,202.94</p>
                  </div>
                </div>
                <div className='column card'>
                  {this.state.products &&
                  <Graph
                    data={graphData}
                    labels={this.state.products.map((item, key) => { return 'Semana ' + item.externalId })}
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
                    <span class='button is-static has-20-margin-top'>Marzo 2018</span>
                  </div>
                  <div className='level-item'>
                    <span className='icon has-20-margin-top'>
                      <i className='fa fa-minus' />
                    </span>
                  </div>
                  <div className='level-item'>
                    <span class='button is-static has-20-margin-top'>Mayo 2018</span>
                  </div>
                </div>
              </div>

              { !this.state.products
              ? <section className='section'>
                <center>
                  <h2 className='has-text-info'>No hay productos que mostrar</h2>
                </center>
              </section>
            : <BaseTable
              className='aprobe-table is-fullwidth'
              data={this.state.products}
              columns={this.getColumns()}
            />
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
