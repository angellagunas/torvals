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
  roles: 'enterprisemanager, analyst, orgadmin, admin, localmanager, opsmanager',
  validate: [loggedIn, verifyRole],
  titleSingular: 'Canal',
  create: true,
  createComponent: CreateChannel,
  canCreate: 'admin, orgadmin, analyst',
  baseUrl: '/app/channels',
  branchName: 'channels',
  detailUrl: '/channels/',
  filters: true,
  schema: {
    type: 'object',
    required: [],
    properties: {
      name: {type: 'text', title: 'Por nombre'}
    }
  },
  uiSchema: {
    name: {'ui:widget': 'SearchFilter'}
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
