import React from 'react'
import Link from '~base/router/link'
import moment from 'moment'
import api from '~base/api'

import ListPage from '~base/list-page'
import {loggedIn} from '~base/middlewares/'

export default ListPage({
  path: '/predictionHistoric',
  title: 'Prediction Historic',
  icon: 'check',
  exact: true,
  validate: loggedIn,
  titleSingular: 'Prediction Historic',
  baseUrl: '/admin/predictionHistoric',
  branchName: 'predictionHistoric',
  detailUrl: '/admin/predictionHistoric/',
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
        'title': 'Who',
        'property': 'name',
        'default': 'N/A',
        'sortable': true,
        formatter: (row) => {
          return (
            <Link to={'/manage/users/' + row.updatedBy.uuid}>
              {row.updatedBy.name}
            </Link>
          )
        }
      },
      {
        'title': 'Prediction',
        'property': 'prediction',
        'default': 'N/A',
        'sortable': true
      },
      {
        'title': 'Last adjustment',
        'property': 'lastAdjustment',
        'default': 'N/A',
        'sortable': true
      },
      {
        'title': 'New adjustment',
        'property': 'newAdjustment',
        'default': 'N/A',
        'sortable': true
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
        'property': 'createdAt',
        'default': 'N/A',
        'sortable': true,
        formatter: (row) => {
          return (
            moment.utc(row.createdAt).local().format('DD/MM/YYYY hh:mm a')
          )
        }
      }
    ]
  }
})
