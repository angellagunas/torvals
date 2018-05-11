import React, { Component } from 'react'
import {Route, Redirect} from 'react-router-dom'
import { branch } from 'baobab-react/higher-order'
import PropTypes from 'baobab-react/prop-types'
import { testRoles } from '~base/tools'
import _ from 'lodash'
import api from '~base/api'

import { BranchedPaginatedTable } from '~base/components/base-paginated-table'
import BaseFilterPanel from '~base/components/base-filters'

import env from '~base/env-variables'

import SidePanel from './side-panel'
import Breadcrumb from '~base/components/base-breadcrumb'

const FileSaver = require('file-saver')

class Context {
  throw (status, message) {
    this.hasError = true
    this.error = {status, message}
  }

  redirect (uri) {
    this.hasRedirect = true
    this.redirectTo = uri
  }
}

export default function (options) {
  class ListPage extends Component {
    constructor (props) {
      super(props)
      this.state = {
        className: '',
        filters: options.defaultFilters || {}
      }

      if (options.filters) {
        this.handleOnFilter = (filters) => {
          this.setState({filters})
        }
      }
    }

    componentWillMount () {
      this.context.tree.set(options.branchName, {
        page: 1,
        totalItems: 0,
        items: [],
        pageLength: 10
      })
      this.context.tree.commit()

      this.loadValues()
    }

    async loadValues () {
      if (options.filters) {
        if (options.loadValues) {
          var res = await options.loadValues()

          var keys = Object.keys(res)
          for (var k of keys) {
            options.schema.properties[k]['values'] = res[k]
          }

          this.setState(res)
        }
      }
    }

    async export (url) {
      var url = url + '/export/csv'
      const body = await api.get(
        url
      )

      var blob = new Blob(body.split(''), {type: 'text/csv;charset=utf-8'})
      FileSaver.saveAs(blob, url)

      console.log(body)
    }

    getFilterComponent () {
      if (options.filters) {
        return (
          <BaseFilterPanel
            schema={options.schema}
            uiSchema={options.uiSchema}
            filters={this.state.filters}
            onFilter={this.handleOnFilter.bind(this)}
          />
        )
      }
    }

    getCreateComponent () {
      if (options.create) {
        const canCreate = testRoles(options.canCreate)
        if (!canCreate) {
          return
        }

        this.showModal = () => {
          this.setState({
            className: ' is-active'
          })
        }

        this.hideModal = () => {
          this.setState({
            className: ''
          })
        }

        this.finishUp = (object) => {
          this.setState({
            className: ''
          })
          this.props.history.push(options.detailUrl + object.uuid)
        }

        return (
          <div className='card-header-select'>
            <button className='button is-primary' onClick={() => this.showModal()}>
              Nuevo {options.titleSingular}
            </button>
            <options.createComponent
              className={this.state.className}
              hideModal={this.hideModal.bind(this)}
              finishUp={this.finishUp.bind(this)}
              branchName={options.branchName}
              baseUrl={options.baseUrl}
              url={options.baseUrl}
              canCreate={canCreate}
              canEdit={canCreate}
            />
          </div>
        )
      }
    }

    getExportComponent () {
      if (testRoles(options.exportRole) && options.export) {
        return (
          <div className='card-header-select'>
            <button className='button is-primary' onClick={() => this.export(options.exportUrl)}>
              Exportar
            </button>
          </div>
        )
      }
    }

    getSidePanelComponent () {
      if (options.sidePanel) {
        let sideClass = options.filters ? 'sidepanel' : 'searchbox'
        return (
          <SidePanel
            sidePanelClassName={sideClass}
            icon={options.sidePanelIcon}
            title={'Nuevo ' + options.titleSingular}
            content={
              <options.sidePanelComponent
                branchName={options.branchName}
                baseUrl={options.baseUrl}
                url={options.baseUrl}
              />
            }
          />
        )
      }
    }

    render () {
      return (
        <div>
          <div className='section-header'>
            <h2>{options.title}</h2>
          </div>

          <div className='columns is-marginless list-page'>
            <div className='column is-paddingless'>

              <div className='level'>
                <div className='level-left'>
                  <div className='level-item'>
                    {options.breadcrumbs && (
                      <Breadcrumb
                        path={options.breadcrumbConfig.path}
                        align={options.breadcrumbConfig.align}
                      />
                    )}
                  </div>
                </div>
                <div className='level-right has-20-margin-top'>
                  <div className='level-item field is-grouped is-grouped-right'>
                    <div className='control'>
                      {this.getCreateComponent()}
                    </div>
                    <div className='control'>
                      {this.getExportComponent()}
                    </div>
                  </div>
                </div>
              </div>

              <div className='columns'>
                <div className='column'>
                  <BranchedPaginatedTable
                    branchName={options.branchName}
                    baseUrl={options.baseUrl}
                    sortable={options.sortable || true}
                    columns={options.getColumns()}
                    sortedBy={options.sortBy || 'name'}
                    filters={this.state.filters}
                      />
                </div>
              </div>

            </div>
            {this.getFilterComponent()}
            {this.getSidePanelComponent()}
          </div>
        </div>
      )
    }
  }

  ListPage.contextTypes = {
    tree: PropTypes.baobab
  }

  const BranchedListPage = branch({branch: options.branchName}, ListPage)

  return {
    asSidebarItem: () => {
      const ctx = new Context()

      if (options.validate) {
        if (_.isArray(options.validate)) {
          for (var validate of options.validate) {
            if (!ctx.hasError || !ctx.hasRedirect) {
              validate(ctx, options)
            }
          }
        } else {
          options.validate(ctx, options)
        }
      }

      if (ctx.hasError || ctx.hasRedirect) {
        return null
      }

      return {
        title: options.title,
        icon: options.icon,
        to: options.path,
        exact: options.exact
      }
    },
    asRouterItem: () => {
      return <Route exact={options.exact} path={env.PREFIX + options.path} render={props => {
        const ctx = new Context()

        if (options.validate) {
          if (_.isArray(options.validate)) {
            for (var validate of options.validate) {
              if (!ctx.hasError || !ctx.hasRedirect) {
                validate(ctx, options)
              }
            }
          } else {
            options.validate(ctx, options)
          }
        }

        if (ctx.hasError) {
          console.log('should error with', ctx.error)
          return <div>Has error {ctx.error.status}</div>
        }

        if (ctx.hasRedirect) {
          console.log('should redirect to', ctx.redirectTo)
          return <Redirect to={{pathname: env.PREFIX + ctx.redirectTo}} />
        }

        return <BranchedListPage {...props} />
      }} />
    }
  }
}
