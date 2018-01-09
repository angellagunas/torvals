import React, { Component } from 'react'
import api from '~base/api'
import Loader from '~base/components/spinner'
import FontAwesome from 'react-fontawesome'
import Link from '~base/router/link'
import moment from 'moment'
import classNames from 'classnames'

import { SelectWidget } from '~base/components/base-form'

import CreateBarGraph from './create-bargraph'
import DeleteButton from '~base/components/base-deleteButton'
import Page from '~base/page'
import {loggedIn} from '~base/middlewares/'

import {
  EditableTable
} from '~base/components/base-editableTable'

import { BranchedPaginatedTable } from '~base/components/base-paginatedTable'
import BaseModal from '~base/components/base-modal'
import ProductForm from './edit-product'
import SalesCenterForm from './edit-salescenter'

let schema = {
  weeks: {
    type: 'string',
    title: 'Semanas',
    enum: [],
    enumNames: []
  },
  salesCenters: {
    type: 'string',
    title: 'Semanas',
    enum: [],
    enumNames: []
  },
  products: {
    type: 'string',
    title: 'Semanas',
    enum: [],
    enumNames: []
  }
}

class ForecastDetail extends Component {
  constructor (props) {
    super(props)
    this.state = {
      className: '',
      classNameSC: '',
      isProductsOpen: false,
      isHeaderOpen: false,
      bodyHeight: 0,
      loading: true,
      loaded: false,
      predictions: [],
      forecast: {},
      graphDataFiltered: [],
      selectedRows: {},
      selectValue: '',
      selectedAll: false,
      predictionsFormatted: [],
      predictionsFiltered: [],
      schema: {},
      weekSelected: 0,
      weeksOptions: {
        enumOptions: []
      },
      salesCentersSelected: '',
      salesCentersOptions: {
        enumOptions: []
      },
      productsSelected: '',
      productsOptions: {
        enumOptions: []
      },
      days: [],
      disableButtons: true,
      graphProductSelected: '',
      graphIsPristine: true,
      notification: {
        has: false,
        type: '',
        message: ''
      }
    }
  }

  componentWillMount () {
    this.load()
    this.interval = setInterval(() => this.load(), 30000)
  }

  componentWillUnmount () {
    clearInterval(this.interval)
  }

  /*
   * Endpoints Call
   */

  async load () {
    var url = '/admin/forecasts/' + this.props.match.params.uuid
    const body = await api.get(url)

    this.setState({
      loading: false,
      loaded: true,
      forecast: body.data,
      graphDataFiltered: body.data.graphData
    })

    this.loadSalesCenters()
    this.loadPredictions()
    this.loadProducts()
  }

  async loadSalesCenters () {
    let url = '/admin/salesCenters'
    let body = await api.get(url, {limit: 0, organization: this.state.forecast.uuid, predictions: this.state.forecast.uuid})
    if (body.data) {
      body.data = body.data.sort(this.sortByName)
    }
    this.setState({
      loading: false,
      loaded: true,
      salesCentersOptions: {
        enumOptions: body.data
      }
    })
  }

  async loadProducts () {
    let url = '/admin/products/categories'
    let body = await api.get(url, {limit: 0, predictions: this.state.forecast.uuid})

    this.setState({
      loading: false,
      loaded: true,
      productsOptions: {
        enumOptions: body
      }
    })
  }

