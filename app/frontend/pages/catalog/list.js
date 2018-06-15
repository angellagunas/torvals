import React from 'react'
import ListPage from '~base/list-page'
import { loggedIn, verifyRole } from '~base/middlewares/'
import { testRoles } from '~base/tools'
import Link from '~base/router/link'
import ImportCatalog from './import'
import CreateCatalog from './create'

class Catalog extends ListPage {

}

Catalog.opts = (opt) => {
  return ListPage({
    baseUrl: opt.baseUrl,
    name: opt.name,
    path: opt.path,
    title: opt.title,
    icon: 'list-alt',
    breadcrumbs: opt.breadcrumbs,
    breadcrumbConfig: opt.breadcrumbConfig,
    branchName: opt.branchName,
    titleSingular: opt.titleSingular,
    detailUrl: opt.detailUrl + '/',
    filters: opt.filters,
    create: true,
    createComponent: CreateCatalog,
    import: true,
    importComponent: ImportCatalog,
    exact: true,
    roles: 'admin, orgadmin, analyst, consultor, consultor-level-2, manager-level-2',
    canCreate: 'admin, orgadmin, analyst, manager-level-2',
    validate: [loggedIn, verifyRole],
    schema: {
      type: 'object',
      required: [],
      properties: {
        general: { type: 'text', title: 'Buscar' }
      }
    },
    uiSchema: {
      general: { 'ui:widget': 'SearchFilter' }
    },
    getColumns: () => {
      return [
        {
          'title': 'Id',
          'property': 'externalId',
          'default': 'N/A',
          'sortable': true
        },
        {
          'title': 'Nombre',
          'property': 'name',
          'default': 'N/A',
          'sortable': true
        },
        {
          'title': 'Acciones',
          formatter: (row) => {
            if (testRoles('consultor, consultor-level-2')) {
              return (
                <Link className='button is-primary' to={opt.detailUrl + '/' + row.uuid}>
                  <span className='icon is-small' title='Visualizar'>
                    <i className='fa fa-eye' />
                  </span>
                </Link>
              )
            } else {
              return (
                <Link className='button is-primary' to={opt.detailUrl + '/' + row.uuid}>
                  <span className='icon is-small' title='Editar'>
                    <i className='fa fa-pencil' />
                  </span>
                </Link>
              )
            }
          }
        }
      ]
    }
  })
}

export default Catalog
