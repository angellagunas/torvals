import React from 'react'
import Link from '~base/router/link'
import moment from 'moment'

import ListPage from '~base/list-page'
import {loggedIn, verifyRole} from '~base/middlewares/'
import CreateProduct from './create'

export default ListPage({
  path: '/products',
  title: 'Productos',
  icon: 'dropbox',
  exact: true,
  roles: 'analyst, orgadmin, admin, manager-level-1, manager-level-2',
  validate: [loggedIn, verifyRole],
  titleSingular: 'Producto',
  create: true,
  createComponent: CreateProduct,
  canCreate: 'admin, orgadmin, analyst, manager-level-2',
  baseUrl: '/app/products',
  branchName: 'products',
  detailUrl: '/products/',
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
        'sortable': true,
        formatter: (row) => {
          return (
            <Link to={'/products/' + row.uuid}>
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
          return <Link className='button' to={'/products/' + row.uuid}>
            Detalle
          </Link>
        }
      }
    ]
  }
})
