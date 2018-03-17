import React from 'react'
import Link from '~base/router/link'
import moment from 'moment'
import api from '~base/api'

import {loggedIn} from '~base/middlewares/'
import CreateProject from './create'
import ListPage from '~base/list-page'

export default ListPage({
  path: '/projects',
  title: 'Proyectos',
  icon: 'check',
  exact: true,
  validate: loggedIn,
  titleSingular: 'Proyecto',
  create: true,
  createComponent: CreateProject,
  breadcrumbs: true,
  breadcrumbConfig: {
    path: [
      {
        path: '/admin',
        label: 'Inicio',
        current: false
      },
      {
        path: '/admin/projects/',
        label: 'Proyectos activos',
        current: true
      }
    ],
    align: 'left'
  },
  baseUrl: '/admin/projects',
  branchName: 'projects',
  detailUrl: '/admin/projects/detail/',
  filters: true,
  schema: {
    type: 'object',
    required: [],
    properties: {
      name: {type: 'text', title: 'Por nombre'},
      organization: {type: 'text', title: 'Por organización', values: []}
    }
  },
  uiSchema: {
    name: {'ui:widget': 'SearchFilter'},
    organization: {'ui:widget': 'SelectSearchFilter'}
  },
  loadValues: async function () {
    var url = '/admin/organizations/'
    const body = await api.get(
      url,
      {
        start: 0,
        limit: 0
      }
    )

    return {
      'organization': body.data
    }
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
            <Link to={'/projects/detail/' + row.uuid}>
              {row.name}
            </Link>
          )
        }
      },
      {
        'title': 'Organización',
        'property': 'organization',
        'default': '',
        'sortable': true,
        formatter: (row) => {
          if (!row.organization) { return }

          return (
            <Link to={'/manage/organizations/' + row.organization.uuid}>
              {row.organization.name}
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
          return <Link className='button' to={'/projects/detail/' + row.uuid}>
            Detalle
          </Link>
        }
      }
    ]
  }
})
