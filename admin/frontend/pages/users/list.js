import React from 'react'

import env from '~base/env-variables'
import Link from '~base/router/link'
import api from '~base/api'
import ListPageComponent from '~base/list-page-component'
import {loggedIn} from '~base/middlewares/'

import tree from '~core/tree'
import CreateUserNoModal from './create-no-modal'
import DeleteButton from '~base/components/base-deleteButton'

class UserList extends ListPageComponent {
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

  async deleteObject (row) {
    await api.del('/admin/users/' + row.uuid)
    this.reload()
  }

  finishUp (data) {
    this.setState({
      className: ''
    })

    this.props.history.push(env.PREFIX + '/manage/users/' + data.uuid)
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
        'title': 'Grupos',
        'property': 'groups',
        'default': 'N/A',
        'sortable': true,
        formatter: (row) => {
          if (row.groups.length > 2) {
            return (
              <div>
                {row.groups[0].name}
                <br />
                {row.groups[1].name}
                <br />
                {row.groups.length - 2} más
              </div>
            )
          } else if (row.groups.length > 1) {
            return (
              <div>
                {row.groups[0].name}
                <br />
                {row.groups[1].name}
              </div>
            )
          } else if (row.groups.length > 0) {
            return (
              <div>
                {row.groups[0].name}
              </div>
            )
          }
        }
      },
      {
        'title': 'Acciones',
        formatter: (row) => {
          const deleteObject = async function () {
            var url = '/admin/users/' + row.uuid
            await api.del(url)

            const cursor = tree.get('users')

            const users = await api.get('/admin/users/',
              { start: 0,
                limit: 10,
                sort: cursor.sort || 'name'
              })

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
            <div className='field is-grouped'>
              <div className='control'>
                <Link className='button is-primary' to={'/manage/users/' + row.uuid}>
                  <span className='icon is-small'>
                    <i className='fa fa-pencil' />
                  </span>
                </Link>
              </div>
              <div className='control'>
                {currentUser.uuid !== row.uuid && (
                  <DeleteButton
                    iconOnly
                    icon='fa fa-trash'
                    objectName='Usuario'
                    objectDelete={() => this.deleteObject(row)}
                    message={`Está seguro de querer desactivar a ${row.email} ?`}
                  />
                )}
              </div>
            </div>
          )
        }
      }
    ]
  }
}

UserList.config({
  name: 'user-list',
  path: '/manage/users',
  title: 'Usuarios',
  icon: 'user',
  exact: true,
  validate: loggedIn,
  breadcrumbs: true,
  breadcrumbConfig: {
    path: [
      {
        path: '/admin',
        label: 'Inicio',
        current: false
      },
      {
        path: '/admin/manage/users/',
        label: 'Usuarios activos',
        current: true
      }
    ],
    align: 'left'
  },
  create: false,
  branchName: 'users',
  titleSingular: 'Usuario',
  sidePanel: true,
  sidePanelIcon: 'user-plus',
  sidePanelComponent: CreateUserNoModal,
  filters: true,
  schema: {
    type: 'object',
    required: [],
    properties: {
      general: {type: 'text', title: 'Buscar'}
    }
  },
  uiSchema: {
    general: {'ui:widget': 'SearchFilter'}
  },
  apiUrl: '/admin/users',
  detailUrl: '/admin/manage/users/'
})

export default UserList