  async loadPredictions () {
    var url = '/admin/predictions'
    const body = await api.get(url, {forecast: this.state.forecast.uuid})

    this.setState({
      loading: false,
      loaded: true,
      predictions: body.data,
      predictionsFormatted: body.data.map(item => {
        let data = item.data
        let percentage

        if (data.prediction !== data.adjustment) {
          percentage = (data.adjustment - data.prediction) * 100 / data.prediction
        }

        return {
          ...data,
          percentage: percentage,
          product: item.product,
          salesCenter: item.salesCenter,
          wasEdited: data.adjustment !== data.prediction,
          isLimit: (Math.abs(percentage) >= (this.state.forecast.project.adjustment * 100)),
          uuid: item.uuid
        }
      })
    }, function () {
      if (this.state.predictionsFormatted.length > 0) {
        let cache = {}
        this.state.predictionsFormatted
          .sort((a, b) => new Date(a.forecastDate) - new Date(b.forecastDate))
          .map(item => {
            if (!cache[item.semanaBimbo]) {
              cache[item.semanaBimbo] = []
            }
            if (cache[item.semanaBimbo].indexOf(item.forecastDate) === -1) {
              cache[item.semanaBimbo].push(item.forecastDate)
            }
            return {forecastDate: item.forecastDate, semanaBimbo: item.semanaBimbo}
          })

        schema.weeks.groupedByWeeks = cache
        schema.weeks.enum = Object.keys(cache).map(item => item)
        schema.weeks.enumNames = Object.keys(cache).map(item => 'Semana ' + item)

        this.setState({
          schema,
          predictionsFiltered: this.state.predictionsFormatted.map(item => item),
          weekSelected: schema.weeks.enum[0],
          days: schema.weeks.groupedByWeeks[schema.weeks.enum[0]],
          daySelected: schema.weeks.groupedByWeeks[Math.min(...Object.keys(schema.weeks.groupedByWeeks))][0],
          weeksOptions: {
            enumOptions: Object.keys(cache).map(item => {
              return {label: 'Semana ' + item, value: item}
            })
          }
        }, this.filterData)
      }
    })

    console.log('predictions=> ', this.state.predictions)
  }

  async loadDatasetsList () {
    var url = '/admin/datasets/'
    const body = await api.get(url, {
      start: 0,
      limit: 10,
      project: this.state.project.uuid
    })

    var cursor = this.context.tree.select('datasets')

    cursor.set({
      page: 1,
      totalItems: body.total,
      items: body.data,
      pageLength: 10
    })
    this.context.tree.commit()
  }

  async deleteObject () {
    var url = '/admin/forecasts/' + this.props.match.params.uuid
    await api.del(url)
    this.props.history.push(`/admin/projects/detail/${this.state.forecast.project.uuid}`)
  }

  async changeStatusOnClick (status) {
    var url = '/admin/forecasts/change/' + this.props.match.params.uuid
    await api.post(url, {status: status})
    this.load()
  }

  /*
   * Columns for tables
   */

  getColumns () {
    return [
      {
        'title': 'checker',
        'abbreviate': true,
        'abbr': (() => {
          return (<div className='field'>
            <div className='control has-text-centered'>
              <label className='checkbox'>
                <input
                  type='checkbox'
                  checked={this.state.selectedAll}
                  onChange={(e) => this.selectRows(!this.state.selectedAll)} />
              </label>
            </div>
          </div>)
        })(),
        'property': 'checkbox',
        'default': 'N/A',
        formatter: (row, state) => {
          return (<div className='field'>
            <div className='control has-text-centered'>
              <label className='checkbox'>
                <input
                  type='checkbox'
                  checked={state.isRowSelected} />
              </label>
            </div>
          </div>)
        }
      },
      {
        'title': 'Product Id',
        'abbreviate': true,
        'abbr': 'P. Id',
        'property': 'product_id',
        'default': 'N/A',
        formatter: (row) => {
          return String(row.product.externalId)
        }
      },
      {
        'title': 'Product Name',
        'abbreviate': true,
        'abbr': 'P. Name',
        'property': 'product_id',
        'default': 'N/A',
        formatter: (row) => {
          return String(row.product.name)
        }
      },
      {
        'title': 'Centro de venta',
        'abbreviate': true,
        'abbr': 'C. Venta',
        'property': 'agency_id',
        'default': 'N/A',
        formatter: (row) => {
          return String(row.salesCenter.name)
        }
      },
      {
        'title': 'Semana Bimbo',
        'property': 'semanaBimbo',
        'default': 'N/A'
      },
      {
        'title': 'Predicción',
        'property': 'prediction',
        'default': 0
      },
      {
        'title': 'Ajuste anterior',
        'property': 'lastAdjustment',
        'default': 'N/A',
        formatter: (row) => {
          if (row.lastAdjustment) {
            return row.lastAdjustment.toFixed(2)
          }

          return 'N/A'
        }
      },
      {
        'title': 'Ajuste',
        'property': 'adjustment',
        'default': 0,
        'editable': true,
        'type': 'number',
        formatter: (row) => {
          return row.adjustment.toFixed(2)
        }
      },
      {
        'title': 'Porcentaje',
        'property': 'percentage',
        'default': 0,
        'type': 'number',
        formatter: (row) => {
          if (row.percentage) {
            return `${row.percentage.toFixed(2)} %`
          }

          return '0 %'
        }
      },
      {
        'title': '',
        'property': 'isLimit',
        'default': '',
        formatter: (row) => {
          if (row.isLimit) {
            return (
              <span className='icon' title='You have reached the limit of adjustment'>
                <FontAwesome name='warning' />
              </span>
            )
          }

          return ''
        }
      }
    ]
  }

