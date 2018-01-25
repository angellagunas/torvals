import React from 'react'
import Link from '~base/router/link'
import moment from 'moment'

import ListPage from '~base/list-page'
import {loggedIn, verifyRole} from '~base/middlewares/'

export default ListPage({
  path: '/forecasts',
  title: 'Predicciones',
  icon: 'snowflake-o',
  exact: true,
  roles: 'enterprisemanager, analyst, orgadmin, admin, localmanager, opsmanager',
  validate: [loggedIn, verifyRole],
  titleSingular: 'Predicción',
  baseUrl: '/app/forecasts',
  branchName: 'forecasts',
  detailUrl: '/forecasts/',
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
          return <Link className='button' to={'/forecasts/' + row.uuid}>
            Detalle
          </Link>
        }
      }
    ]
  }
})
