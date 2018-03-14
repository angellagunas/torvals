import React, { Component } from 'react'
import { branch } from 'baobab-react/higher-order'
import PropTypes from 'baobab-react/prop-types'
import moment from 'moment'
import api from '~base/api'

import Page from '~base/page'
import {loggedIn} from '~base/middlewares/'
import { BranchedPaginatedTable } from '~base/components/base-paginatedTable'
import Breadcrumb from '~base/components/base-breadcrumb'

class DeletedPrices extends Component {
  constructor (props) {
    super(props)
  }

  componentWillMount () {
    this.context.tree.set('deletedPrices', {
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
        'title': 'ID',
        'property': 'product.externaId',
        'default': 'N/A',
        'sortable': true,
        formatter: (row) => {
          if (row.product) {
            return row.product.externalId
          }

          return 'N/A'
        }
      },
      {
        'title': 'Producto',
        'property': 'product',
        'default': 'N/A',
        'sortable': true,
        formatter: (row) => {
          if (row.product && row.product.name) {
            return row.product.name
          }

          return 'N/A'
        }
      },
      {
        'title': 'Canal',
        'property': 'channel',
        'default': 'N/A',
        'sortable': true,
        formatter: (row) => {
          if (row.channel && row.channel.name) {
            return row.channel.name
          }

          return 'N/A'
        }
      },
      {
        'title': 'Precio',
        'property': 'price',
        'default': 'N/A',
        'sortable': true
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
    var url = '/admin/prices/restore/' + uuid
    const price = await api.post(url)

    this.props.history.push('/admin/prices/' + uuid)
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
                  label: 'Dashboard',
                  current: false
                },
                {
                  path: '/admin/prices/deleted',
                  label: 'Precios eliminados',
                  current: true
                }
              ]}
              align='left'
            />
            <h1 className='is-size-3 is-padding-top-small is-padding-bottom-small'>Precios Eliminados</h1>
            <div className='card'>
              <div className='card-content'>
                <div className='columns'>
                  <div className='column'>
                    <BranchedPaginatedTable
                      branchName='deletedprices'
                      baseUrl='/admin/prices/deleted'
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

DeletedPrices.contextTypes = {
  tree: PropTypes.baobab
}

const branchedDeletedPrices = branch({deletedprices: 'deletedprices'}, DeletedPrices)

export default Page({
  path: '/prices/deleted',
  title: 'Eliminados',
  icon: 'trash',
  exact: true,
  validate: loggedIn,
  component: branchedDeletedPrices
})
