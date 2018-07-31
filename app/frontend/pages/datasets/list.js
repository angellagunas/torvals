import React from 'react'
import Link from '~base/router/link'
import { testRoles } from '~base/tools'

import ListPage from '~base/list-page'
import {loggedIn, verifyRole} from '~base/middlewares/'
import {datasetStatus} from '~base/tools'

export default ListPage({
  path: '/datasets',
  title: 'Datasets',
  icon: 'check',
  exact: true,
  roles: 'consultor-level-3, analyst, orgadmin, admin, consultor-level-2, manager-level-2',
  validate: [loggedIn, verifyRole],
  titleSingular: 'Dataset',
  breadcrumbs: true,
  breadcrumbConfig: {
    path: [
      {
        path: '/',
        label: 'Inicio', //TODO: translate
        current: false
      },
      {
        path: '/datasets/',
        label: 'Datasets', //TODO: translate
        current: true
      }
    ],
    align: 'left'
  },
  baseUrl: '/app/datasets',
  branchName: 'datasets',
  detailUrl: '/datasets/',
  filters: true,
  schema: {
    type: 'object',
    required: [],
    properties: {
      //TODO: translate
      name: {type: 'text', title: 'Por nombre'},
      status: {
        type: 'text',
        title: 'Por status', //TODO: translate
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
            name: 'conciliated',
            uuid: 'conciliated'
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
      { //TODO: translate
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
      { //TODO: translate
        'title': 'Estado',
        'property': 'status',
        'default': 'new',
        'sortable': true,
        formatter: (row) => {
          return datasetStatus[row.status]
        }
      },
      { //TODO: translate
        'title': 'Acciones',
        formatter: (row) => {
          if (testRoles('manager-level-2, consultor-level-3')) {
            return (
              <Link className='button is-primary' to={'/datasets/' + row.uuid}>
                <span className='icon is-small' title='Visualizar'>
                  <i className='fa fa-eye' />
                </span>
              </Link>
            )
          } else {
            return (
              <Link className='button is-primary' to={'/datasets/' + row.uuid}>
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
