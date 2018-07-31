import React from 'react'
import Link from '~base/router/link'
import moment from 'moment'
import { testRoles } from '~base/tools'

import ListPage from '~base/list-page'
import {loggedIn, verifyRole} from '~base/middlewares/'
import CreateSalesCenter from './create'

export default ListPage({
  path: '/catalogs/salesCenters',
  title: 'Centros de venta', //TODO: translate
  icon: 'credit-card-alt',
  exact: true,
  roles: 'analyst, orgadmin, admin, manager-level-1, consultor-level-2, manager-level-2, consultor-level-3, manager-level-3',
  validate: [loggedIn, verifyRole],
  titleSingular: 'Centro de venta', //TODO: translate
  create: true,
  createComponent: CreateSalesCenter,
  export: true,
  exportRole: 'consultor-level-3',
  exportUrl: '/app/salesCenters',
  breadcrumbs: true,
  breadcrumbConfig: {
    path: [
      {
        path: '/',
        label: 'Inicio', //TODO: translate
        current: false
      },
      {
        path: '/catalogs/salesCenters/', //TODO: translate
        label: 'Centros de venta',
        current: true
      }
    ],
    align: 'left'
  },
  canCreate: 'admin, orgadmin, analyst, manager-level-3',
  baseUrl: '/app/salesCenters',
  branchName: 'salesCenters',
  detailUrl: 'catalogs/salesCenters/',
  filters: true,
  schema: {
    type: 'object',
    required: [],
    properties: {
      //TODO: translate
      general: {type: 'text', title: 'Buscar'}
    }
  },
  uiSchema: {
    general: {'ui:widget': 'SearchFilter'}
  },
  getColumns: () => {
    return [
      {
        'title': 'Nombre', //TODO: translate
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
        'title': 'Creado', //TODO: translate
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
        'title': 'Acciones', //TODO: translate
        formatter: (row) => {
          if (testRoles('consultor-level-3, consultor-level-2')) {
            return (
              <Link className='button is-primary' to={'/catalogs/salesCenters/' + row.uuid}>
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
