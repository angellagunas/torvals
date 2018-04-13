import React, { Component } from 'react'
import { BranchedPaginatedTable } from '~base/components/base-paginated-table'
import Link from '~base/router/link'
import moment from 'moment'

class DashEntManager extends Component {

  moveTo (route) {
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

  render () {
    return (
      <div className='section container'>

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

export default DashEntManager
