import React, { Component } from 'react'
import { Redirect } from 'react-router-dom'
import { branch } from 'baobab-react/higher-order'
import PropTypes from 'baobab-react/prop-types'
import Link from '~base/router/link'
import api from '~base/api'
import Loader from '~base/components/spinner'
import Page from '~base/page'
import {loggedIn} from '~base/middlewares/'

import Checkbox from '~base/components/base-checkbox'

class Dashboard extends Component {
  constructor (props) {
    super(props)
    this.state = {
      loading: true
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

  checkAll () {
    let aux = this.state.projects
    for (const project of aux) {
      project.selected = true
      this.selectedProjects[project.uuid] = project
    }
    this.setState({
      projects: aux
    })

    this.getAll()
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

    return (
      <div className='section'>

        <div className='filters-project section columns'>
          <aside className='menu column is-narrow'>
            <p className='menu-label'>
              Proyectos <strong>{this.state.projects && this.state.projects.length}</strong>
            </p>
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
                        </a>
                      </li>
                    )
                  }
                })
              }
            </ul>
          </aside>
          <aside className='menu column is-narrow'>
            <p className='menu-label'>
              Centros de Venta <strong>{this.state.salesCenters && this.state.salesCenters.length}</strong>
            </p>
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
          <aside className='menu column is-narrow'>
            <p className='menu-label'>
              Canales <strong>{this.state.channels && this.state.channels.length}</strong>
            </p>
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
          <aside className='menu column is-narrow'>
            <p className='menu-label'>
              Productos <strong>{this.state.products && this.state.products.length}</strong>
            </p>
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
