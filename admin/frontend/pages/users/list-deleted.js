import React, { Component } from 'react'
import { branch } from 'baobab-react/higher-order'
import PropTypes from 'baobab-react/prop-types'
import api from '~base/api'
import ListPageComponent from '~base/list-page-component'
import {loggedIn} from '~base/middlewares/'
import { BranchedPaginatedTable } from '~base/components/base-paginated-table'
import Breadcrumb from '~base/components/base-breadcrumb'

class Header extends Component {
  constructor (props) {
    super(props)

    this.state = {
      loaded: false,
      currentCustomersHappiness: ''
    }
  }

  async restoreMultiple () {
    const { selectedRows } = this.props

    for (const row of selectedRows) {
      var url = '/admin/users/deleted/' + row.uuid
      await api.post(url)
    }

    this.props.reload()
  }

  render () {
    const { selectedRows } = this.props

    return <header className='card-header'>
      <p className='card-header-title'>
        Restore users
      </p>
      <div className='card-header-select'>
        <button
          className='button is-primary'
          onClick={() => this.restoreMultiple()}
          disabled={selectedRows.length === 0}
          >
          Restore multiple users
        </button>
      </div>
    </header>
  }
}

class UserDeletedList extends ListPageComponent {
  async onFirstPageEnter () {
    const organizations = await this.loadOrgs()

    return {organizations}
  }

  async loadOrgs () {
    var url = '/admin/organizations/'
    const body = await api.get(url, {
      start: 0,
      limit: 0
    })

    return body.data
  }

  async restoreOnClick (uuid) {
    var url = '/admin/users/deleted/' + uuid
    await api.post(url)
    this.props.history.push(env.PREFIX + '/manage/users/' + uuid)
  }

  getFilters () {
    const data = {
      schema: {
        type: 'object',
        required: [],
        properties: {
          screenName: {type: 'text', title: 'Por nombre'},
          email: {type: 'text', title: 'Por email'},
          organization: {type: 'text', title: 'Por organización', values: []}
        }
      },
      uiSchema: {
        screenName: {'ui:widget': 'SearchFilter'},
        email: {'ui:widget': 'SearchFilter'},
        organization: {'ui:widget': 'SelectSearchFilter'}
      }
    }

    if (this.state.organizations) {
      data.schema.properties.organization.values = this.state.organizations.map(item => { return {uuid: item.uuid, name: item.name} })
    }

    return data
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
        'title': 'Email',
        'property': 'email',
        'default': 'N/A',
        'sortable': true
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
          <div className='section is-paddingless-top pad-sides'>
            <Breadcrumb
              path={[
                {
                  path: '/admin',
                  label: 'Inicio',
                  current: false
                },
                {
                  path: '/admin/manage/users',
                  label: 'Usuarios desactivados',
                  current: true
                }
              ]}
              align='left'
            />
            <h1 className='is-size-3 is-padding-top-small is-padding-bottom-small'>Usuarios desactivados</h1>
            <div className='card'>
              <div className='card-content'>
                <div className='columns'>
                  <div className='column'>
                    <BranchedPaginatedTable
                      branchName='deletedUsers'
                      baseUrl='/admin/users/?isDeleted=true'
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

UserDeletedList.config({
  // Basic values
  name: 'user-deleted-list',
  path: '/manage/users/deleted',
  title: 'Usuarios desactivados',
  icon: 'trash',
  exact: true,
  validate: loggedIn,

  // Selectable and custom header
  selectable: true,
  headerLayout: 'custom',
  headerComponent: Header,

  // default filters
  defaultFilters: {
    isDeleted: true
  },

  // Api url to fetch from
  apiUrl: '/admin/users'
})

export default UserDeletedList
