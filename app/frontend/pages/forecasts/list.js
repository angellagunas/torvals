import React from 'react';
import Link from '~base/router/link';
import moment from 'moment';

import ListPage from '~base/list-page';
import { loggedIn, verifyRole } from '~base/middlewares/';

export default ListPage({
  path: '/forecasts',
  title: 'Predicciones',
  icon: 'snowflake-o',
  exact: true,
  roles:
    'consultor-level-3, analyst, orgadmin, admin, manager-level-1, consultor-level-2, manager-level-2',
  validate: [loggedIn, verifyRole],
  titleSingular: 'Predicción',
  breadcrumbs: true,
  breadcrumbConfig: {
    path: [
      {
        path: '/',
        label: 'Inicio',
        current: false,
      },
      {
        path: '/forcasts',
        label: 'Forecasts',
        current: true,
      },
    ],
    align: 'left',
  },
  baseUrl: '/app/forecasts',
  branchName: 'forecasts',
  detailUrl: '/forecasts/',
  getColumns: () => {
    return [
      {
        title: 'Status',
        property: 'status',
        default: 'N/A',
        sortable: true,
      },
      {
        title: 'Fecha Inicio',
        property: 'dateStart',
        default: 'N/A',
        sortable: true,
        formatter: row => {
          return moment
            .utc(row.dateStart)
            .local()
            .format('DD/MM/YYYY');
        },
      },
      {
        title: 'Fecha Fin',
        property: 'dateEnd',
        default: 'N/A',
        sortable: true,
        formatter: row => {
          return moment
            .utc(row.dateEnd)
            .local()
            .format('DD/MM/YYYY');
        },
      },
      {
        title: 'Creado',
        property: 'dateCreated',
        default: 'N/A',
        sortable: true,
        formatter: row => {
          return moment
            .utc(row.dateCreated)
            .local()
            .format('DD/MM/YYYY hh:mm a');
        },
      },
      {
        title: 'Acciones',
        formatter: row => {
          return (
            <Link className="button" to={'/forecasts/' + row.uuid}>
              Detalle
            </Link>
          );
        },
      },
    ];
  },
});
