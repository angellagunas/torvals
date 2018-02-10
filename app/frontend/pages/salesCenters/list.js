import React from 'react'
import Link from '~base/router/link'
import moment from 'moment'

import ListPage from '~base/list-page'
import {loggedIn, verifyRole} from '~base/middlewares/'
import CreateSalesCenter from './create'

export default ListPage({
  path: '/salesCenters',
  title: 'Centros de venta',
  icon: 'credit-card-alt',
  exact: true,
  roles: 'analyst, orgadmin, admin, localmanager, opsmanager',
  validate: [loggedIn, verifyRole],
  titleSingular: 'Centro de venta',
  create: true,
  createComponent: CreateSalesCenter,
  canCreate: 'admin, orgadmin, analyst',
  baseUrl: '/app/salesCenters',
  branchName: 'salesCenters',
  detailUrl: 'salesCenters/',
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
        'title': 'Name',
        'property': 'name',
        'default': 'N/A',
        'sortable': true,
        formatter: (row) => {
          return (
            <Link to={'/salesCenters/' + row.uuid}>
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
          return <Link className='button' to={'/salesCenters/' + row.uuid}>
            Detalle
          </Link>
        }
      }
    ]
  }
})
