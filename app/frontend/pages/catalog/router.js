import React, { Component } from 'react'
import tree from '~core/tree'
import Catalogs from './list'

class CatalogRouter extends Component {
  constructor(props){
    super(props)
    this.state = {
      rules: tree.get('user').currentOrganization.rules
    }
  }
  cleanName = (item) => {
    let c = item.replace(/-/g, ' ')
    return c.charAt(0).toUpperCase() + c.slice(1)
  }

  catalogs = () => {
    return this.state.rules.catalogs.map(item => {
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

      return Catalogs.opts(config).asRouterItem()
    })
  }
  render () {
    if(!this.state.rules){
      return 'cargando'
    }
    return (
      this.catalogs()
    )
  }
}

export default CatalogRouter