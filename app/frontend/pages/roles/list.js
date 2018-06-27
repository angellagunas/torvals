import React from 'react'
import moment from 'moment'

import ListPage from '~base/list-page'
import { loggedIn, verifyRole } from '~base/middlewares/'

export default ListPage({
  path: '/manage/roles',
  title: 'Roles',
  icon: 'sitemap',
  exact: true,
  roles: 'admin, orgadmin, analyst, consultor-level-3, consultor-level-2, manager-level-2, manager-level-3',
  validate: [loggedIn, verifyRole],
  titleSingular: 'Rol',
  breadcrumbs: true,
  breadcrumbConfig: {
    path: [
      {
        path: '/',
        label: 'Inicio',
        current: false
      },
      {
        path: '/manage/roles/',
        label: 'Roles',
        current: true
      }
    ],
    align: 'left'
  },
  sidePanel: false,
  sidePanelIcon: 'sitemap',
  baseUrl: '/app/roles/?start=0&limit=0',
  branchName: 'roles',
  detailUrl: '/manage/roles/',
  filters: true,
  schema: {
    type: 'object',
    required: [],
    properties: {
      name: {type: 'text', title: 'Buscar'}
    }
  },
  uiSchema: {
    name: {'ui:widget': 'SearchFilter'}
  },
  getColumns: () => {
    return [
      {
        'title': 'Prioridad',
        'property': 'priority',
        'default': 'N/A',
        'sortable': true
      },
      {
        'title': 'Nombre',
        'property': 'name',
        'default': 'N/A',
        'sortable': true
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
    ]
  }
})
