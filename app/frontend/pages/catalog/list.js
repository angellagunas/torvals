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
    roles: 'admin, orgadmin, analyst, consultor-level-3, consultor-level-2, manager-level-2, manager-level-3',
    canCreate: 'admin, orgadmin, analyst, manager-level-2, manager-level-3',
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
    getColumns: opt.columns
  })
}

export default Catalog
