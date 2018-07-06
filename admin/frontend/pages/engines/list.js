import React from 'react'
import Link from '~base/router/link'
import moment from 'moment'

import { loggedIn } from '~base/middlewares/'
import ListPage from '~base/list-page'

export default ListPage({
  path: '/engines',
  title: 'Modelos',
  icon: 'cogs',
  exact: true,
  validate: loggedIn,
  titleSingular: 'Modelo',
  breadcrumbs: true,
  breadcrumbConfig: {
    path: [
      {
        path: '/admin',
        label: 'Inicio',
        current: false
      },
      {
        path: '/admin/engines/',
        label: 'Modelos',
        current: true
      }
    ],
    align: 'left'
  },
  baseUrl: '/admin/engines/list',
  branchName: 'engines',
  detailUrl: '/admin/engines/detail/',
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
            <Link to={'/engines/detail/' + row.uuid}>
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
          return (
            <Link disabled className='button is-primary' to={'/engines/detail/' + row.uuid}>
              <span className='icon is-small' title='Editar'>
                <i className='fa fa-pencil' />
              </span>
            </Link>
          )
        }
      }
    ]
  }
})
