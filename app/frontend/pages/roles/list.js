import React from 'react'
import moment from 'moment'
import { uniqBy } from 'lodash'
import tree from '~core/tree'

import ListPage from '~base/list-page'
import { loggedIn, verifyRole } from '~base/middlewares/'

export default ListPage({
  translate: true,
  path: '/manage/roles',
  title: 'sideMenu.roles',
  icon: 'sitemap',
  exact: true,
  roles: 'admin, orgadmin, analyst, consultor-level-2, manager-level-2',
  validate: [loggedIn, verifyRole],
  titleSingular: 'Rol',
  breadcrumbs: true,
  breadcrumbConfig: {
    path: [
      {
        path: '/',
        label: 'sideMenu.home',
        current: false
      },
      {
        path: '/manage/roles/',
        label: 'sideMenu.roles',
        current: true
      }
    ],
    align: 'left'
  },
  sidePanel: false,
  sidePanelIcon: 'sitemap',
  baseUrl: '/app/roles',
  branchName: 'roles',
  detailUrl: '/manage/roles/',
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
  sortBy: 'priority',
  modifyData: (data) => {
    //const actualRole = tree.get('role')
    return uniqBy([...data], 'uuid')
  },
  getColumns: () => {
    return [
      {
        'title': 'tables.colPriority',
        'property': 'priority',
        'default': 'N/A',
        'sortable': true
      },
      {
        'title': 'tables.colName',
        'property': 'name',
        'default': 'N/A',
        'sortable': true
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
      }
    ]
  }
})
