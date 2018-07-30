import React from 'react'
import Link from '~base/router/link'
import moment from 'moment'
import { testRoles } from '~base/tools'

import ListPage from '~base/list-page'
import {loggedIn, verifyRole} from '~base/middlewares/'
import CreateProject from './create'

export default ListPage({
  path: '/projects',
  title: 'Proyectos', //TODO: translate
  icon: 'folder',
  exact: true,
  roles: 'consultor-level-3, analyst, orgadmin, admin, consultor-level-2, manager-level-2, manager-level-3',
  validate: [loggedIn, verifyRole],
  titleSingular: 'Proyecto', //TODO: translate
  create: true,
  createComponent: CreateProject,
  breadcrumbs: true,
  breadcrumbConfig: {
    path: [
      {
        path: '/',
        label: 'Inicio', //TODO: translate
        current: false
      },
      {
        path: '/projects/',
        label: 'Proyectos', //TODO: translate
        current: true
      }
    ],
    align: 'left'
  },
  canCreate: 'admin, orgadmin, analyst, manager-level-3',
  baseUrl: '/app/projects',
  branchName: 'projects',
  detailUrl: '/projects/',
  filters: true,
  schema: {
    type: 'object',
    required: [],
    properties: {
      //TODO: translate
      name: {type: 'text', title: 'Por nombre'}
    }
  },
  uiSchema: {
    name: {'ui:widget': 'SearchFilter'}
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
            <Link to={'/projects/' + row.uuid}>
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
          if (testRoles('consultor-level-2, consultor-level-3')) {
            return (
              <Link className='button is-primary' to={'/projects/' + row.uuid}>
                <span className='icon is-small' title='Visualizar'>
                  <i className='fa fa-eye' />
                </span>
              </Link>
            )
          } else {
            return (
              <Link className='button is-primary' to={'/projects/' + row.uuid}>
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
