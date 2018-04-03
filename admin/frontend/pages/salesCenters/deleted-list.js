import React, { Component } from 'react'
import { branch } from 'baobab-react/higher-order'
import PropTypes from 'baobab-react/prop-types'
import moment from 'moment'
import api from '~base/api'

import Page from '~base/page'
import {loggedIn} from '~base/middlewares/'
import { BranchedPaginatedTable } from '~base/components/base-paginated-table'
import Breadcrumb from '~base/components/base-breadcrumb'

class DeletedSalesCenters extends Component {
  componentWillMount () {
    this.context.tree.set('deletedSalesCenters', {
      page: 1,
      totalItems: 0,
      items: [],
      pageLength: 10
    })
    this.context.tree.commit()
  }

  getColumns () {
    return [
      {
        'title': 'Nombre',
        'property': 'name',
        'default': 'N/A',
        'sortable': true
      },
      {
        'title': 'Organización',
        'property': 'organization',
        'default': '',
        'sortable': true,
        formatter: (row) => {
          if (!row.organization) { return }

          return row.organization.name
        }
      },
      {
        'title': 'Creado',
        'property': 'dateCreated',
        'default': 'N/A',
        'sortable': true,
        formatter: (row) => {
          return (
            moment.utc(row.dateCreated).local().format('DD/MM/YYYY hh:mm a')
          )
        }
      },
      {
        'title': 'Acciones',
        formatter: (row) => {
          return (
            <button className='button' onClick={e => { this.restoreOnClick(row.uuid) }}>
              Restaurar
            </button>
          )
        }
      }
    ]
  }

  async restoreOnClick (uuid) {
    var url = '/admin/salesCenters/restore/' + uuid
    await api.post(url)

    this.props.history.push('/admin/catalogs/salesCenters/detail/' + uuid)
  }

  render () {
    return (
      <div className='columns c-flex-1 is-marginless'>
        <div className='column is-paddingless'>
          <div className='section is-paddingless-top pad-sides'>
            <Breadcrumb
              path={[
                {
                  path: '/admin',
                  label: 'Inicio',
                  current: false
                },
                {
                  path: '/admin/catalogs/salesCenters',
                  label: 'Centros de venta eliminados',
                  current: true
                }
              ]}
              align='left'
            />
            <h1 className='is-size-3 is-padding-top-small is-padding-bottom-small'>Eliminados</h1>
            <div className='card'>
              <div className='card-content'>
                <div className='columns'>
                  <div className='column'>
                    <BranchedPaginatedTable
                      branchName='deletedprojects'
                      baseUrl='/admin/salesCenters/deleted'
                      columns={this.getColumns()}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

DeletedSalesCenters.contextTypes = {
  tree: PropTypes.baobab
}

const branchedDeletedSalesCenters = branch(
  {deletedSalesCenters: 'deletedSalesCenters'},
  DeletedSalesCenters
)

export default Page({
  path: '/catalogs/salesCenters/deleted',
  title: 'Centros de venta elim...',
  icon: 'trash',
  exact: true,
  validate: loggedIn,
  component: branchedDeletedSalesCenters
})
