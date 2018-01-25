import React from 'react'
import Link from '~base/router/link'
import moment from 'moment'

import ListPage from '~base/list-page'
import {loggedIn, verifyRole} from '~base/middlewares/'
import CreateGroup from './create'

export default ListPage({
  path: '/manage/groups',
  title: 'Grupos',
  icon: 'users',
  exact: true,
  roles: 'admin, orgadmin',
  validate: [loggedIn, verifyRole],
  titleSingular: 'Grupo',
  create: true,
  createComponent: CreateGroup,
  baseUrl: '/app/groups',
  branchName: 'groups',
  detailUrl: '/manage/groups/',
  filters: true,
  schema: {
    type: 'object',
    required: [],
    properties: {
      name: {type: 'text', title: 'Por nombre'}
    }
  },
  uiSchema: {
    name: {'ui:widget': 'SearchFilter'}
  },
  getColumns: () => {
    return [
      {
        'title': 'Nombre',
        'property': 'name',
        'default': 'N/A',
        'sortable': true,
        formatter: (row) => {
          return (
            <Link to={'/manage/groups/' + row.uuid}>
              {row.name}
            </Link>
          )
        }
      },
      {
        'title': 'Creado',
        'property': 'dateCreated',
        'default': 'N/A',
        'sortable': true,
        formatter: (row) => {
          return (
            moment.utc(row.dateCreated).local().format('DD/MM/YYYY hh:mm a')
          )
        }
      },
      {
        'title': 'Acciones',
        formatter: (row) => {
          return <Link className='button' to={'/manage/groups/' + row.uuid}>
            Detalle
          </Link>
        }
      }
    ]
  }
})
