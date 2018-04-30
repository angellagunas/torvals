import React, { Component } from 'react'
import { BranchedPaginatedTable } from '~base/components/base-paginated-table'
import Link from '~base/router/link'
import moment from 'moment'

class DashAnalyst extends Component {

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

      <div>
        <div className='columns is-marginless'>
          <div className='column is-paddingless'>
            <div className='section-header'>
              <h2>Proyectos</h2>
            </div>
          </div>
        </div>
        <div className='section'>
          <div className='columns has-20-margin-top'>
            <div className='column is-3 is-2-fullhd' onClick={() => this.moveTo('/salesCenters')}>
              <div className='card has-text-centered dash-card'>
                <header className='card-header'>
                  <p className='card-header-title no-flex is-size-5-touch is-size-4-desktop has-text-white'>
                    <i className='fa fa-credit-card-alt' />
                  </p>
                </header>
                <div className='card-content'>
                  <div className='content'>
                    <p className='is-size-3-touch is-size-1-desktop'>{this.props.dashboard.salesCenterCount || 0}</p>
                    <p className='is-size-6-touch is-size-5-desktop'>Centros de Venta</p>
                  </div>
                </div>
              </div>
            </div>

            <div className='column is-3 is-2-fullhd' onClick={() => this.moveTo('/products')}>
              <div className='card has-text-centered dash-card'>
                <header className='card-header'>
                  <p className='card-header-title no-flex is-size-5-touch is-size-4-desktop has-text-white'>
                    <i className='fa fa-dropbox' />
                  </p>
                </header>
                <div className='card-content'>
                  <div className='content'>
                    <p className='is-size-3-touch is-size-1-desktop'>{this.props.dashboard.productCount || 0}</p>
                    <p className='is-size-6-touch is-size-5-desktop'>Productos</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
        <div className='card has-20-margin-top'>
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

export default DashAnalyst