  getColumnsDatasets () {
    return [
      {
        'title': 'Name',
        'property': 'name',
        'default': 'N/A',
        'sortable': true,
        formatter: (row) => {
          return (
            <Link to={'/datasets/detail/' + row.uuid}>
              {row.name}
            </Link>
          )
        }
      },
      {
        'title': 'Status',
        'property': 'status',
        'default': 'new',
        'sortable': true
      },
      {
        'title': 'Actions',
        formatter: (row) => {
          return (
            <div className='field is-grouped'>
              <div className='control'>
                <Link className='button' to={'/datasets/detail/' + row.uuid}>
                  Detalle
                </Link>
              </div>
            </div>
          )
        }
      }
    ]
  }

  /*
   * Common Methods
   */

  async onClickButtonPlus () {
    let rows = {...this.state.selectedRows}

    for (var item in rows) {
      let toAdd = (rows[item].prediction * 0.01)
      if (Math.round(toAdd) === 0) toAdd = 1
      rows[item].edited = true
      var adjustment = rows[item].adjustment
      var newAdjustment = rows[item].adjustment + toAdd
      rows[item].adjustment = newAdjustment
      const res = await this.handleChange(rows[item])
      if (!res) rows[item].adjustment = adjustment
    }
  }

  async onClickButtonMinus () {
    let rows = {...this.state.selectedRows}

    for (var item in rows) {
      let toAdd = (rows[item].prediction * 0.01)
      if (Math.round(toAdd) === 0) toAdd = 1
      rows[item].edited = true
      var adjustment = rows[item].adjustment
      var newAdjustment = rows[item].adjustment - toAdd
      rows[item].adjustment = newAdjustment
      const res = await this.handleChange(rows[item])
      if (!res) rows[item].adjustment = adjustment
    }
  }

  toggleButtons () {
    let disable = true
    let rows = {...this.state.selectedRows}
    if (Object.keys(rows).length) disable = false

    this.setState({
      disableButtons: disable
    })
  }

  setRowsToEdit (row, index) {
    let rows = {...this.state.selectedRows}
    let selectedAll = false

    if (rows.hasOwnProperty(row.uuid)) {
      row.selected = !row.selected
      delete rows[row.uuid]
    } else {
      row.selected = true
      rows[row.uuid] = row
    }

    if (Object.keys(rows).length === this.state.predictionsFiltered.length) {
      selectedAll = !selectedAll
    }

    this.setState({selectedRows: rows, selectedAll}, function () {
      this.toggleButtons()
    })
  }

  sortByName (a, b) {
    if (a.name < b.name) return -1
    if (a.name > b.name) return 1
    return 0
  }

  selectRows (selectAll) {
    let selectedRows = {}
    let predictionsFormatted = this.state.predictionsFormatted.map((item) => {
      if (selectAll) selectedRows[item.uuid] = item

      item.selected = selectAll
      return item
    })

    this.setState({predictionsFormatted, selectedRows, selectedAll: !this.state.selectedAll}, function () {
      this.toggleButtons()
    })
  }

  /*
   * Filters methods
   */

