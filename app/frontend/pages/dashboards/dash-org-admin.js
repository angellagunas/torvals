import React, { Component } from 'react'
import { BranchedPaginatedTable } from '~base/components/base-paginated-table'
import Link from '~base/router/link'
import moment from 'moment'
import api from '~base/api'
import Checkbox from '~base/components/base-checkbox'

class DashOrgAdmin extends Component {
  constructor(props){
    super(props)

    this.state = {}

    this.selectedProjects = {}
    this.selectedSalesCenters = []
    this.selectedChannels = []
    this.selectedProducts = []
  }
  moveTo(route) {
    this.props.history.push(route)
  }

  getColumns = () => {
    return [
      {
        'title': 'Nombre',
        'property': 'name',
        'default': 'N/A',
        'sortable': true,
        formatter: (row) => {
          return (
            <Link to={'/projects/' + row.uuid}>
              {row.name}
            </Link>
          )
        }
      },
      {
        'title': 'ID',
        'property': 'uuid',
        'default': 'N/A',
        'sortable': true,
        formatter: (row) => {
          return (
            <Link to={'/projects/' + row.uuid}>
              {row.uuid}
            </Link>
          )
        }
      },
      {
        'title': 'Fecha de Creación',
        'property': 'dateCreated',
        'default': 'N/A',
        'sortable': true,
        formatter: (row) => {
          return (
            moment.utc(row.dateCreated).local().format('DD/MM/YYYY hh:mm a')
          )
        }
      }
    ]
  }

  async getProjects(){
    let url = '/app/projects'

    let res = await api.get(url)

    this.setState({
      projects: res.data
    })

  }

  componentWillMount(){
    this.getProjects()
  }

  selectProject(e, value, project){
    console.log(e, value)
    if(value){
      this.selectedProjects[project.uuid] = project
    }
    else{
      delete this.selectedProjects[project.uuid]; 
      this.setState({
        filters: undefined,
        salesCenters: undefined,
        channels: undefined,
        products: undefined
      })
    }
    
    for (const key in this.selectedProjects) {
      console.log(this.selectedProjects[key])
      this.getAll(this.selectedProjects[key])
    }
  }

  selectSalesCenter(e, value, project) {
    console.log(e, value)
    if (value) {
      this.selectedSalesCenters[project.uuid] = project.uuid
    }
    else {
      delete this.selectedSalesCenters[project.uuid];
    }
  }

  selectChannel(e, value, project) {
    console.log(e, value)
    if (value) {
      this.selectedChannels[project.uuid] = project.uuid
    }
    else {
      delete this.selectedChannels[project.uuid];
    }
  }

  selectProduct(e, value, project) {
    console.log(e, value)
    if (value) {
      this.selectedProducts[project.uuid] = project.uuid
    }
    else {
      delete this.selectedProducts[project.uuid];
    }
  }

  async getAll (project) {
    let url = '/app/rows/filters/dataset/' + project.activeDataset.uuid 
    let res = await api.get(url, {
      start: 0,
      limit: 0
    })
    console.log(res)
    this.setState({
      filters: res,
      salesCenters: res.salesCenters,
      channels: res.channels,
      products: res.products
    })
  }

  render() {
    return (
      <div>
      <div className='filters-project section'>
          <aside className='menu'>
            <p className='menu-label'>
              Proyectos
            </p>
            <ul className='menu-list'>
            {this.state.projects &&
              this.state.projects.map((item) => {
                if(item.activeDataset){
                return (
                  <li key={item.uuid}>
                    <a>
                      <Checkbox
                        label={item.name}
                        handleCheckboxChange={(e, value) => this.selectProject(e,value,item)}
                        key={item.uuid}
                       />
                    </a>
                  </li>
                )
              }
              })
            }
            </ul>
            <p className='menu-label'>
              Centros de Venta
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
            <p className='menu-label'>
              Canales
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
            <p className='menu-label'>
              Productos
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

      <div className='columns is-marginless'>
        <div className='column is-paddingless'>
          <div className='section-header'>
            <h2>Organización</h2>
          </div>
        </div>
        </div>
        <div className='section'>
          <div className='columns has-20-margin-top'>
          <div className='column is-3 is-2-fullhd' onClick={() => this.moveTo('/manage/users')}>
            <div className='card has-text-centered dash-card'>
              <header className='card-header'>
                <p className='card-header-title no-flex is-size-5-touch is-size-4-desktop has-text-white'>
                  <i className='fa fa-user' />
                </p>
              </header>
              <div className='card-content'>
                <div className='content'>
                  <p className='is-size-3-touch is-size-1-desktop'>{this.props.dashboard.usersCount || 0}</p>
                  <p className='is-size-6-touch is-size-5-desktop'>Usuarios</p>
                </div>
              </div>
            </div>
          </div>

          <div className='column is-3 is-2-fullhd' onClick={() => this.moveTo('/manage/groups')}>
            <div className='card has-text-centered dash-card'>
              <header className='card-header'>
                <p className='card-header-title no-flex is-size-5-touch is-size-4-desktop has-text-white'>
                  <i className='fa fa-users' />
                </p>
              </header>
              <div className='card-content'>
                <div className='content'>
                  <p className='is-size-3-touch is-size-1-desktop'>{this.props.dashboard.groupsCount || 0}</p>
                  <p className='is-size-6-touch is-size-5-desktop'>Grupos</p>
                </div>
              </div>
            </div>
          </div>

        </div>

          <h2 className='h2'>Proyectos</h2>
        </div>
        <div className='card'>
              <BranchedPaginatedTable
                branchName='projects'
                baseUrl='/app/projects'
                columns={this.getColumns()}
                sortedBy={'name'}
              />

        </div>
        
      </div>

    )
  }
}

export default DashOrgAdmin
