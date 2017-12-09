import React, { Component } from 'react'
import api from '~base/api'
import Loader from '~base/components/spinner'
import moment from 'moment'
import FontAwesome from 'react-fontawesome'
import Link from '~base/router/link'

import Page from '~base/page'
import {loggedIn} from '~base/middlewares/'
import {
  SimpleTable,
  TableBody,
  TableHeader,
  TableData,
  BodyRow
} from '~base/components/base-table'

import {
  EditableTable
} from '~base/components/base-editableTable'

class ForecastDetail extends Component {
  constructor (props) {
    super(props)
    this.state = {
      loading: true,
      loaded: false,
      predictions: [],
      forecast: {},
      selectedRows: {},
      selectValue: '',
      predictionsFormatted: [],
      notification: {
        has: false,
        type: '',
        message: ''
      }
    }
  }

  componentWillMount () {
    this.load()
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
        return {
          ...item.data,
          product: item.product,
          salesCenter: item.salesCenter,
          uuid: item.uuid
        }
      })
    })
  }

  async deleteOnClick () {
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
        'title': 'Date',
        'property': 'forecastDate',
        'default': 'N/A'
      },
      {
        'title': 'Agency',
        'property': 'agency_id',
        'default': 'N/A',
        formatter: (row) => {
          return String(row.salesCenter.name)
        }
      },
      {
        'title': 'Product',
        'property': 'product_id',
        'default': 'N/A',
        formatter: (row) => {
          return String(row.product.name)
        }
      },
      {
        'title': 'Existence',
        'property': 'existence',
        'default': 0
      },
      {
        'title': 'Prediction',
        'property': 'prediction',
        'default': 0
      },
      {
        'title': 'Adjust',
        'property': 'adjustment',
        'default': 0,
        'editable': true,
        'type': 'number'
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

    if (Math.abs(data.adjustment) > prediction.data.prediction * (project.adjustment)) {
      this.setState({notification: {
        has: true,
        type: 'error',
        'message': ' No te puedes pasar de los límites establecidos!'
      }})
      return false
    }

    const predictionsFormatted = this.state.predictionsFormatted.map(
      (item) => data.uuid === item.uuid ? data : item
    )

    var url = '/admin/predictions/' + data.uuid
    await api.post(url, {...data})
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

  setRowsToEdit (row, index) {
    let rows = {...this.state.selectedRows}

    if (rows.hasOwnProperty(row.uuid)) {
      row.selected = !row.selected
      delete rows[row.uuid]
    } else {
      row.selected = true
      rows[row.uuid] = row
    }

    this.setState({selectedRows: rows})
  }

  selectRows (selectAll) {
    let selectedRows = {}
    let reports = this.state.reports.map((item) => {
      if (selectAll) selectedRows[item.uuid] = item

      item.selected = selectAll
      return item
    })

    this.setState({reports, selectedRows})
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
    let forecast = this.state.forecast
    if (forecast.status === 'done') {
      return (
        <div className='card'>
          <header className='card-header'>
            <p className='card-header-title'>
              Predictions
            </p>
          </header>
          <div className='card-content'>
            <div className='columns'>
              <div className='column'>
                Aquí va gráfica
              </div>
            </div>
          </div>
          <footer className='card-footer'>
            <button
              className='button is-primary'
              type='button'
              onClick={() => this.changeStatusOnClick('analistReview')}
            >
              Analist Review
            </button>
          </footer>
        </div>
      )
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

    return (
      <div className='card'>
        <header className='card-header'>
          <p className='card-header-title'>
            Predictions
          </p>
        </header>
        <div className='card-content'>
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
                selectable
               />
            </div>
          </div>
        </div>
      </div>
    )
  }

  render () {
    const { forecast, notification } = this.state
    var notif

    if (notification.has) {
      notif = this.getNotification(notification.type, notification.message)
    }

    if (!forecast.uuid) {
      return <Loader />
    }

    return (
      <div className='columns c-flex-1 is-marginless'>
        <div className='column is-paddingless'>
          <div className='section'>
            {notif}
            <div className='columns'>
              <div className='column'>
                <Link
                  className='button'
                  to={'/projects/detail/' + forecast.project.uuid}
                >
                  Return to project
                </Link>
              </div>
              <div className='column has-text-right'>
                <div className='field is-grouped is-grouped-right'>
                  <div className='control'>
                    <button
                      className='button is-danger'
                      type='button'
                      onClick={() => this.deleteOnClick()}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className='columns'>
              <div className='column'>
                <div className='card'>
                  <header className='card-header'>
                    <p className='card-header-title'>
                      Forecast
                    </p>
                  </header>
                  <div className='card-content'>
                    <div className='columns'>
                      <div className='column'>
                        <SimpleTable>
                          <TableBody>
                            <BodyRow>
                              <TableHeader>
                                Status
                              </TableHeader>
                              <TableData>
                                {forecast.status}
                              </TableData>
                            </BodyRow>
                            <BodyRow>
                              <TableHeader>
                                Start Date
                              </TableHeader>
                              <TableData>
                                {moment.utc(forecast.dateStart).format('DD/MM/YYYY')}
                              </TableData>
                            </BodyRow>
                            <BodyRow>
                              <TableHeader>
                                End Date
                              </TableHeader>
                              <TableData>
                                {moment.utc(forecast.dateEnd).format('DD/MM/YYYY')}
                              </TableData>
                            </BodyRow>
                            <BodyRow>
                              <TableHeader>
                                Organization
                              </TableHeader>
                              <TableData>
                                {forecast.organization.name}
                              </TableData>
                            </BodyRow>
                            <BodyRow>
                              <TableHeader>
                                Frequency
                              </TableHeader>
                              <TableData>
                                {this.getFrequency()}
                              </TableData>
                            </BodyRow>
                            <BodyRow>
                              <TableHeader>
                                Holidays
                              </TableHeader>
                              <TableData>
                                {forecast.holidays.map((item) => {
                                  return `${item.name} (${moment.utc(item.date).format('DD/MM/YYYY')})`
                                }).join(', ')}
                              </TableData>
                            </BodyRow>
                            <BodyRow>
                              <TableHeader>
                                Change points
                              </TableHeader>
                              <TableData>
                                {forecast.changePoints.map((item) => {
                                  return `${moment.utc(item).format('DD/MM/YYYY')}`
                                }).join(', ')}
                              </TableData>
                            </BodyRow>
                            <BodyRow>
                              <TableHeader>
                                Created By
                              </TableHeader>
                              <TableData>
                                {`${forecast.createdBy.name}`}
                              </TableData>
                            </BodyRow>
                            <BodyRow>
                              <TableHeader>
                                External ID
                              </TableHeader>
                              <TableData>
                                {forecast.configPrId}
                              </TableData>
                            </BodyRow>
                            <BodyRow>
                              <TableHeader>
                                Date Created
                              </TableHeader>
                              <TableData>
                                {moment.utc(forecast.dateCreated).format('DD/MM/YYYY')}
                              </TableData>
                            </BodyRow>
                          </TableBody>
                        </SimpleTable>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className='column'>
                {this.getTable()}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
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
