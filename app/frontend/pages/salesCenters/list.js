import React from 'react'
import Link from '~base/router/link'
import moment from 'moment'
import { testRoles } from '~base/tools'

import ListPage from '~base/list-page'
import {loggedIn, verifyRole} from '~base/middlewares/'
import CreateSalesCenter from './create'

export default ListPage({
  path: '/catalogs/salesCenters',
  title: 'Centros de venta',
  icon: 'credit-card-alt',
  exact: true,
  roles: 'analyst, orgadmin, admin, manager-level-1, manager-level-2, manager-level-3',
  validate: [loggedIn, verifyRole],
  titleSingular: 'Centro de venta',
  create: true,
  createComponent: CreateSalesCenter,
  breadcrumbs: true,
  breadcrumbConfig: {
    path: [
      {
        path: '/',
        label: 'Inicio',
        current: false
      },
      {
        path: '/catalogs/salesCenters/',
        label: 'Centros de venta',
        current: true
      }
    ],
    align: 'left'
  },
  canCreate: 'admin, orgadmin, analyst',
  baseUrl: '/app/salesCenters',
  branchName: 'salesCenters',
  detailUrl: 'catalogs/salesCenters/',
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
        'title': 'Name',
        'property': 'name',
        'default': 'N/A',
        'sortable': true,
        formatter: (row) => {
          return (
            <Link to={'/catalogs/salesCenters/' + row.uuid}>
              {row.name}
            </Link>
          )
        }
      },
      {
        'title': 'Created',
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
        'title': 'Actions',
        formatter: (row) => {
          if (testRoles('manager-level-3')) {
            return (
              <Link className='button' to={'/catalogs/salesCenters/' + row.uuid}>
                <span className='icon is-small' title='Visualizar'>
                  <i className='fa fa-eye' />
                </span>
              </Link>
            )
          } else {
            return (
              <Link className='button is-primary' to={'/catalogs/salesCenters/' + row.uuid}>
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
