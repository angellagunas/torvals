import React from 'react'
import Link from '~base/router/link'
import api from '~base/api'

import ListPage from '~base/list-page'
import {loggedIn} from '~base/middlewares'
import CreateChannel from './create'

export default ListPage({
  path: '/channels',
  title: 'Active',
  icon: 'check',
  exact: true,
  validate: loggedIn,
  titleSingular: 'Channel',
  create: true,
  createComponent: CreateChannel,
  baseUrl: '/admin/channels',
  branchName: 'channels',
  detailUrl: '/admin/channels/detail/',
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
            <Link to={'/channels/detail/' + row.uuid}>
              {row.name}
            </Link>
          )
        }
      },
      {
        'title': 'Actions',
        formatter: (row) => {
          return (
            <Link className='button' to={'/channels/detail/' + row.uuid}>
              Detalle
            </Link>
          )
        }
      }
    ]
  }
})
