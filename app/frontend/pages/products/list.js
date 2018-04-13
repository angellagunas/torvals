import React from 'react'
import Link from '~base/router/link'
import moment from 'moment'
import { testRoles } from '~base/tools'

import ListPage from '~base/list-page'
import {loggedIn, verifyRole} from '~base/middlewares/'
import CreateProduct from './create'

export default ListPage({
  path: '/catalogs/products',
  title: 'Productos',
  icon: 'dropbox',
  exact: true,
  roles: 'analyst, orgadmin, admin, manager-level-1, manager-level-2, consultor',
  validate: [loggedIn, verifyRole],
  titleSingular: 'Producto',
  create: true,
  createComponent: CreateProduct,
  breadcrumbs: true,
  breadcrumbConfig: {
    path: [
      {
        path: '/',
        label: 'Inicio',
        current: false
      },
      {
        path: '/catalogs/products/',
        label: 'Productos',
        current: true
      }
    ],
    align: 'left'
  },
  canCreate: 'admin, orgadmin, analyst, manager-level-2',
  baseUrl: '/app/products',
  branchName: 'products',
  detailUrl: '/catalogs/products/',
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
        'title': 'Id',
        'property': 'externalId',
        'default': 'N/A',
        'sortable': true,
        formatter: (row) => {
          return (
            <Link to={'/catalogs/products/detail/' + row.uuid}>
              {row.externalId}
            </Link>
          )
        }
      },
      {
        'title': 'Nombre',
        'property': 'name',
        'default': 'N/A',
        'sortable': true,
        formatter: (row) => {
          return (
            <Link to={'/catalogs/products/' + row.uuid}>
              {row.name}
            </Link>
          )
        }
      },
      {
        'title': 'Categoría',
        'property': 'category',
        'default': 'N/A',
        'sortable': true
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
          if (testRoles('consultor')) {
            return (
              <Link className='button' to={'/catalogs/products/' + row.uuid}>
                <span className='icon is-small' title='Visualizar'>
                  <i className='fa fa-eye' />
                </span>
              </Link>
            )
          } else {
            return (
              <Link className='button is-primary' to={'/catalogs/products/' + row.uuid}>
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
})
