import React from 'react'

import env from '~base/env-variables'
import Link from '~base/router/link'
import api from '~base/api'
import ListPageComponent from '~base/list-page-component'
import {loggedIn} from '~base/middlewares/'
import moment from 'moment'
import tree from '~core/tree'
import CreateOrganization from './create'

class OrganizationList extends ListPageComponent {
  finishUp (data) {
    this.setState({
      className: ''
    })

    this.props.history.push(env.PREFIX + '/manage/organizations/' + data.uuid)
  }

  getFilters () {
    const data = {
      schema: {
        type: 'object',
        required: [],
        properties: {
          status: {
            type: 'text',
            title: 'Por status',
            values: [
              {
                uuid: 'active',
                name: 'Activa'
              },
              {
                uuid: 'inactive',
                name: 'Inactiva'
              },
              {
                uuid: 'trial',
                name: 'Período de prueba'
              },
              {
                uuid: 'activationPending',
                name: 'Pendiente de activación'
              }
            ] },
          general: {type: 'text', title: 'Buscar'}
        }
      },
      uiSchema: {
        status: { 'ui:widget': 'SelectSearchFilter' },
        general: {'ui:widget': 'SearchFilter'}
      }
    }

    return data
  }

  getColumns () {
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
        'title': 'No. Empleados',
        'property': 'employees',
        'default': '0'
      },
      {
        'title': 'Status',
        'property': 'status',
        'default': 'N/A',
        'sortable': true,
        formatter: (row) => {
          let status = {
            active: 'Activa',
            inactive: 'Inactiva',
            trial: 'Período de prueba',
            activationPending: 'Pendiente de activación'
          }

          return status[row.status]
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
}

OrganizationList.config({
  name: 'organization-list',
  path: '/manage/organizations',
  title: 'Organizaciones',
  titleSingular: 'Organización',
  icon: 'users',
  exact: true,
  validate: loggedIn,
  breadcrumbs: true,
  breadcrumbConfig: {
    path: [
      {
        path: '/admin',
        label: 'Inicio',
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
  headerLayout: 'create',
  create: true,
  createComponent: CreateOrganization,
  createComponentLabel: 'Nueva Organización',
  branchName: 'organizations',
  filters: true,
  uiSchema: {
    status: { 'ui:widget': 'SelectSearchFilter' },
    general: {'ui:widget': 'SearchFilter'}
  },
  apiUrl: '/admin/organizations',
  detailUrl: '/admin/manage/organizations/'
})

export default OrganizationList
