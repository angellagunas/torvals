import React from 'react'
import Link from '~base/router/link'
import moment from 'moment'
import { testRoles } from '~base/tools'
import api from '~base/api'
import { toast } from 'react-toastify'

import ListPage from '~base/list-page'
import {loggedIn, verifyRole} from '~base/middlewares/'
import Editable from '~base/components/base-editable'

export default ListPage({
  path: '/catalogs/prices',
  title: 'Precios',
  titleSingular: 'Precio',
  icon: 'money',
  roles: 'admin, orgadmin, analyst, consultor, manager-level-2',
  exact: true,
  validate: [loggedIn, verifyRole],
  create: false,
  breadcrumbs: true,
  breadcrumbConfig: {
    path: [
      {
        path: '/',
        label: 'Inicio',
        current: false
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
    return [
      {
        'title': 'ID',
        'property': 'productExternalId',
        'default': 'N/A',
        'sortable': true
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

      {
        'title': 'Canal',
        'property': 'channel',
        'default': 'N/A',
        'sortable': true,
        formatter: (row) => {
          if (row.channel && row.channel.name) {
            return row.channel.name
          }

          return 'N/A'
        }
      },

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
            return (

              <Editable
                value={price}
                type='text'
                obj={row}
                width={100}
                prepend='$'
                handleChange={async (value, row) => {
                  try {
                    const res = await api.post('/app/prices/' + row.uuid, {
                      price: value,
                      channel: row.channel.name,
                      product: row.product.name
                    })
                    if (!res) {
                      return false
                    }
                    return res
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
      },
      {
        'title': 'Acciones',
        formatter: (row) => {
          if (testRoles('consultor')) {
            return (
              <Link className='button' to={'/catalogs/prices/' + row.uuid}>
                <span className='icon is-small' title='Visualizar'>
                  <i className='fa fa-eye' />
                </span>
              </Link>
            )
          } else {
            return (
              <Link className='button is-primary' to={'/catalogs/prices/' + row.uuid}>
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
