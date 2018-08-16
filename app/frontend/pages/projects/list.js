import React from 'react'
import Link from '~base/router/link'
import moment from 'moment'
import { testRoles } from '~base/tools'

import ListPage from '~base/list-page'
import {loggedIn, verifyRole} from '~base/middlewares/'
import CreateProject from './create'

export default ListPage({
  translate: true,
  path: '/projects',
  title: 'sideMenu.projects',
  icon: 'folder',
  exact: true,
  roles: 'consultor-level-3, analyst, orgadmin, admin, consultor-level-2, manager-level-2, manager-level-3',
  validate: [loggedIn, verifyRole],
  titleSingular: 'projectConfig.project',
  create: true,
  createComponent: CreateProject,
  breadcrumbs: true,
  breadcrumbConfig: {
    path: [
      {
        path: '/',
        label: 'sideMenu.home',
        current: false
      },
      {
        path: '/projects/',
        label: 'sideMenu.projects',
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
      name: {type: 'text', title: 'Por nombre'}
    }
  },
  uiSchema: {
    name: {'ui:widget': 'SearchFilter'}
  },
  getColumns: () => {
    return [
      {
        'title': 'tables.colName',
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
        'title': 'tables.colCreated',
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
        'title': 'tables.colActions',
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
  },
  noDataComponent: (<div className='columns is-centered'>
    <div className='column is-8'>
      <article className='message is-info'>
        <div className='message-header has-text-weight-bold'>
          <p>Proyecto nuevo</p>
        </div>
        <div className='message-body is-size-6 has-text-centered'>
          <span className='icon is-large has-text-info'>
            <i className='fa fa-magic fa-2x' />
          </span>
          <span className='is-size-5'>
            Debes crear al menos un proyecto para poder crear una predicción
          </span>

        </div>
      </article>
    </div>
  </div>)
})
