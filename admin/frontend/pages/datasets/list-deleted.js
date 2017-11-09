import React, { Component } from 'react'
import { branch } from 'baobab-react/higher-order'
import PropTypes from 'baobab-react/prop-types'
import Link from '~base/router/link'
import api from '~base/api'

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
        'title': 'Name',
        'property': 'name',
        'default': 'N/A'
      },
      {
        'title': 'Status',
        'property': 'status',
        'default': 'new'
      },
      {
        'title': 'Organization',
        'property': 'organization',
        'default': '',
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
        'title': 'Actions',
        formatter: (row) => {
          return (
            <button className='button' onClick={e => { this.restoreOnClick(row.uuid) }}>
              Restore
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
            <h1 className='is-size-3 is-padding-top-small is-padding-bottom-small'>Deleted datasets</h1>
            <div className='card'>
              <header className='card-header'>
                <p className='card-header-title'>
                  Deleted datasets
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

export default branch({deletedDatasets: 'deletedDatasets'}, DeletedDataSets)

// export default DataSets;
