import React from 'react'
import Link from '~base/router/link'
import api from '~base/api'

import ListPage from '~base/list-page'
import {loggedIn} from '~base/middlewares/'

export default ListPage({
  path: '/datasets',
  title: 'Datasets',
  icon: 'check',
  exact: true,
  validate: loggedIn,
  titleSingular: 'Dataset',
  create: false,
  breadcrumbs: true,
  breadcrumbConfig: {
    path: [
      {
        path: '/admin',
        label: 'Inicio',
        current: false
      },
      {
        path: '/admin/datasets/',
        label: 'Datasets activos',
        current: true
      }
    ],
    align: 'left'
  },
  baseUrl: '/admin/datasets',
  branchName: 'datasets',
  detailUrl: '/admin/datasets/detail/',
  getColumns: () => {
    return [
      {
        'title': 'Nombre',
        'property': 'name',
        'default': 'N/A',
        'sortable': true,
        formatter: (row) => {
          return (
            <Link to={'/datasets/detail/' + row.uuid}>
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
        'title': 'Acciones',
        formatter: (row) => {
          return (
            <Link className='button is-primary' to={'/datasets/detail/' + row.uuid}>
              <span className='icon is-small' title='Editar'>
                <i className='fa fa-pencil' />
              </span>
            </Link>
          )
        }
      }
    ]
  },
  filters: true,
  schema: {
    type: 'object',
    required: [],
    properties: {
      name: {type: 'text', title: 'Por nombre'},
      organization: {type: 'text', title: 'Por organización'},
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
          }
        ]
      }
    }
  },
  uiSchema: {
    name: {'ui:widget': 'SearchFilter'},
    organization: {'ui:widget': 'SelectSearchFilter'},
    status: {'ui:widget': 'SelectSearchFilter'}
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
  }
})
