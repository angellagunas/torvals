import React, { Component } from 'react'
import { FormattedMessage } from 'react-intl'
import { branch } from 'baobab-react/higher-order'
import PropTypes from 'baobab-react/prop-types'
import Link from '~base/router/link'
import { testRoles } from '~base/tools'

import Page from '~base/page'
import {loggedIn, verifyRole} from '~base/middlewares/'
import { BranchedPaginatedTable } from '~base/components/base-paginated-table'
import Breadcrumb from '~base/components/base-breadcrumb'
import {datasetStatus} from '~base/tools'

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
      { //TODO: translate
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
      { //TODO: translate
        'title': 'Estado',
        'property': 'status',
        'default': 'new',
        'sortable': true,
        formatter: (row) => {
          return datasetStatus[row.status]
        }
      },
      { //TODO: translate
        'title': 'Acciones',
        formatter: (row) => {
          if (testRoles('manager-level-2, consultor-level-3')) {
            return (
              <Link className='button is-primary' to={'/datasets/' + row.uuid}>
                <span className='icon is-small' title='Visualizar'>
                  <i className='fa fa-eye' />
                </span>
              </Link>
            )
          } else {
            return (
              <Link className='button is-primary' to={'/datasets/' + row.uuid}>
                <span className='icon is-small' title='Editar'>
                  <i className='fa fa-pencil' />
                </span>
              </Link>
            )
          }
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
                { //TODO: translate
                  path: '/',
                  label: 'Inicio',
                  current: false
                },
                { //TODO: translate
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
                  <FormattedMessage
                    id="datasets.datasetsRady"
                    defaultMessage={`DataSets Listos`}
                  />
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
  title: 'Listos', //TODO: translate
  icon: 'thumbs-up',
  exact: true,
  roles: 'consultor-level-3, analyst, orgadmin, admin, consultor-level-2, manager-level-2',
  validate: [loggedIn, verifyRole],
  component: branchedReadyDataSets
})
