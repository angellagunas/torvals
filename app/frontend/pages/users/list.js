import React from 'react'
import Link from '~base/router/link'
import api from '~base/api'
import tree from '~core/tree'

import ListPage from '~base/list-page'
import {loggedIn, verifyRole} from '~base/middlewares/'
import CreateUserNoModal from './create-no-modal'
import DeleteButton from '~base/components/base-deleteButton'

export default ListPage({
  path: '/manage/users',
  title: 'Usuarios',
  icon: 'user',
  exact: true,
  roles: 'admin, orgadmin, analyst, manager-level-3, manager-level-2',
  validate: [loggedIn, verifyRole],
  titleSingular: 'Usuario',
  create: false,
  breadcrumbs: true,
  breadcrumbConfig: {
    path: [
      {
        path: '/',
        label: 'Inicio',
        current: false
      },
      {
        path: '/manage/users/',
        label: 'Usuarios',
        current: true
      }
    ],
    align: 'left'
  },
  sidePanel: true,
  sidePanelIcon: 'user-plus',
  sidePanelComponent: CreateUserNoModal,
  baseUrl: '/app/users',
  branchName: 'users',
  detailUrl: '/manage/users/',
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
  getColumns: () => {
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
        'title': 'Rol',
        'property': 'role',
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
          var disabledActions = false

          if (row.roleDetail && currentUser) {
            disabledActions = row.roleDetail.priority <= currentUser.currentRole.priority
          }

          return (
            <div className='field is-grouped'>
              <div className='control'>
                {disabledActions
                  ? <Link className='button' to={'/manage/users/' + row.uuid}>
                    <span className='icon is-small' title='Visualizar'>
                      <i className='fa fa-eye' />
                    </span>
                  </Link>
              : <Link className='button is-primary' to={'/manage/users/' + row.uuid}>
                <span className='icon is-small' title='Editar'>
                  <i className='fa fa-pencil' />
                </span>
              </Link>
              }
              </div>
              <div className='control'>
                {currentUser.uuid !== row.uuid && !disabledActions && (
                  <DeleteButton
                    iconOnly
                    icon='fa fa-trash'
                    objectName='Usuario'
                    objectDelete={deleteObject}
                    message={`Está seguro de querer desactivar a ${row.name} ?`}
                  />
                )}
              </div>
            </div>
          )
        }
      }
    ]
  }
})
