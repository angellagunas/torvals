import React from 'react'
import Link from '~base/router/link'
import moment from 'moment'

import ListPage from '~base/list-page'
import {loggedIn} from '~base/middlewares/'
import CreateOrganization from './create'

export default ListPage({
  path: '/manage/organizations',
  title: 'Organizaciones',
  titleSingular: 'Organización',
  icon: 'users',
  exact: true,
  validate: loggedIn,
  create: true,
  createComponent: CreateOrganization,
  breadcrumbs: true,
  breadcrumbConfig: {
    path: [
      {
        path: '/admin',
        label: 'Dashboard',
        current: false
      },
      {
        path: '/admin/manage/organizations',
        label: 'Organizaciones',
        current: true
      }
    ],
    align: 'left'
  },
  baseUrl: '/admin/organizations',
  branchName: 'organizations',
  detailUrl: '/admin/manage/organizations/',
  getColumns: () => {
    return [
      {
        'title': 'Nombre',
        'property': 'name',
        'default': 'N/A',
        'sortable': true,
        formatter: (row) => {
          return (
            <Link to={'/manage/organizations/' + row.uuid}>
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
            <Link className='button is-primary' to={'/manage/organizations/' + row.uuid}>
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
