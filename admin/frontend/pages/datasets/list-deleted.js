import React, { Component } from 'react'
import { branch } from 'baobab-react/higher-order'
import PropTypes from 'baobab-react/prop-types'
import Link from '~base/router/link'
import api from '~base/api'

import Page from '~base/page'
import {loggedIn} from '~base/middlewares/'
import { BranchedPaginatedTable } from '~base/components/base-paginatedTable'

class DeletedDataSets extends Component {
  constructor (props) {
    super(props)
    this.state = {
      className: ''
    }
  }

  componentWillMount () {
    this.context.tree.set('deletedDatasets', {
      page: 1,
      totalItems: 0,
      items: [],
      pageLength: 10
    })
    this.context.tree.commit()
  }

  async restoreOnClick (uuid) {
    var url = '/admin/datasets/deleted/' + uuid
    await api.post(url)
    this.props.history.push('/admin/datasets/detail/' + uuid)
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
        'title': 'Status',
        'property': 'status',
        'default': 'new',
        'sortable': true
      },
      {
        'title': 'Organización',
        'property': 'organization',
        'default': '',
        'sortable': true,
        formatter: (row) => {
          if (!row.organization) { return }

          return (
            <Link to={'/manage/organizations/' + row.organization.uuid}>
              {row.organization.name}
            </Link>

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

  render () {
    return (
      <div className='columns c-flex-1 is-marginless'>
        <div className='column is-paddingless'>
          <div className='section is-paddingless-top'>
            <h1 className='is-size-3 is-padding-top-small is-padding-bottom-small'>Datasets eliminados</h1>
            <div className='card'>
              <header className='card-header'>
                <p className='card-header-title'>
                  Datasets eliminados
                </p>
              </header>
              <div className='card-content'>
                <div className='columns'>
                  <div className='column'>
                    <BranchedPaginatedTable
                      branchName='deletedDatasets'
                      baseUrl='/admin/datasets/deleted'
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

DeletedDataSets.contextTypes = {
  tree: PropTypes.baobab
}

const branchedDeletedDataSets = branch({deletedDatasets: 'deletedDatasets'}, DeletedDataSets)

export default Page({
  path: '/datasets/deleted',
  title: 'Datasets eliminados',
  icon: 'trash',
  exact: true,
  validate: loggedIn,
  component: branchedDeletedDataSets
})
