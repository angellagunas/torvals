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
        name: item.name,
        path: '/catalogs/' + item.slug,
        title: item.name,
        breadcrumbs: true,
        breadcrumbConfig: {
          path: [
            {
              path: '/',
              label: 'Inicio',
              current: false
            },
            {
              path: '/catalogs/' + item.slug,
              label: 'Catalogos',
              current: true
            },
            {
              path: '/catalogs/' + item.slug,
              label: item.name,
              current: true
            }
          ],
          align: 'left'
        },
        branchName: item.slug,
        titleSingular: item.name,
        baseUrl: '/app/catalogItems/' + item.slug,
        detailUrl: '/catalogs/' + item.slug
      }

      return Catalogs.opts(config).asRouterItemList(item.slug)
    })
  }
  render () {
    let rule = tree.get('rule')
    if(rule){
      return (
        this.catalogs(rule)
      )
    }
    else return <Route component={NoMatch} />
       
    
  }
}

export default CatalogRouter