import React from 'react'
import moment from 'moment'
import { testRoles } from '~base/tools'
import api from '~base/api'
import { toast } from 'react-toastify'
import tree from '~core/tree'

import ListPage from '~base/list-page'
import ImportPrices from './import'
import { loggedIn, verifyRole } from '~base/middlewares/'
import Editable from '~base/components/base-editable'
import DeleteButton from '~base/components/base-deleteButton'
import Link from '~base/router/link'

export default ListPage({
  translate: true,
  path: '/catalogs/prices',
  title: 'sideMenu.prices',
  titleSingular: 'catalogs.precio',
  icon: 'list-alt',
  roles: 'admin, orgadmin, analyst, consultor-level-3, consultor-level-2, manager-level-2, manager-level-3',
  exact: true,
  validate: [loggedIn, verifyRole],
  create: false,
  import: true,
  importComponent: ImportPrices,
  export: true,
  exportRole: 'consultor-level-3',
  exportUrl: '/app/prices',
  breadcrumbs: true,
  breadcrumbConfig: {
    path: [
      {
        path: '/',
        label: 'sideMenu.home',
        current: false
      },
      {
        path: '/',
        label: 'sideMenu.admin',
        current: true
      },
      {
        path: '/',
        label: 'sideMenu.catalogs',
        current: true
      },
      {
        path: '/catalogs/prices',
        label: 'sideMenu.prices',
        current: true
      }
    ],
    align: 'left'
  },
  baseUrl: '/app/prices',
  branchName: 'prices',
  detailUrl: '/catalogs/prices/',
  pageLimit: 20,
  filters: true,
  lengthList: true,
  selectComponent: true,
  schema: {
    type: 'object',
    required: [],
    properties: {
      general: {type: 'text', title: 'Buscar'}
    }
  },
  uiSchema: {
    general: {'ui:widget': 'SearchFilter'}
  },
  getColumns: () => {
    const catalogs = tree.get('rule').catalogs || []
    const catalogItems = catalogs.map((catalog, i) => {
      if (catalog.slug !== 'producto') {
        return (
        {
          'title': 'catalogs.' + catalog.slug,
          'property': '',
          'default': 'N/A',
          'sortable': true,
          formatter: (row) => {
            return row.catalogItems.map(item => {
              if (catalog.slug === item.type) {
                return item.name
              }
            })
          }
        }
        )
      }
    }
    ).filter(item => item)

    let cols =
      [
        {
          'title': 'tables.colId',
          'property': 'product.externalId',
          'default': 'N/A',
          'sortable': true,
          formatter: (row) => {
            if (row.product && row.product.externalId) {
              return row.product.externalId
            }

            return 'N/A'
          }
        },
        {
          'title': 'tables.colProduct',
          'property': 'product',
          'default': 'N/A',
          'sortable': true,
          formatter: (row) => {
            if (row.product && row.product.name) {
              return row.product.name
            }

            return 'N/A'
          }
        },
        ...catalogItems,
        {
          'title': 'catalogs.precio',
          'property': 'price',
          'default': 'N/A',
          'sortable': true,
          'className': 'editable-cell',
          formatter: (row) => {
            if (row && (row.price || row.price === 0)) {
              let price = row.price.toFixed(2).replace(/./g, (c, i, a) => {
                return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
              })
              if (!testRoles('consultor-level-3, consultor-level-2')) {
                return (
                  <Editable
                    value={price}
                    type='text'
                    obj={row}
                    width={100}
                    prepend='$'
                    moneyInput
                    handleChange={async (value, row) => {
                      try {
                        const res = await api.post('/app/prices/' + row.uuid, {
                          price: value
                        })
                        if (!res) {
                          return false
                        }
                        // TODO: translate

                        toast('¡Precio guardado!', {
                          autoClose: 3000,
                          type: toast.TYPE.INFO,
                          hideProgressBar: true,
                          closeButton: false
                        })

                        return res
                      } catch (e) {
                        toast('Error: ' + e.message, {
                          autoClose: 3000,
                          type: toast.TYPE.ERROR,
                          hideProgressBar: true,
                          closeButton: false
                        })
                        return false
                      }
                    }
              }
              />
                )
              } else {
                return '$ ' + price
              }
            }

            return 'N/A'
          }
        },

        {
          'title': 'tables.colCreated',
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
          title: 'tables.colActions',
          formatter: row => {
            const deleteObject = async function () {
              try {
                const url = '/app/prices/' + row.uuid
                await api.del(url)

                const cursor = tree.get('prices')
                const res = await api.get('/app/prices', { start: (20 * cursor.page) - 20, limit: 20, sort: cursor.sort })

                tree.set('prices', {
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
                  to={'/catalogs/prices'}
                >
                  <span className="icon is-small" title="Editar">
                    <i className="fa fa-pencil" />
                  </span>
                </Link>
              )
            }

            return (
              <div className='field is-grouped'>
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
            )
          },
        }
      ]

    return cols
  }
})
