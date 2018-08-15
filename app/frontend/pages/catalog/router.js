import React, { Component } from 'react'
import tree from '~core/tree'
import Catalogs from './list'
import NotFound from '~base/components/not-found'
import env from '~base/env-variables'
import {
  Route,
  Redirect
} from 'react-router-dom'
import { defaultCatalogs } from '~base/tools'
import { injectIntl } from 'react-intl'
import { testRoles } from '~base/tools'
import Link from '~base/router/link'

const NoMatch = () => {
  if (window.location.pathname === '/') {
    return <Redirect to={{ pathname: env.PREFIX + 'dashboard' }} />
  }
  return (<NotFound />)
}

class CatalogRouter extends Component {
  constructor(props) {
    super(props)
  }
  cleanName = (item) => {
    let c = item.replace(/-/g, ' ')
    return c.charAt(0).toUpperCase() + c.slice(1)
  }

  formatTitle(id) {
    return this.props.intl.formatMessage({ id: id })
  }

  findInCatalogs(slug) {
    let find = false
    defaultCatalogs.map(item => {
      if (item.value === slug) {
        find = true
      }
    })
    return find
  }

  catalogs = (rules) => {
    return rules.catalogs.map(item => {
      let title = item.name
      if (this.findInCatalogs(item.slug)) {
        title = this.formatTitle('catalogs.' + item.slug)
      }
      let config =
        {
          name: title,
          path: '/catalogs/' + item.slug,
          title: title,
          breadcrumbs: true,
          breadcrumbConfig: {
            path: [
              {
                path: '/',
                label: this.formatTitle('sideMenu.admin'),
                current: true
              },
              {
                path: '/catalogs/' + item.slug,
                label: this.formatTitle('sideMenu.catalogs'),
                current: true
              },
              {
                path: '/catalogs/' + item.slug,
                label: title,
                current: true
              }
            ],
            align: 'left'
          },
          branchName: item.slug,
          titleSingular: title,
          baseUrl: '/app/catalogItems/' + item.slug,
          detailUrl: '/catalogs/' + item.slug,
          columns: () => {
            return [
              {
                'title': this.formatTitle('tables.colId'),
                'property': 'externalId',
                'default': 'N/A',
                'sortable': true
              },
              { 
                'title': this.formatTitle('tables.colName'),
                'property': 'name',
                'default': 'N/A',
                'sortable': true
              },
              { 
                'title': this.formatTitle('tables.colActions'),
                formatter: (row) => {
                  if (testRoles('consultor-level-3, consultor-level-2')) {
                    return (
                      <Link className='button is-primary' to={'/catalogs/' + item.slug + '/' + row.uuid}>
                        <span className='icon is-small' title='Visualizar'>
                          <i className='fa fa-eye' />
                        </span>
                      </Link>
                    )
                  } else {
                    return (
                      <Link className='button is-primary' to={'/catalogs/' + item.slug + '/' + row.uuid}>
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
        }

      return Catalogs.opts(config).asRouterItemList(item.slug)
    })
  }
  render() {
    let rule = tree.get('rule')
    if (rule) {
      return (
        this.catalogs(rule)
      )
    }
    else return <Route component={NoMatch} />


  }
}

export default injectIntl(CatalogRouter)