  filterData () {
    const state = this.state
    let predictionsFiltered = state.predictionsFormatted

    if (state.daySelected) {
      predictionsFiltered = predictionsFiltered.filter((item) => {
        return item.forecastDate === state.daySelected
      })
    }

    if (state.salesCentersSelected) {
      predictionsFiltered = predictionsFiltered.filter((item) => {
        return item.salesCenter.uuid === state.salesCentersSelected
      })
    }

    if (state.productsSelected) {
      predictionsFiltered = predictionsFiltered.filter((item) => {
        return item.product.category === state.productsSelected
      })
    }

    this.setState({predictionsFiltered})
  }

  handleFilters (e, name) {
    let obj = {}
    obj[name] = e.target.value
    this.setState(obj, this.filterData)
  }

  selectWeek (e) {
    if (e) {
      this.setState({
        days: this.state.schema.weeks.groupedByWeeks[e],
        weekSelected: e,
        daySelected: this.state.schema.weeks.groupedByWeeks[e][0] || ''
      }, this.filterData)
    } else {
      this.setState({
        days: '',
        weekSelected: '',
        daySelected: ''
      }, this.filterData)
    }
  }

  selectDay (e) {
    this.setState({daySelected: e.target.innerText.replace(/\s/g, '')}, this.filterData)
  }

  getDays () {
    if (!this.state.days) {
      return <div />
    }
    return (<ul>
      {this.state.days.map((item, index) => {
        const tabClass = classNames('', {
          'is-active': this.state.daySelected === item
        })
        return (<li onClick={(e) => this.selectDay(e)} className={tabClass} key={index}>
          <a onClick={(e) => { e.preventDefault() }} >
            <span className='is-size-7'>{item}</span>
          </a>
        </li>)
      })}
    </ul>)
  }

  getFilters () {
    return (<header className='card-header'>
      <div className='card-header-title'>
        <form className='is-fullwidth'>
          <div className='columns is-multiline'>
            <div className='column is-4'>
              <div className='field is-horizontal'>
                <div className='field-label'>
                  <label className='label'>Semanas</label>
                </div>
                <div className='field-body'>
                  <div className='field'>
                    <div className='control'>
                      <div className='select'>
                        <SelectWidget
                          id='root_weeks'
                          schema={schema.weeks}
                          options={this.state.weeksOptions}
                          required
                          value={this.state.weekSelected}
                          disabled={false}
                          readonly={false}
                          onChange={(e) => this.selectWeek(e)}
                          autofocus='false' />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className='column is-8'>
              <div className='field is-horizontal'>
                <div className='field-label'>
                  <label className='label'>Centro de Ventas</label>
                </div>
                <div className='field-body'>
                  <div className='field'>
                    <div className='control'>
                      <div className='select is-fullwidth'>
                        <select className='is-fullwidth' value={this.state.salesCentersSelected} onChange={(e) => this.handleFilters(e, 'salesCentersSelected')}>
                          <option value='' />
                          {
                            this.state.salesCentersOptions.enumOptions.map((item, index) => {
                              return (<option key={index} value={item.uuid}>{item.name}</option>)
                            })
                          }
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className='field is-horizontal'>
                <div className='field-label is-normal'>
                  <label className='label'>Categoría</label>
                </div>
                <div className='field-body'>
                  <div className='field'>
                    <div className='control'>
                      <div className='select is-fullwidth'>
                        <select className='is-fullwidth' value={this.state.productsSelected} onChange={(e) => this.handleFilters(e, 'productsSelected')}>
                          <option value='' />
                          {
                            this.state.productsOptions.enumOptions.map((item, index) => {
                              return (<option key={index} value={item}>{item}</option>)
                            })
                          }
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className='column is-12'>

              <div className='tabs is-boxed'>
                {this.getDays()}
              </div>
            </div>
          </div>
        </form>
      </div>
    </header>)
  }

  /*
   * Editable table methods
   */

