import React, { Component } from 'react'
import { branch } from 'baobab-react/higher-order'
import PropTypes from 'baobab-react/prop-types'
import api from '~base/api'
import Page from '~base/page'
import { loggedIn } from '~base/middlewares/'
import { BranchedPaginatedTable } from '~base/components/base-paginatedTable'

class DeletedChannels extends Component {
  componentWillMount () {
    this.context.tree.set('deletedChannels', {
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
        'default': 'N/A',
        'sortable': true,
        formatter: (row) => {
          return (
            <div>
              {row.organization.name}
            </div>
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
    var url = '/admin/channels/restore/' + uuid
    await api.post(url)

    this.props.history.push('/admin/channels/detail/' + uuid)
  }

  render () {
    return (
      <div className='columns c-flex-1 is-marginless'>
        <div className='column is-paddingless'>
          <div className='section is-paddingless-top'>
            <h1 className='is-size-3 is-padding-top-small is-padding-bottom-small'>Canales</h1>
            <div className='card'>
              <div className='card-content'>
                <div className='columns'>
                  <div className='column'>
                    <BranchedPaginatedTable
                      branchName='deletedChannels'
                      baseUrl='/admin/channels/deleted'
                      columns={this.getColumns()} />
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

DeletedChannels.contextTypes = {
  tree: PropTypes.baobab
}

const branchedDeletedChannels = branch({deletedchannels: 'deletedchannels'}, DeletedChannels)

export default Page({
  path: '/channels/deleted',
  title: 'Deleted channels',
  icon: 'trash',
  exact: true,
  validate: loggedIn,
  component: branchedDeletedChannels
})
