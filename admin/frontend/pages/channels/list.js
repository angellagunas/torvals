import React from 'react'
import Link from '~base/router/link'
import moment from 'moment'
import api from '~base/api'
import ListPage from '~base/list-page'
import {loggedIn} from '~base/middlewares'
import CreateChannel from './create'

export default ListPage({
  path: '/channels',
  title: 'Activos',
  icon: 'check',
  exact: true,
  validate: loggedIn,
  titleSingular: 'Canal',
  create: true,
  createComponent: CreateChannel,
  breadcrumbs: true,
  breadcrumbConfig: {
    path: [
      {
        path: '/admin',
        label: 'Dashboard',
        current: false
      },
      {
        path: '/admin/channels/',
        label: 'Canales activos',
        current: true
      }
    ],
    align: 'left'
  },
  baseUrl: '/admin/channels',
  branchName: 'channels',
  detailUrl: '/admin/channels/detail/',
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
  getColumns: () => {
    return [
      {
        'title': 'Nombre',
        'property': 'name',
        'default': 'N/A',
        'sortable': true,
        formatter: (row) => {
          return (
            <Link to={'/channels/detail/' + row.uuid}>
              {row.name}
            </Link>
          )
        }
      },
      {
        'title': 'Organización',
        'property': 'organization',
        'default': 'N/A',
        'sortable': true,
        formatter: (row) => {
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
          return (
            <Link className='button is-primary' to={'/channels/detail/' + row.uuid}>
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
