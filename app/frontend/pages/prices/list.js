import React from 'react'
import moment from 'moment'
import { testRoles } from '~base/tools'
import api from '~base/api'
import { toast } from 'react-toastify'
import tree from '~core/tree'

import ListPage from '~base/list-page'
import {loggedIn, verifyRole} from '~base/middlewares/'
import Editable from '~base/components/base-editable'

export default ListPage({
  path: '/catalogs/prices',
  title: 'Precios',
  titleSingular: 'Precio',
  icon: 'list-alt',
  roles: 'admin, orgadmin, analyst, consultor-level-3, consultor-level-2, manager-level-2, manager-level-3',
  exact: true,
  validate: [loggedIn, verifyRole],
  create: false,
  export: true,
  exportRole: 'consultor-level-3',
  exportUrl: '/app/prices',
  breadcrumbs: true,
  breadcrumbConfig: {
    path: [
      {
        path: '/',
        label: 'Inicio',
        current: false
      },
      {
        path: '/',
        label: 'Administración',
        current: true
      },
      {
        path: '/',
        label: 'Catálogos',
        current: true
      },
      {
        path: '/catalogs/prices',
        label: 'Precios',
        current: true
      }
    ],
    align: 'left'
  },
  baseUrl: '/app/prices',
  branchName: 'prices',
  detailUrl: '/catalogs/prices/',
  filters: true,
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
          'title': ` ${catalog.name}`,
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
          'title': 'Id',
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
          'title': 'Producto',
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
          'title': 'Precio',
          'property': 'price',
          'default': 'N/A',
          'sortable': true,
          'className': 'editable-cell',
          formatter: (row) => {
            if (row && row.price) {
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
                        if (Number(value) !== Number(row.price)) {
                        const res = await api.post('/app/prices/' + row.uuid, {
                          price: value,
                          channel: row.channel.name,
                          product: row.product.name
                        })
                        if (!res) {
                          return false
                        }
                        toast('¡Precio guardado!: ', {
                          autoClose: 5000,
                          type: toast.TYPE.INFO,
                          hideProgressBar: true,
                          closeButton: false
                        })
                        return res
                      }
                      } catch (e) {
                        toast('Error: ' + e.message, {
                        autoClose: 5000,
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
          'title': 'Creado',
          'property': 'dateCreated',
          'default': 'N/A',
          'sortable': true,
          formatter: (row) => {
            return (
            moment.utc(row.dateCreated).local().format('DD/MM/YYYY hh:mm a')
            )
          }
        }
      ]

    return cols
  }
})
