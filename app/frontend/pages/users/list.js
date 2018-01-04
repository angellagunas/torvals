import React, { Component } from 'react'
import { branch } from 'baobab-react/higher-order'
import PropTypes from 'baobab-react/prop-types'
import Link from '~base/router/link'
import api from '~base/api'
import tree from '~core/tree'

import Page from '~base/page'
import {loggedIn, verifyRole} from '~base/middlewares/'
import BaseFilterPanel from '~base/components/base-filters'
import { BranchedPaginatedTable } from '~base/components/base-paginatedTable'
import FontAwesome from 'react-fontawesome'
import CreateUser from './create'
import DeleteButton from '~base/components/base-deleteButton'

const schema = {
  type: 'object',
  required: [],
  properties: {
    name: {type: 'text', title: 'Por nombre'},
    email: {type: 'text', title: 'Por email'}
  }
}

const uiSchema = {
  name: {'ui:widget': 'SearchFilter'},
  email: {'ui:widget': 'SearchFilter'}
}

class Users extends Component {
  constructor (props) {
    super(props)
    this.state = {
      isFilterOpen: false,
      filters: {}
    }

    this.toggleFilterPanel = this.toggleFilterPanel.bind(this)
    this.handleOnFilter = this.handleOnFilter.bind(this)
  }

  componentWillMount () {
    this.context.tree.set('users', {
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
        'title': 'Name',
        'property': 'name',
        'default': 'N/A',
        'sortable': true
      },
      {
        'title': 'Email',
        'property': 'email',
        'default': 'N/A',
        'sortable': true
      },
      {
        'title': 'Actions',
        formatter: (row) => {
          const deleteObject = async function () {
            var url = '/app/users/' + row.uuid
            await api.del(url)

            const cursor = tree.get('users')
            const users = await api.get('/app/users/')

            tree.set('users', {
              page: cursor.page,
              totalItems: users.total,
              items: users.data,
              pageLength: cursor.pageLength
            })
            tree.commit()
          }

          const currentUser = tree.get('user')

          return (
            <div className='columns'>
              <div className='column'>
                <Link className='button' to={'/manage/users/' + row.uuid}>
                  Detalle
                </Link>
              </div>
              <div className='column'>
                {currentUser.uuid === row.uuid && (
                  <DeleteButton
                    titleButton={'Deactivate'}
                    objectName='Users'
                    objectDelete={deleteObject}
                    message={'Are you sure to delete this user?'}
                  />
                )}
              </div>
            </div>
          )
        }
      }
    ]
  }

  toggleFilterPanel (isFilterOpen) {
    this.setState({isFilterOpen: !isFilterOpen})
  }

  handleOnFilter (formData) {
    let filters = {}

    for (var field in formData) {
      if (formData[field]) {
        filters[field] = formData[field]
      }
    }
    this.setState({filters})
  }

  showModal () {
    this.setState({
      className: ' is-active'
    })
  }

  hideModal () {
    this.setState({
      className: ''
    })
  }

  finishUp (object) {
    window.setTimeout(() => {
      this.setState({
        className: ''
      })
      this.props.history.push('/manage/users/' + object.uuid)
    }, 2000)
  }

  render () {
    let { isFilterOpen, filters } = this.state
    let filterPanel

    if (isFilterOpen) {
      filterPanel = (
        <div className='column is-narrow side-filters is-paddingless'>
          <BaseFilterPanel
            schema={schema}
            uiSchema={uiSchema}
            filters={filters}
            onFilter={this.handleOnFilter}
            onToggle={() => this.toggleFilterPanel(isFilterOpen)} />
        </div>
      )
    }

    if (!isFilterOpen) {
      filterPanel = (<div className='searchbox'>
        <a
          href='javascript:void(0)'
          className='card-header-icon has-text-white'
          aria-label='more options'
          onClick={() => this.toggleFilterPanel(isFilterOpen)}
        >
          <FontAwesome name='search' />
        </a>
      </div>)
    }

    return (
      <div className='columns c-flex-1 is-marginless'>
        <div className='column is-paddingless'>
          <div className='section is-paddingless-top'>
            <h1
              className='is-size-3 is-padding-top-small is-padding-bottom-small'
            >
              Usuarios
            </h1>
            <div className='card'>
              <header className='card-header'>
                <p className='card-header-title'>
                  Total de usuarios: {
                    this.context.tree.get('users', 'totalItems') || ''
                  }
                </p>
                <div className='card-header-select'>
                  <button className='button is-primary' onClick={() => this.showModal()}>
                    New User
                  </button>
                  <CreateUser
                    className={this.state.className}
                    hideModal={this.hideModal.bind(this)}
                    finishUp={this.finishUp.bind(this)}
                    branchName='users'
                    baseUrl='/app/users'
                    url='/app/users'
                  />
                </div>
              </header>
              <div className='card-content'>
                <div className='columns'>
                  <div className='column'>
                    <BranchedPaginatedTable
                      branchName='users'
                      baseUrl='/app/users'
                      columns={this.getColumns()}
                      filters={filters}
                     />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        { filterPanel }
      </div>
    )
  }
}

Users.contextTypes = {
  tree: PropTypes.baobab
}

const branchedUsers = branch({users: 'users'}, Users)

export default Page({
  path: '/manage/users',
  title: 'User',
  icon: 'user',
  exact: true,
  roles: 'admin, admin-organizacion',
  validate: [loggedIn, verifyRole],
  component: branchedUsers
})
