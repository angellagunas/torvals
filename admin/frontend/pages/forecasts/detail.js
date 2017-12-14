import React, { Component } from 'react'
import api from '~base/api'
import Loader from '~base/components/spinner'
import FontAwesome from 'react-fontawesome'
import Link from '~base/router/link'
import moment from 'moment'
import classNames from 'classnames'

import CreateBarGraph from './create-bargraph'
import DeleteButton from '~base/components/base-deleteButton'
import Page from '~base/page'
import {loggedIn} from '~base/middlewares/'

import {
  EditableTable
} from '~base/components/base-editableTable'

class ForecastDetail extends Component {
  constructor (props) {
    super(props)
    this.state = {
      isHeaderOpen: false,
      bodyHeight: 0,
      loading: true,
      loaded: false,
      predictions: [],
      forecast: {},
      selectedRows: {},
      selectValue: '',
      predictionsFormatted: [],
      disableButtons: true,
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

  async load () {
    var url = '/admin/forecasts/' + this.props.match.params.uuid
    const body = await api.get(url)

    this.setState({
      loading: false,
      loaded: true,
      forecast: body.data
    })

    this.loadPredictions()
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
        var percentage

        if (data.prediction !== data.adjustment) {
          percentage = (data.adjustment - data.prediction) * 100 / data.prediction
        }

        return {
          ...data,
          percentage: percentage,
          product: item.product,
          salesCenter: item.salesCenter,
          uuid: item.uuid
        }
      })
    })
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

  getColumns () {
    return [
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
        'default': 'N/A'
      },
      {
        'title': 'Ajuste',
        'property': 'adjustment',
        'default': 0,
        'editable': true,
        'type': 'number'
      },
      {
        'title': 'Porcentaje',
        'property': 'percentage',
        'default': 0,
        'type': 'number',
        formatter: (row) => {
          if (row.percentage) {
            return `${row.percentage} %`
          }

          return '0 %'
        }
      }
    ]
  }

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

  async handleChange (data) {
    const project = this.state.forecast.project
    const prediction = this.state.predictions.find((item) => { return data.uuid === item.uuid })
    var maxAdjustment = (prediction.data.prediction * (1 + project.adjustment))
    var minAdjustment = (prediction.data.prediction * (1 - project.adjustment))

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
    })

    return true
  }

  async onClickButtonPlus (rangeValue) {
    let rows = {...this.state.selectedRows}

    for (var item in rows) {
      rows[item].edited = true
      var adjustment = rows[item].adjustment
      var newAdjustment = rows[item].adjustment + (rows[item].prediction * 0.01)
      rows[item].adjustment = newAdjustment
      const res = await this.handleChange(rows[item])
      if (!res) rows[item].adjustment = adjustment
    }
  }

  async onClickButtonMinus (rangeValue) {
    let rows = {...this.state.selectedRows}

    for (var item in rows) {
      rows[item].edited = true
      var adjustment = rows[item].adjustment
      var newAdjustment = rows[item].adjustment - (rows[item].prediction * 0.01)
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

    if (rows.hasOwnProperty(row.uuid)) {
      row.selected = !row.selected
      delete rows[row.uuid]
    } else {
      row.selected = true
      rows[row.uuid] = row
    }

    this.setState({selectedRows: rows}, function () {
      this.toggleButtons()
    })
  }

  selectRows (selectAll) {
    let selectedRows = {}
    let predictionsFormatted = this.state.predictionsFormatted.map((item) => {
      if (selectAll) selectedRows[item.uuid] = item

      item.selected = selectAll
      return item
    })

    this.setState({predictionsFormatted, selectedRows}, function () {
      this.toggleButtons()
    })
  }

  getNotification (type, message) {
    setTimeout(() => this.setState({notification: {has: false}}), 3000)
    if (type === 'error') {
      return (
        <div className='notification is-danger'>
          <button className='delete' />
          <strong>Error!</strong> {message}
        </div>
      )
    }
    if (type === 'success') {
      return (
        <div className='notification is-success'>
          <button className='delete' />
          <strong>Success!</strong> {message}
        </div>
      )
    }
  }

  getTable () {
    const { forecast, notification } = this.state
    var notif

    if (notification.has) {
      notif = this.getNotification(notification.type, notification.message)
    }

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

    return (
      <div>
        <div className='columns'>
          <div className='column'>
            <div className='card'>
              <header className='card-header'>
                <p className='card-header-title'>
                  Predictions Graph
                </p>
              </header>
              <div className='card-content'>
                <div className='columns'>
                  <div className='column'>
                    <CreateBarGraph
                      data={forecast.graphData}
                      size={[250, 250]}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className='columns'>
          <div className='column'>
            {notif}
            <div className='card'>
              <header className='card-header'>
                <p className='card-header-title'>
                  Predictions Table
                </p>
              </header>
              <div className='card-content'>
                <div className='columns'>
                  <div className='column'>
                    <button
                      style={{marginRight: 10}}
                      onClick={(e) => this.selectRows(true)}
                      className='button is-light'
                    >
                      Seleccionar todos
                    </button>
                    <button
                      onClick={(e) => this.selectRows(false)}
                      className='button is-light'
                    >
                      Deseleccionar todos
                    </button>
                  </div>
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
                <div className='columns'>
                  <div className='column'>
                    <EditableTable
                      columns={this.getColumns()}
                      handleSort={(e) => this.handleSort(e)}
                      data={this.state.predictionsFormatted}
                      sortAscending={this.state.sortAscending}
                      handleChange={this.handleChange.bind(this)}
                      sortBy={this.state.sort}
                      setRowsToEdit={this.setRowsToEdit.bind(this)}
                      selectable={forecast.status !== 'analistReview'}
                     />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  setHeights (elements) {
    const scrollBody = elements || document.querySelectorAll('[data-content]')

    scrollBody.forEach((sticky) => {
      let bottom = sticky.getBoundingClientRect().bottom
      const footerHeight = 96
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
          onClick={() => this.changeStatusOnClick('supervisorReview')}
        >
          Consolidar
        </button>
      )
    }
  }

  render () {
    const { forecast } = this.state
    const headerBodyClass = classNames('card-content', {
      'is-hidden': this.state.isHeaderOpen === false
    })
    const toggleBtnIconClass = classNames('fa', {
      'fa-plus': this.state.isHeaderOpen === false,
      'fa-minus': this.state.isHeaderOpen !== false
    })

    if (!forecast.uuid) {
      return <Loader />
    }

    return (<div>
      <div data-content className='card' id='test' ref={(element) => this.getHeight(element)}>
        <header className='card-header'>
          <p className='card-header-title'>
            Forecast
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
              <DeleteButton
                objectName='Forecast'
                objectDelete={this.deleteObject.bind(this)}
                message={`Estas seguro de querer eliminar el objeto`}
              />
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
          </div>
        </div>
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
