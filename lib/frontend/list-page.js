import React, { Component } from 'react'
import { Route, Redirect } from 'react-router-dom'
import { branch } from 'baobab-react/higher-order'
import PropTypes from 'baobab-react/prop-types'
import { testRoles } from '~base/tools'
import _ from 'lodash'
import api from '~base/api'
import { injectIntl } from 'react-intl'

import { BranchedPaginatedTable } from '~base/components/base-paginated-table'
import BaseFilterPanel from '~base/components/base-filters'

import env from '~base/env-variables'

import SidePanel from './side-panel'
import Breadcrumb from '~base/components/base-breadcrumb'

const FileSaver = require('file-saver')

//import Select from '../../app/frontend/pages/projects/detail-tabs/select.js'

import Select from 'react-select';

class Context {
  throw(status, message) {
    this.hasError = true
    this.error = { status, message }
  }

  redirect(uri) {
    this.hasRedirect = true
    this.redirectTo = uri
  }
}

export default function (options = {}) {
  class ListPage extends Component {
    constructor(props) {
      super(props)
      this.state = {
        className: '',
        filters: options.defaultFilters || { general: '' },
        pageLength: 10,
        salesCenters: [],
        salesCenter: ''
      }

      if (options.filters) {
        this.handleOnFilter = (filters) => {
          this.setState({ filters })
        }
      }
    }

    componentWillMount() {
      const pageLength = options.pageLimit || 10

      this.setState({ pageLength })

      this.context.tree.set(options.branchName, {
        page: 1,
        totalItems: 0,
        items: [],
        pageLength
      })
      this.context.tree.commit()

      this.loadValues()
      if(options.selectComponent && this.state.salesCenters.length === 0) {
        this.getFilters()
      }
    }

    async export(url) {
      var url = url + '/export/csv'
      const body = await api.get(url)

      const blob = new Blob(body.split(''), { type: 'text/csv;charset=utf-8' })
      FileSaver.saveAs(blob, url)
    }

    async getFilters() {
      const url = '/app/rows/filters/organization/' + this.context.tree.get('organization').uuid

      try {
        const res = await api.get(url)
        this.setState({
          salesCenters: res['centro-de-venta']
        })
      } catch (error) {
        console.error('getFilters error:', error)
      }
    }

    getFilterComponent() {
      if (options.filters) {
        const { filters } = this.state
        return (
          <BaseFilterPanel
            schema={options.schema}
            uiSchema={options.uiSchema}
            filters={filters}
            onFilter={this.handleOnFilter.bind(this)}
          />
        )
      }
      return null
    }

    getCreateComponent() {
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
              {this.formatTitle('catalogs.new')} {options.translate ? this.formatTitle(options.titleSingular)
              : options.titleSingular}
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
              title={options.title}
            />
          </div>
        )
      }
    }


    getImportComponent() {
      if (options.import) {
        const canCreate = testRoles(options.canCreate)
        if (!canCreate) {
          return null
        }

        this.showModalImport = () => {
          this.setState({
            classNameImport: ' is-active'
          })
        }

        this.hideModalImport = () => {
          this.setState({
            classNameImport: ''
          })
        }

        this.finishUpImport = () => {
          this.setState({
            classNameImport: ''
          })
          this.load()
        }

        return (
          <div className="card-header-select">
            <button
              type="button"
              className="button is-primary"
              onClick={() => this.showModalImport()}
            >
              {this.formatTitle('catalogs.import')} {
                options.titleSingular
                  ? options.translate ? this.formatTitle(options.titleSingular)
                    : options.titleSingular : ''}
            </button>
            <options.importComponent
              className={this.state.classNameImport}
              hideModal={this.hideModalImport.bind(this)}
              finishUp={this.finishUpImport.bind(this)}
              branchName={options.branchName}
              baseUrl={options.baseUrl}
              url={options.baseUrl}
              canCreate={canCreate}
              canEdit={canCreate}
              title={options.title}
            />
          </div>
        )
      }

      return null
    }

    getExportComponent() {
      if (testRoles(options.exportRole) && options.export) {
        return (
          <div className="card-header-select">
            <button
              type="button"
              className="button is-primary"
              onClick={() => this.export(options.exportUrl)}
            >
              Exportar
            </button>
          </div>
        )
      }
      return null
    }

    getSidePanelComponent() {
      if (options.sidePanel) {
        const sideClass = options.filters ? 'sidepanel' : 'searchbox'
        return (
          <SidePanel
            sidePanelClassName={sideClass}
            icon={options.sidePanelIcon}
            title={`Nuevo ${options.titleSingular}`}
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
      return null
    }

    async loadValues() {
      if (options.filters) {
        if (options.loadValues) {
          const res = await options.loadValues()
          const keys = Object.keys(res)

          for (let k of keys) {
            options.schema.properties[k]['values'] = res[k]
          }

          this.setState(res)
        }
      }
    }

    pageLengthComponent() {
      if (options.lengthList) {
        const { pageLength } = this.state
        const values = [parseInt(options.pageLimit, 10), 30, 50, 100]

        return (
          <div className="field">
            <div className="control has-icons-right">
              <div className="select">
                <select
                  value={pageLength}
                  onChange={e => this.lengthChange(e)}
                >
                  {
                    values.map(value => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))
                  }
                </select>
              </div>
            </div>
          </div>
        )
      }

      return null
    }

    lengthChange(event = {}) {
      const { filters } = this.state
      const pageLength = parseInt(event.target.value, 10)
      const values = this.context.tree.get(options.branchName)

      this.context.tree.set(options.branchName, {
        ...values,
        pageLength
      })

      this.context.tree.commit()

      this.setState({
        pageLength,
        filters: {
          ...filters,
          limit: pageLength
        }
      })
    }

    async load() {
      const { pageLength } = this.state

      const res = await api.get(options.baseUrl, {
        page: 1,
        limit: pageLength,
        ...(options.apiParams || {})
      })

      this.context.tree.set(options.branchName, {
        page: 1,
        totalItems: res.total,
        items: res.data,
        pageLength
      })
      this.context.tree.commit()
    }

    salesCenterComponent() {
      if(options.selectComponent) {
        const ceVes = this.state.salesCenters.map(ceve => {
          let obj = {}
          obj['value'] = ceve.uuid
          obj['label'] = ceve.externalId + " - " +  ceve.name
          return obj
        })

        return(
          <Select
          autosize={false}
          placeholder="Centro de Venta"
          options={ceVes}
          onChange={opt => this.setSalesCenter(opt)}
          value={this.state.salesCenter}
          />
        )
      }

      return null
    }

    setSalesCenter(value) {
      //FIXME:
      //       this component is currently piggibacking from the general search component,
      //       and will not work in conjunction with it

      const { filters } = this.state
      const ceve = value === null ? "" : value

      this.setState({
        filters: {
          ...filters,
          general: ceve.label
        },
        salesCenter: ceve
      })
    }

    clearSearch() {
      this.setState({
        salesCenter: ""
      })
    }

    generalSearchComponent() {
      if (options.filters) {
        const { filters } = this.state

        return (
          <div className="field">
            <div className="control has-icons-right">
              <input
                className="input input-search"
                type="text"
                value={!options.selectComponent ? (filters.general || filters.name) : filters.name}
                onChange={e => this.generalSearchOnChange(e)}
                placeholder={this.formatTitle('dashboard.searchText')}
              />
              <span className="icon is-small is-right">
                <i className="fa fa-search" />
              </span>
            </div>
          </div>
        )
      }

      return null
    }

    generalSearchOnChange(e) {
      const { filters, salesCenter } = this.state
      const { value } = e.target
      const newFilters = {
        ...filters,
        general: value
      }

      if (options.selectComponent) {
        newFilters.name = value
      }

      // Clears the SalesCenter select input to avoid messing the search query
      if (options.selectComponent && salesCenter !== '') {
        this.clearSearch()
      }

      this.setState({ filters: newFilters })
    }

    formatTitle(id) {
      return this.props.intl.formatMessage({ id })
    }

    render() {
      const { filters } = this.state
      return (
        <div>
          <div className="section-header">
            <h2>{options.translate ? this.formatTitle(options.title) : options.title}</h2>
          </div>

          <div className="columns is-marginless list-page">
            <div className="column is-paddingless">

              <div className="level">
                <div className="level-left">
                  <div className="level-item">
                    {options.breadcrumbs && (
                      <Breadcrumb
                        path={options.translate
                          ? options.breadcrumbConfig.path.map(item => ({
                            ...item,
                            label: this.formatTitle(item.label),
                          }))
                          : options.breadcrumbConfig.path}
                        align={options.breadcrumbConfig.align}
                      />
                    )}
                  </div>
                </div>
                <div className="level-right has-20-margin-top">
                  <div className="level-item field is-grouped is-grouped-right">
                    <div className="control level-item">
                      {this.salesCenterComponent()}
                    </div>
                    <div className="control">
                      {this.generalSearchComponent()}
                    </div>
                    <div className="control">
                      {this.pageLengthComponent()}
                    </div>
                    <div className="control">
                      {this.getCreateComponent()}
                    </div>
                    <div className="control">
                      {this.getImportComponent()}
                    </div>
                    <div className="control">
                      {this.getExportComponent()}
                    </div>
                  </div>

                </div>
              </div>

              <div className="columns">
                <div className="column">
                  <BranchedPaginatedTable
                    branchName={options.branchName}
                    baseUrl={options.baseUrl}
                    apiParams={(options.apiParams || {})}
                    modifyData={options.modifyData}
                    sortable={options.sortable || true}
                    columns={options.translate
                      ? options.getColumns().map(item => ({
                        ...item,
                        title: this.formatTitle(item.title),
                      }))
                      : options.getColumns()
                    }
                    sortedBy={options.sortBy || 'name'}
                    filters={filters}
                    noDataComponent={options.noDataComponent}
                  />
                </div>
              </div>

            </div>
            {options.filterPanel && this.getFilterComponent()}
            {this.getSidePanelComponent()}
          </div>
        </div>
      )
    }
  }

  ListPage.contextTypes = {
    tree: PropTypes.baobab
  }

  const BranchedListPage = branch({
    branch: options.branchName
  }, injectIntl(ListPage))

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
    },
    asRouterItemList: (key) => {
      return <Route key={key} exact={options.exact} path={env.PREFIX + options.path} render={props => {
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
          return <Redirect to={{ pathname: env.PREFIX + ctx.redirectTo }} />
        }

        return <BranchedListPage {...props} />
      }} />
    }
  }
}
