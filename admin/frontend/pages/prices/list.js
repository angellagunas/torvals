import React from 'react'
import Link from '~base/router/link'
import moment from 'moment'

import ListPage from '~base/list-page'
import {loggedIn} from '~base/middlewares/'
import CreatePrice from './create'

export default ListPage({
  path: '/prices',
  title: 'Precios  Activos',
  titleSingular: 'Precio',
  icon: 'check',
  exact: true,
  validate: loggedIn,
  create: false,
  createComponent: CreatePrice,
  breadcrumbs: true,
  breadcrumbConfig: {
    path: [
      {
        path: '/admin',
        label: 'Dashboard',
        current: false
      },
      {
        path: '/admin/prices',
        label: 'Precios activos',
        current: true
      }
    ],
    align: 'left'
  },
  baseUrl: '/admin/prices',
  branchName: 'prices',
  detailUrl: '/admin/prices/',
  getColumns: () => {
    return [
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
          return <Link className='button' to={'/prices/' + row.uuid}>
            Detalle
          </Link>
        }
      }
    ]
  }
})
