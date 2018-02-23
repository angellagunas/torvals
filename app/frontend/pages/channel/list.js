import React from 'react'
import Link from '~base/router/link'
import moment from 'moment'

import ListPage from '~base/list-page'
import {loggedIn, verifyRole} from '~base/middlewares/'
import CreateChannel from './create'

export default ListPage({
  path: '/channels',
  title: 'Canales',
  icon: 'filter',
  exact: true,
  roles: 'analyst, orgadmin, admin, manager-level-1',
  validate: [loggedIn, verifyRole],
  titleSingular: 'Canal',
  create: true,
  createComponent: CreateChannel,
  breadcrumbs: true,
  breadcrumbConfig: {
    path: [
      {
        path: '/',
        label: 'Dashboard',
        current: false
      },
      {
        path: '/admin/channels/',
        label: 'Canales',
        current: true
      }
    ],
    align: 'left'
  },
  canCreate: 'admin, orgadmin, analyst',
  baseUrl: '/app/channels',
  branchName: 'channels',
  detailUrl: '/channels/',
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
            <Link to={'/channels/' + row.uuid}>
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
          return <Link className='button' to={'/channels/' + row.uuid}>
            Detalle
          </Link>
        }
      }
    ]
  }
})
