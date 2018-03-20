import React from 'react'
import Link from '~base/router/link'
import moment from 'moment'

import ListPage from '~base/list-page'
import {loggedIn, verifyRole} from '~base/middlewares/'

export default ListPage({
  path: '/prices',
  title: 'Precios',
  titleSingular: 'Precio',
  icon: 'money',
  roles: 'admin, orgadmin, analyst, manager-level-3, manager-level-2',
  exact: true,
  validate: [loggedIn, verifyRole],
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
        path: '/prices',
        label: 'Precios',
        current: true
      }
    ],
    align: 'left'
  },
  baseUrl: '/app/prices',
  branchName: 'prices',
  detailUrl: '/prices/',
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
        'title': 'ID',
        'property': 'productExternalId',
        'default': 'N/A',
        'sortable': true
      },
      {
        'title': 'Producto',
        'property': 'product',
        'default': 'N/A',
        'sortable': true,
        formatter: (row) => {
          if (row.product && row.product.name) {
            return row.product.name
          }

          return 'N/A'
        }
      },

      {
        'title': 'Canal',
        'property': 'channel',
        'default': 'N/A',
        'sortable': true,
        formatter: (row) => {
          if (row.channel && row.channel.name) {
            return row.channel.name
          }

          return 'N/A'
        }
      },

      {
        'title': 'Precio',
        'property': 'price',
        'default': 'N/A',
        'sortable': true,
        'className': 'has-text-left',
        formatter: (row) => {
          if (row && row.price) {
            return '$ ' + row.price.toFixed(2).replace(/./g, (c, i, a) => {
              return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
            })
          }

          return 'N/A'
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
          return <Link className='button' to={'/prices/' + row.uuid}>
            Detalle
          </Link>
        }
      }
    ]
  }
})
