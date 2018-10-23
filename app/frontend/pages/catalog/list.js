import React from 'react';
import ListPage from '~base/list-page';
import { loggedIn, verifyRole } from '~base/middlewares/';
import { testRoles } from '~base/tools';
import Link from '~base/router/link';
import DeleteButton from '~base/components/base-deleteButton'
import api from '~base/api'
import { toast } from 'react-toastify'
import tree from '~core/tree'
import ImportCatalog from './import';
import CreateCatalog from './create';

class Catalog extends ListPage {}

Catalog.opts = opt => {
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
    pageLimit: 20,
    filters: true,
    lengthList: true,
    create: true,
    createComponent: CreateCatalog,
    import: true,
    importComponent: ImportCatalog,
    exact: true,
    roles:
      'admin, orgadmin, analyst, consultor-level-3, consultor-level-2, manager-level-2, manager-level-3',
    canCreate: 'admin, orgadmin, analyst, manager-level-2, manager-level-3',
    validate: [loggedIn, verifyRole],
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
      const cursor = tree.get(opt.branchName)
      console.log(cursor)
      return [
        {
          title: 'Id',
          property: 'externalId',
          default: 'N/A',
          sortable: true,
        },
        {
          title: 'Nombre',
          property: 'name',
          default: 'N/A',
          sortable: true,
        },
        {
          title: 'Acciones',
          formatter: row => {
            const deleteObject = async function () {
              try {
                const url = '/app/catalogItems/' + row.uuid
                await api.del(url)

                const cursor = tree.get(opt.branchName)
                const res = await api.get(opt.baseUrl, {
                  start: (cursor.pageLength * cursor.page) - cursor.pageLength,
                  limit: cursor.pageLength, sort: cursor.sort
                })

                tree.set(opt.branchName, {
                  page: cursor.page,
                  totalItems: res.total,
                  items: res.data,
                  pageLength: cursor.pageLength
                })
                tree.commit()
              } catch (e) {
                toast('Error: ' + e.message, {
                  autoClose: 3000,
                  type: toast.TYPE.ERROR,
                  hideProgressBar: true,
                  closeButton: false
                })
              }
            }

            if (testRoles('consultor-level-3, consultor-level-2')) {
              return (
                <Link
                  className="button is-primary"
                  to={opt.detailUrl + '/' + row.uuid}
                >
                  <span className="icon is-small" title="Visualizar">
                    <i className="fa fa-eye" />
                  </span>
                </Link>
              );
            } else {
              return (
                <div className='field is-grouped'>
                  <div className='control'>
                    <Link
                      className="button is-primary"
                      to={opt.detailUrl + '/' + row.uuid}
                    >
                      <span className="icon is-small" title="Editar">
                        <i className="fa fa-pencil" />
                      </span>
                    </Link>
                  </div>
                  <div className='control'>
                    <DeleteButton
                      iconOnly
                      icon='fa fa-trash'
                      objectName='Usuario'
                      objectDelete={deleteObject}
                      //TODO: translate
                      message={`¿Está seguro de querer desactivar a ${row.name} ?`}
                    />
                  </div>
                </div>
              );
            }
          },
        },
      ];
    },
  });
};

export default Catalog;
