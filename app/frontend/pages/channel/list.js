import React from 'react'
import Link from '~base/router/link'
import moment from 'moment'
import { testRoles } from '~base/tools'

import ListPage from '~base/list-page'
import {loggedIn, verifyRole} from '~base/middlewares/'
import CreateChannel from './create'

export default ListPage({
  path: '/channels',
  title: 'Canales',
  icon: 'filter',
  exact: true,
  roles: 'analyst, orgadmin, admin, manager-level-1, manager-level-2, manager-level-3',
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
  canCreate: 'admin, orgadmin, analyst, manager-level-2',
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
          if (testRoles('manager-level-3')) {
            return (
              <Link className='button' to={'/channels/' + row.uuid}>
                <span className='icon is-small' title='Visualizar'>
                  <i className='fa fa-eye' />
                </span>
              </Link>
            )
          } else {
            return (
              <Link className='button is-primary' to={'/channels/' + row.uuid}>
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
