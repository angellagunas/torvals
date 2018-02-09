import React, { Component } from 'react'
import { BranchedPaginatedTable } from '~base/components/base-paginatedTable'
import Link from '~base/router/link'
import moment from 'moment'

class DashOrgAdmin extends Component {

  moveTo(route) {
    this.props.history.push(route)
  }

  getColumns = () => {
    return [
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

  render() {
    return (
      <div className='section container'>
        <h2 className='is-size-4 is-padding-bottom-small has-text-color'>Organización</h2>
        <div className='columns'>

          <div className='column is-3' onClick={() => this.moveTo('/manage/users')}>
            <div className='card has-text-centered dash-card'>
              <header className='card-header'>
                <p className='card-header-title no-flex is-size-5-touch is-size-4-desktop has-text-white'>
                  <i className='fa fa-user' />
                  Usuarios
                </p>
              </header>
              <div className='card-content'>
                <div className='content'>
                  <p className='is-size-3-touch is-size-1-desktop'>{this.props.dashboard.usersCount || 0}</p>
                </div>
              </div>
            </div>
          </div>

          <div className='column is-3' onClick={() => this.moveTo('/manage/groups')}>
            <div className='card has-text-centered dash-card'>
              <header className='card-header'>
                <p className='card-header-title no-flex is-size-5-touch is-size-4-desktop has-text-white'>
                  <i className='fa fa-users' />
                  Grupos
                </p>
              </header>
              <div className='card-content'>
                <div className='content'>
                  <p className='is-size-3-touch is-size-1-desktop'>{this.props.dashboard.groupsCount || 0}</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        <h2 className='is-size-4 is-padding-bottom-small has-text-color'>Proyectos</h2>

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
