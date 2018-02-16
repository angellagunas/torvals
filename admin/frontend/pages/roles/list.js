import React from 'react'
import Link from '~base/router/link'
import moment from 'moment'

import ListPage from '~base/list-page'
import {loggedIn} from '~base/middlewares/'
import CreateRole from './create'

export default ListPage({
  path: '/manage/roles',
  title: 'Roles',
  icon: 'address-book',
  exact: true,
  validate: loggedIn,
  titleSingular: 'Rol',
  create: true,
  createComponent: CreateRole,
  baseUrl: '/admin/roles',
  branchName: 'roles',
  detailUrl: '/admin/manage/roles/',
  getColumns: () => {
    return [
      {
        'title': 'Nombre',
        'property': 'name',
        'default': 'N/A',
        'sortable': true,
        formatter: (row) => {
          return (
            <Link to={'/manage/roles/' + row.uuid}>
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
        'title': 'Por defecto',
        'property': 'isDefault',
        'sortable': true,
        formatter: (row) => {
          if (row.isDefault) {
            return (
              'Si'
            )
          }
        }
      },
      {
        'title': 'Acciones',
        formatter: (row) => {
          return <Link className='button' to={'/manage/roles/' + row.uuid}>
            Detalle
          </Link>
        }
      }
    ]
  }
})
