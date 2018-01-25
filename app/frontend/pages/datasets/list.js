import React from 'react'
import Link from '~base/router/link'

import ListPage from '~base/list-page'
import {loggedIn, verifyRole} from '~base/middlewares/'

export default ListPage({
  path: '/datasets',
  title: 'Datasets',
  icon: 'check',
  exact: true,
  roles: 'enterprisemanager, analyst, orgadmin, admin',
  validate: [loggedIn, verifyRole],
  titleSingular: 'Dataset',
  baseUrl: '/app/datasets',
  branchName: 'datasets',
  detailUrl: '/datasets/',
  filters: true,
  schema: {
    type: 'object',
    required: [],
    properties: {
      name: {type: 'text', title: 'Por nombre'},
      status: {
        type: 'text',
        title: 'Por status',
        values: [
          {
            name: 'new',
            uuid: 'new'
          },
          {
            name: 'uploading',
            uuid: 'uploading'
          },
          {
            name: 'uploaded',
            uuid: 'uploaded'
          },
          {
            name: 'preprocessing',
            uuid: 'preprocessing'
          },
          {
            name: 'configuring',
            uuid: 'configuring'
          },
          {
            name: 'processing',
            uuid: 'processing'
          },
          {
            name: 'reviewing',
            uuid: 'reviewing'
          },
          {
            name: 'ready',
            uuid: 'ready'
          },
          {
            name: 'consolidated',
            uuid: 'consolidated'
          }
        ]
      }
    }
  },
  uiSchema: {
    name: {'ui:widget': 'SearchFilter'},
    status: {'ui:widget': 'SelectSearchFilter'}
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
            <Link to={'/datasets/' + row.uuid}>
              {row.name}
            </Link>
          )
        }
      },
      {
        'title': 'Status',
        'property': 'status',
        'default': 'new',
        'sortable': true
      },
      {
        'title': 'Acciones',
        formatter: (row) => {
          return <Link className='button' to={'/datasets/' + row.uuid}>
            Detalle
          </Link>
        }
      }
    ]
  }
})
