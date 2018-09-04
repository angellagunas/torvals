import React from 'react';
import Link from '~base/router/link';
import moment from 'moment';
import { testRoles } from '~base/tools';

import ListPage from '~base/list-page';
import { loggedIn, verifyRole } from '~base/middlewares/';
import CreateChannel from './create';

export default ListPage({
  path: '/catalogs/channels',
  title: 'Canales',
  icon: 'filter',
  exact: true,
  roles:
    'analyst, orgadmin, admin, consultor-level-2, manager-level-2, consultor-level-3, manager-level-3',
  validate: [loggedIn, verifyRole],
  titleSingular: 'Canal',
  create: true,
  createComponent: CreateChannel,
  export: true,
  exportRole: 'consultor-level-3',
  exportUrl: '/app/channels',
  breadcrumbs: true,
  breadcrumbConfig: {
    path: [
      {
        path: '/',
        label: 'Inicio',
        current: false,
      },
      {
        path: '/admin/catalogs/channels/',
        label: 'Canales',
        current: true,
      },
    ],
    align: 'left',
  },
  canCreate: 'admin, orgadmin, analyst, manager-level-2, manager-level-3',
  baseUrl: '/app/channels',
  branchName: 'channels',
  detailUrl: '/catalogs/channels/',
  filters: true,
  schema: {
    type: 'object',
    required: [],
    properties: {
      general: { type: 'text', title: 'Buscar' },
    },
  },
  uiSchema: {
    general: { 'ui:widget': 'SearchFilter' },
  },
  getColumns: () => {
    return [
      {
        title: 'Nombre',
        property: 'name',
        default: 'N/A',
        sortable: true,
        formatter: row => {
          return <Link to={'/catalogs/channels/' + row.uuid}>{row.name}</Link>;
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
          if (testRoles('consultor-level-3, consultor-level-2')) {
            return (
              <Link
                className="button is-primary"
                to={'/catalogs/channels/' + row.uuid}
              >
                <span className="icon is-small" title="Visualizar">
                  <i className="fa fa-eye" />
                </span>
              </Link>
            );
          } else {
            return (
              <Link
                className="button is-primary"
                to={'/catalogs/channels/' + row.uuid}
              >
                <span className="icon is-small" title="Editar">
                  <i className="fa fa-pencil" />
                </span>
              </Link>
            );
          }
        },
      },
    ];
  },
});