  async handleChange (data) {
    const project = this.state.forecast.project
    const prediction = this.state.predictions.find((item) => { return data.uuid === item.uuid })
    var maxAdjustment = Math.ceil(prediction.data.prediction * (1 + project.adjustment))
    var minAdjustment = Math.floor(prediction.data.prediction * (1 - project.adjustment))
    data.adjustment = Math.round(data.adjustment)

    data.isLimit = (data.adjustment >= maxAdjustment || data.adjustment <= minAdjustment)

    if (data.adjustment > maxAdjustment || data.adjustment < minAdjustment) {
      this.setState({notification: {
        has: true,
        type: 'error',
        'message': ' No te puedes pasar de los límites establecidos!'
      }})
      return false
    }

    data.percentage = (data.adjustment - data.prediction) * 100 / data.prediction

    var url = '/admin/predictions/' + data.uuid
    const res = await api.post(url, {...data})

    data.lastAdjustment = res.data.data.lastAdjustment
    data.edited = true
    const predictionsFormatted = this.state.predictionsFormatted.map(
      (item) => data.uuid === item.uuid ? data : item
    )

    this.setState({
      predictionsFormatted,
      success: true,
      notification: {
        has: true,
        type: 'success',
        'message': 'Ajuste guardado!'
      }
    }, this.filterData())

    return true
  }

