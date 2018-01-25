import React from 'react'
import Link from '~base/router/link'
import api from '~base/api'
import tree from '~core/tree'

import ListPage from '~base/list-page'
import {loggedIn, verifyRole} from '~base/middlewares/'
import CreateUser from './create'
import DeleteButton from '~base/components/base-deleteButton'

export default ListPage({
  path: '/manage/users',
  title: 'Usuarios',
  icon: 'user',
  exact: true,
  roles: 'admin, orgadmin',
  validate: [loggedIn, verifyRole],
  titleSingular: 'Usuario',
  create: true,
  createComponent: CreateUser,
  baseUrl: '/app/users',
  branchName: 'users',
  detailUrl: '/manage/users/',
  filters: true,
  schema: {
    type: 'object',
    required: [],
    properties: {
      name: {type: 'text', title: 'Por nombre'},
      email: {type: 'text', title: 'Por email'}
    }
  },
  uiSchema: {
    name: {'ui:widget': 'SearchFilter'},
    email: {'ui:widget': 'SearchFilter'}
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

          return (
            <div className='columns'>
              <div className='column'>
                <Link className='button' to={'/manage/users/' + row.uuid}>
                  Detalle
                </Link>
              </div>
              <div className='column'>
                {currentUser.uuid !== row.uuid && (
                  <DeleteButton
                    titleButton={'Desactivar'}
                    objectName='Usuario'
                    objectDelete={deleteObject}
                    message={`Estas seguro de querer desactivar a ${row.name}?`}
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
