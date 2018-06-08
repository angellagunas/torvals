import React, { Component } from 'react'
import tree from '~core/tree'
import Catalogs from './list'
import NotFound from '~base/components/not-found'
import env from '~base/env-variables'
import {
  Route,
  Redirect
} from 'react-router-dom'

const NoMatch = () => {
  if (window.location.pathname === '/') {
    return <Redirect to={{ pathname: env.PREFIX + 'dashboard' }} />
  }
  return (<NotFound />)
}

class CatalogRouter extends Component {
  constructor(props){
    super(props)
  }
  cleanName = (item) => {
    let c = item.replace(/-/g, ' ')
    return c.charAt(0).toUpperCase() + c.slice(1)
  }

  catalogs = (rules) => {
    return rules.catalogs.map(item => {
      let config =
      {
        name: this.cleanName(item),
        path: '/catalogs/' + item,
        title: this.cleanName(item),
        breadcrumbs: true,
        breadcrumbConfig: {
          path: [
            {
              path: '/',
              label: 'Inicio',
              current: false
            },
            {
              path: '/catalogs/' + item,
              label: 'Catalogos',
              current: true
            },
            {
              path: '/catalogs/' + item,
              label: this.cleanName(item),
              current: true
            }
          ],
          align: 'left'
        },
        branchName: item,
        titleSingular: this.cleanName(item),
        baseUrl: '/app/catalogItems/' + item,
        detailUrl: '/catalogs/' + item
      }

      return Catalogs.opts(config).asRouterItemList(item)
    })
  }
  render () {
    let user = tree.get('user')
    if(user && user.currentOrganization){
      return (
        this.catalogs(user.currentOrganization.rules)
      )
    }
    else return <Route component={NoMatch} />
       
    
  }
}

export default CatalogRouter