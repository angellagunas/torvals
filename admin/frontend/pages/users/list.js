import React from 'react'

import Link from '~base/router/link'
import api from '~base/api'
import ListPage from '~base/list-page'
import {loggedIn} from '~base/middlewares/'

import tree from '~core/tree'
import CreateUser from './create'
import DeleteButton from '~base/components/base-deleteButton'

export default ListPage({
  path: '/manage/users',
  title: 'Users',
  icon: 'user',
  exact: true,
  validate: loggedIn,
  titleSingular: 'User',
  create: true,
  createComponent: CreateUser,
  baseUrl: '/admin/users',
  branchName: 'users',
  detailUrl: '/admin/manage/users/',
  filters: true,
  schema: {
    type: 'object',
    required: [],
    properties: {
      name: {type: 'text', title: 'Por nombre'},
      email: {type: 'text', title: 'Por email'},
      organization: {type: 'text', title: 'Por organización', values: []}
    }
  },
  uiSchema: {
    name: {'ui:widget': 'SearchFilter'},
    email: {'ui:widget': 'SearchFilter'},
    organization: {'ui:widget': 'SelectSearchFilter'}
  },
  loadValues: async function () {
    var url = '/admin/organizations/'
    const body = await api.get(
      url,
      {
        start: 0,
        limit: 0
      }
    )

    return {
      'organization': body.data
    }
  },
  getColumns: () => {
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
            var url = '/admin/users/' + row.uuid
            await api.del(url)

            const cursor = tree.get('users')
            const users = await api.get('/admin/users/')

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
                    titleButton={'Deactivate'}
                    objectName='Users'
                    objectDelete={deleteObject}
                    message={`Are you sure you want to deactivate ${row.name}?`}
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
