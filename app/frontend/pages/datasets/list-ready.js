import React, { Component } from 'react'
import { branch } from 'baobab-react/higher-order'
import PropTypes from 'baobab-react/prop-types'
import Link from '~base/router/link'

import Page from '~base/page'
import {loggedIn, verifyRole} from '~base/middlewares/'
import { BranchedPaginatedTable } from '~base/components/base-paginatedTable'
import Breadcrumb from '~base/components/base-breadcrumb'

class ReadyDataSets extends Component {
  constructor (props) {
    super(props)
    this.state = {
      className: ''
    }
  }

  componentWillMount () {
    this.context.tree.set('readydatasets', {
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
        'sortable': true,
        formatter: (row) => {
          return (
            <Link to={'/datasets/' + row.uuid}>
              {row.name}
            </Link>
          )
        }
      },
      {
        'title': 'Status',
        'property': 'status',
        'default': 'new',
        'sortable': true
      },
      {
        'title': 'Acciones',
        formatter: (row) => {
          return <Link className='button' to={'/datasets/' + row.uuid}>
            Detalle
          </Link>
        }
      }
    ]
  }

  render () {
    return (
      <div className='columns c-flex-1 is-marginless'>
        <div className='column is-paddingless'>
          <div className='section is-paddingless-top pad-sides'>
            <Breadcrumb
              path={[
                {
                  path: '/',
                  label: 'Dashboard',
                  current: false
                },
                {
                  path: '/datasets/ready',
                  label: 'Datasets Listos',
                  current: true
                }
              ]}
              align='left'
            />
            <h1 className='is-size-3 is-padding-top-small is-padding-bottom-small'>Datasets Listos</h1>
            <div className='card'>
              <header className='card-header'>
                <p className='card-header-title'>
                    DataSets Listos
                </p>
              </header>
              <div className='card-content'>
                <div className='columns'>
                  <div className='column'>
                    <BranchedPaginatedTable
                      branchName='datasets'
                      baseUrl='/app/datasets/readylist'
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

ReadyDataSets.contextTypes = {
  tree: PropTypes.baobab
}

const branchedReadyDataSets = branch({readydatasets: 'readydatasets'}, ReadyDataSets)

export default Page({
  path: '/datasets/ready',
  title: 'Listos',
  icon: 'thumbs-up',
  exact: true,
  roles: 'manager-level-3, analyst, orgadmin, admin, manager-level-2',
  validate: [loggedIn, verifyRole],
  component: branchedReadyDataSets
})
