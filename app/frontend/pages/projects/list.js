import React from 'react'
import Link from '~base/router/link'
import moment from 'moment'

import ListPage from '~base/list-page'
import {loggedIn, verifyRole} from '~base/middlewares/'
import CreateProject from './create'

export default ListPage({
  path: '/projects',
  title: 'Proyectos',
  icon: 'cog',
  exact: true,
  roles: 'enterprisemanager, analyst, orgadmin, admin',
  validate: [loggedIn, verifyRole],
  titleSingular: 'Proyecto',
  create: true,
  createComponent: CreateProject,
  canCreate: 'admin, orgadmin, analyst',
  baseUrl: '/app/projects',
  branchName: 'projects',
  detailUrl: '/projects/',
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
            <Link to={'/projects/' + row.uuid}>
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
          return <Link className='button' to={'/projects/' + row.uuid}>
            Detalle
          </Link>
        }
      }
    ]
  }
})
