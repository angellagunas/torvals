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
        label: 'Dashboard',
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
  getColumns: () => {
    return [
      {
        'title': 'ID',
        'property': 'product.externaId',
        'default': 'N/A',
        'sortable': true,
        formatter: (row) => {
          if (row.product) {
            return row.product.externalId
          }

          return 'N/A'
        }
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