  getModifyButtons () {
    let forecast = this.state.forecast

    if (forecast.status !== 'analistReview' && forecast.status !== 'readyToOrder') {
      return (
        <div className='columns'>
          <div className='column'>
            <div className='field is-grouped is-grouped-right'>
              <div className='control'>
                <p style={{paddingTop: 5}}>Modificar porcentaje</p>
              </div>
              <div className='control'>
                <button
                  className='button'
                  onClick={() => this.onClickButtonPlus()}
                  disabled={this.state.disableButtons}
                >
                 +
                </button>
              </div>
              <div className='control'>
                <button
                  className='button'
                  style={{paddingLeft: 14, paddingRight: 14}}
                  onClick={() => this.onClickButtonMinus()}
                  disabled={this.state.disableButtons}
                >
                 -
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }
  }

  getElementsById (array, property) {
    let seen = {}
    let out = []
    let len = array.length
    let j = 0
    let i = 0

    for (i; i < len; i++) {
      let item = array[i][property]
      if (seen[item] !== 1) {
        seen[item] = 1
        out[j++] = item
      }
    }
    return out
  }

  handleGraphFilters (e) {
    let graphDataFiltered = this.state.forecast.graphData
    if (e.target.value) {
      graphDataFiltered = this.state.forecast.graphData.filter(item => item.producto_id === e.target.value)
    }

    this.setState({
      graphProductSelected: e.target.value,
      graphIsPristine: false,
      graphDataFiltered
    })
  }

  getTable () {
    const { forecast, graphDataFiltered } = this.state

    if (forecast.status === 'created' || forecast.status === 'processing') {
      return (
        <div className='card'>
          <header className='card-header'>
            <p className='card-header-title'>
              Predictions
            </p>
          </header>
          <div className='card-content'>
            <div className='message is-success'>
              <div className='message-body is-large has-text-centered'>
                <div className='columns'>
                  <div className='column'>
                    <span className='icon is-large'>
                      <FontAwesome className='fa-3x fa-spin' name='cog' />
                    </span>
                  </div>
                </div>
                <div className='columns'>
                  <div className='column'>
                    The predictions will appear shortly...
                    They are being generated as we speak
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    clearInterval(this.interval)

    if (forecast.status === 'error') {
      return (
        <div className='card'>
          <header className='card-header'>
            <p className='card-header-title'>
              Predictions
            </p>
          </header>
          <div className='card-content'>
            <div className='message is-danger'>
              <div className='message-body is-large has-text-centered'>
                <div className='columns'>
                  <div className='column'>
                    <span className='icon is-large'>
                      <FontAwesome className='fa-3x' name='warning' />
                    </span>
                  </div>
                </div>
                <div className='columns'>
                  <div className='column'>
                    There was an error while processing the forecast:
                    <br />
                    {forecast.error}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }
    return (
      <div>
        {forecast.status === 'analistReview' && (
          <div className='columns'>
            <div className='column'>
              <div className='card'>
                <header className='card-header'>
                  <p className='card-header-title'>
                  Predictions Graph
                </p>
                </header>
                <div className='card-content'>
                  <div className='columns is-multiline'>
                    <div className='column is-5 is-offset-7'>
                      <div className='field is-horizontal is-grouped is-grouped-right'>
                        <div className='field-label'>
                          <label className='label'>Productos</label>
                        </div>
                        <div className='field-body'>
                          <div className='field'>
                            <div className='control'>
                              <div className='select is-fullwidth'>
                                <select
                                  className='is-fullwidth'
                                  value={this.state.graphProductSelected}
                                  onChange={(e) => this.handleGraphFilters(e)}>

                                  <option value='' />
                                  {
                                    Object.values(this.getElementsById(forecast.graphData, 'producto_id'))
                                      .sort((a, b) => Number(a) - Number(b))
                                      .map((value, index) => {
                                        return (<option key={index} value={value}>{value}</option>)
                                      })
                                  }

                                </select>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className='column'>
                      <CreateBarGraph
                        data={graphDataFiltered}
                        size={[250, 250]}
                        width='960'
                        height='500'
                        pristine={this.state.graphIsPristine}
                    />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {
          forecast.newProducts.length > 0 &&
          forecast.newSalesCenters.length > 0 &&
          this.getUnidentifiedProducts()
        }
        <div className='columns'>
          <div className='column'>
            <div className='card'>
              <header className='card-header'>
                <p className='card-header-title'>
                  Predictions Table
                </p>
              </header>
              {
                this.getFilters()
              }
              <div className='card-content'>
                {this.getModifyButtons()}
                <div className='columns'>
                  <div className='column'>
                    <EditableTable
                      columns={this.getColumns()}
                      data={this.state.predictionsFiltered}
                      handleSort={(e) => this.handleSort(e)}
                      sortAscending={this.state.sortAscending}
                      handleChange={this.handleChange.bind(this)}
                      sortBy={this.state.sort}
                      setRowsToEdit={this.setRowsToEdit.bind(this)}
                      selectable={
                        forecast.status !== 'analistReview' && forecast.status !== 'readyToOrder'
                      }
                     />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {this.getDatasetsList()}
      </div>
    )
  }

  /*
   * Rendering methods
   */

  getFrequency () {
    let forecast = this.state.forecast
    let freqDict = {
      B: 'Business day frequency',
      D: 'Calendar day frequency',
      W: 'Weekly frequency',
      M: 'Month end frequency'
    }

    return freqDict[forecast.frequency]
  }

  getNotification (type, message) {
    setTimeout(() => this.setState({notification: {has: false}}), 3000)
    if (type === 'error') {
      return (
        <div className='notification is-danger' style={{position: 'relative'}}>
          <button className='delete' />
          <strong>Error!</strong> {message}
        </div>
      )
    }
    if (type === 'success') {
      return (
        <div className='notification is-success' style={{position: 'relative'}}>
          <button className='delete' />
          <strong>Success!</strong> {message}
        </div>
      )
    }
  }

  getButtons () {
    const { forecast } = this.state

    if (forecast.status === 'analistReview') {
      return (
        <button
          className='button is-primary'
          type='button'
          onClick={() => this.changeStatusOnClick('opsReview')}
        >
          Aprobar
        </button>
      )
    }

    if (forecast.status === 'opsReview') {
      return (
        <button
          className='button is-primary'
          type='button'
          onClick={() => this.changeStatusOnClick('consolidate')}
        >
          Consolidar
        </button>
      )
    }
  }

  getDatasetsList () {
    const { forecast } = this.state
    return (
      <div className='columns'>
        <div className='column'>
          <div className='card'>
            <header className='card-header'>
              <p className='card-header-title'>
                Datasets
              </p>
            </header>
            <div className='card-content'>
              <div className='columns'>
                <div className='column'>
                  <BranchedPaginatedTable
                    branchName='datasets'
                    baseUrl='/admin/datasets/'
                    columns={this.getColumnsDatasets()}
                    filters={{project: forecast.project.uuid}}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /*
   * Unidentified products/sales center methods
   */

  toggleUnidentifiedProducts () {
    this.setState({isProductsOpen: !this.state.isProductsOpen}, function () {
      this.setHeights()
    })
  }

  showModal () {
    this.setState({
      className: ' is-active'
    })
  }

  hideModal () {
    this.setState({
      className: ''
    })
  }

  showModalSalesCenters () {
    this.setState({
      classNameSC: ' is-active'
    })
  }

  hideModalSalesCenters () {
    this.setState({
      classNameSC: ''
    })
  }

  async deleteNewProduct () {
    this.load()
    setTimeout(() => {
      this.hideModal()
    }, 1000)
  }

  async deleteNewSalesCenter () {
    this.load()
    setTimeout(() => {
      this.hideModalSalesCenters()
    }, 1000)
  }

  getUnidentifiedProducts () {
    const { forecast } = this.state
    const headerProductsClass = classNames('card-content', {
      'is-hidden': this.state.isProductsOpen === false
    })
    const toggleBtnIconClass = classNames('fa', {
      'fa-plus': this.state.isProductsOpen === false,
      'fa-minus': this.state.isProductsOpen !== false
    })

    var newProducts = []
    forecast.newProducts.map((item, key) => {
      if (item.name === 'Not identified') {
        newProducts.push(item)
      }
    })

    var newSalesCenters = []
    forecast.newSalesCenters.map((item, key) => {
      if (item.name === 'Not identified') {
        newSalesCenters.push(item)
      }
    })

    if (!forecast.uuid) {
      return <Loader />
    }

    return (
      <div className='columns'>
        <div className='column'>
          <div className='card'>
            <header className='card-header'>
              <p className='card-header-title'>
                  Unidentified Products: {newProducts.length} and Sales Centers: {newSalesCenters.length}
              </p>
              <div className='field is-grouped is-grouped-right card-header-select'>
                <div className='control'>
                  <a
                    className='button is-rounded is-inverted'
                    onClick={() => this.toggleUnidentifiedProducts()}>
                    <span className='icon is-small'>
                      <i className={toggleBtnIconClass} />
                    </span>
                  </a>
                </div>
              </div>
            </header>
            <div className={headerProductsClass}>
              <div className='columns'>
                <div className='column'>
                  <table className='table is-fullwidth'>
                    <thead>
                      <tr>
                        <th colSpan='2'>Product External Id</th>

                      </tr>
                    </thead>
                    <tbody>
                      {newProducts.length === 0 ? (
                        <tr>
                          <td colSpan='2'>No new products to show</td>
                        </tr>
                      ) : (
                        newProducts.map((item, key) => {
                          return (
                            <tr key={key}>
                              <td>{item.externalId}</td>
                              <td>
                                <button className='button is-primary' onClick={() => this.showModal()}>
                                    Edit
                                  </button>
                                <BaseModal
                                  title='Edit Product'
                                  className={this.state.className}
                                  hideModal={() => this.hideModal()}
                                  >
                                  <ProductForm
                                    baseUrl='/admin/products'
                                    url={'/admin/products/' + item.uuid}
                                    initialState={item}
                                    load={this.deleteNewProduct.bind(this)}
                                    >
                                    <div className='field is-grouped'>
                                      <div className='control'>
                                        <button className='button is-primary'>Save</button>
                                      </div>
                                      <div className='control'>
                                        <button className='button' onClick={() => this.hideModal()}>Cancel</button>
                                      </div>
                                    </div>
                                  </ProductForm>
                                </BaseModal>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                <div className='column'>
                  <table className='table is-fullwidth'>
                    <thead>
                      <tr>
                        <th>Sales Center  External Id</th>
                      </tr>
                    </thead>
                    <tbody>
                      {newSalesCenters.length === 0 ? (
                        <tr>
                          <td colSpan='2'>No new sales centers to show</td>
                        </tr>
                      ) : (
                        newSalesCenters.map((item, key) => {
                          if (item.name === 'Not identified') {
                            return (
                              <tr key={key}>
                                <td >{item.externalId}</td>
                                <td>
                                  <button className='button is-primary' onClick={() => this.showModalSalesCenters()}>
                                  Edit
                                </button>
                                  <BaseModal
                                    title='Edit Sales Center'
                                    className={this.state.classNameSC}
                                    hideModal={() => this.hideModalSalesCenters()}
                                >
                                    <SalesCenterForm
                                      baseUrl='/admin/salesCenters'
                                      url={'/admin/salesCenters/' + item.uuid}
                                      initialState={item}
                                      load={this.deleteNewSalesCenter.bind(this)}
                                  >
                                      <div className='field is-grouped'>
                                        <div className='control'>
                                          <button className='button is-primary'>Save</button>
                                        </div>
                                        <div className='control'>
                                          <button className='button' onClick={() => this.hideModalSalesCenters()}>Cancel</button>
                                        </div>
                                      </div>
                                    </SalesCenterForm>
                                  </BaseModal>
                                </td>
                              </tr>
                            )
                          }
                        })

                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /*
   * Sticky header methods
   */

  setHeights (elements) {
    const scrollBody = elements || document.querySelectorAll('[data-content]')

    scrollBody.forEach((sticky) => {
      let bottom = sticky.getBoundingClientRect().bottom
      const footerHeight = 0
      const viewporHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
      this.setState({bodyHeight: viewporHeight - (bottom + footerHeight)})
    })
  }

  toggleHeader () {
    this.setState({isHeaderOpen: !this.state.isHeaderOpen}, function () {
      this.setHeights()
    })
  }

  getHeight (element) {
    if (this.state.bodyHeight === 0) {
      if (element) this.setHeights([element])
    }
  }

  render () {
    const { forecast, notification } = this.state
    const headerBodyClass = classNames('card-content', {
      'is-hidden': this.state.isHeaderOpen === false
    })
    const toggleBtnIconClass = classNames('fa', {
      'fa-plus': this.state.isHeaderOpen === false,
      'fa-minus': this.state.isHeaderOpen !== false
    })

    var notif

    if (notification.has) {
      notif = this.getNotification(notification.type, notification.message)
    }

    if (!forecast.uuid) {
      return <Loader />
    }

    return (<div>
      <div data-content className='card' id='test' ref={(element) => this.getHeight(element)}>
        <header className='card-header'>
          <p className='card-header-title'>
            Forecast from {moment.utc(forecast.dateStart).format('DD/MM/YYYY')} to {moment.utc(forecast.dateEnd).format('DD/MM/YYYY')}
          </p>

          <div className='field is-grouped is-grouped-right card-header-select'>
            <div className='control'>
              <Link
                className='button is-light'
                to={'/projects/detail/' + forecast.project.uuid}
              >
                Return to project
              </Link>
            </div>
            <div className='control'>
              {this.getButtons()}
            </div>
            <div className='control'>
              <a
                className='button is-rounded is-inverted'
                onClick={() => this.toggleHeader()}>
                <span className='icon is-small'>
                  <i className={toggleBtnIconClass} />
                </span>
              </a>
            </div>
          </div>
        </header>
        <div className={headerBodyClass}>
          <div className='columns is-multiline'>
            <div className='column is-6'><strong>Status:</strong> {forecast.status}</div>
            <div className='column is-6'><strong>Organization:</strong> {forecast.organization.name}</div>
            <div className='column is-6'><strong>Start Date:</strong> {moment.utc(forecast.dateStart).format('DD/MM/YYYY')}</div>
            <div className='column is-6'><strong>End Date:</strong> {moment.utc(forecast.dateEnd).format('DD/MM/YYYY')}</div>
            <div className='column is-6'><strong>Frequency:</strong> {this.getFrequency()}</div>
            <div className='column is-6'><strong>Created By:</strong> {`${forecast.createdBy.name}`}</div>
            <div className='column is-6 is-offset-6'>
              <div className='control'>
                <DeleteButton
                  objectName='Forecast'
                  objectDelete={this.deleteObject.bind(this)}
                  message={`Estas seguro de querer eliminar el objeto`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='notification-container'>
        {notif}
      </div>

      <div className='columns c-flex-1 is-marginless' style={{overflowY: 'scroll', height: this.state.bodyHeight}}>
        <div className='column is-12 is-paddingless'>
          <div className='section'>
            {this.getTable()}
          </div>
        </div>
      </div>
    </div>)
  }
}

export default Page({
  path: '/forecasts/detail/:uuid',
  title: 'Forecast detail',
  icon: 'check',
  exact: true,
  validate: loggedIn,
  component: ForecastDetail
})
