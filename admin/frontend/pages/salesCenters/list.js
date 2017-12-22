import React from 'react'
import Link from '~base/router/link'
import moment from 'moment'
import api from '~base/api'

import ListPage from '~base/list-page'
import {loggedIn} from '~base/middlewares/'
import CreateSalesCenter from './create'

export default ListPage({
  path: '/salesCenters',
  title: 'Active',
  icon: 'check',
  exact: true,
  validate: loggedIn,
  titleSingular: 'Sales center',
  create: true,
  createComponent: CreateSalesCenter,
  baseUrl: '/admin/salesCenters',
  branchName: 'salesCenters',
  detailUrl: '/admin/salesCenters/',
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
        'title': 'Name',
        'property': 'name',
        'default': 'N/A',
        'sortable': true,
        formatter: (row) => {
          return (
            <Link to={'/salesCenters/detail/' + row.uuid}>
              {row.name}
            </Link>
          )
        }
      },
      {
        'title': 'Organization',
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
        'title': 'Created',
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
        'title': 'Actions',
        formatter: (row) => {
          return <Link className='button' to={'/salesCenters/detail/' + row.uuid}>
            Detalle
          </Link>
        }
      }
    ]
  }
})
