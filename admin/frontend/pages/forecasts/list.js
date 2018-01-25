import React from 'react'
import Link from '~base/router/link'
import moment from 'moment'

import { loggedIn } from '~base/middlewares/'
import ListPage from '~base/list-page'

export default ListPage({
  path: '/forecasts',
  title: 'Predicciones',
  icon: 'snowflake-o',
  exact: true,
  validate: loggedIn,
  titleSingular: 'Predicción',
  baseUrl: '/admin/forecasts',
  branchName: 'forecasts',
  detailUrl: '/admin/forecasts/detail/',
  getColumns: () => {
    return [
      {
        'title': 'Status',
        'property': 'status',
        'default': 'N/A',
        'sortable': true
      },
      {
        'title': 'Fecha Inicio',
        'property': 'dateStart',
        'default': 'N/A',
        'sortable': true,
        formatter: (row) => {
          return (
            moment.utc(row.dateStart).local().format('DD/MM/YYYY')
          )
        }
      },
      {
        'title': 'Fecha Fin',
        'property': 'dateEnd',
        'default': 'N/A',
        'sortable': true,
        formatter: (row) => {
          return (
            moment.utc(row.dateEnd).local().format('DD/MM/YYYY')
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
            row.organization.name
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
          return <Link className='button' to={'/forecasts/detail/' + row.uuid}>
            Detalle
          </Link>
        }
      }
    ]
  }
})
