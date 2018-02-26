import React, { Component } from 'react'
import {Route, Redirect} from 'react-router-dom'
import { branch } from 'baobab-react/higher-order'
import PropTypes from 'baobab-react/prop-types'
import { testRoles } from '~base/tools'
import _ from 'lodash'

import { BranchedPaginatedTable } from '~base/components/base-paginatedTable'
import BaseFilterPanel from '~base/components/base-filters'

import env from '~base/env-variables'

import SidePanel from './side-panel'

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

    getSidePanelComponent () {
      if (options.sidePanel) {
        let sideClass = options.filters ? 'sidepanel' : 'searchbox'
        return <SidePanel sidePanelClassName={sideClass} icon={options.sidePanelIcon} title={'Nuevo ' + options.titleSingular} content={<options.sidePanelComponent
          branchName={options.branchName}
          baseUrl={options.baseUrl}
          url={options.baseUrl}
        />} />
      }
    }

    render () {
      return (
        <div className='columns c-flex-1 is-marginless'>
          <div className='column is-paddingless'>
            <div className='section is-paddingless-top pad-sides'>
              <h1 className='is-size-3 is-padding-top-small is-padding-bottom-small'>{options.title}</h1>
              <div className='card'>
                <header className='card-header'>
                  <p className='card-header-title'>
                    {options.title}
                  </p>
                  {this.getCreateComponent()}
                </header>
                <div className='card-content'>
                  <div className='columns'>
                    <div className='column'>
                      <BranchedPaginatedTable
                        branchName={options.branchName}
                        baseUrl={options.baseUrl}
                        columns={options.getColumns()}
                        sortedBy={options.sortBy || 'name'}
                        filters={this.state.filters}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {this.getFilterComponent()}
          {this.getSidePanelComponent()}
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
