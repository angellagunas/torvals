import React, { Component } from 'react'
import api from '~base/api'
import Loader from '~base/components/spinner'
import moment from 'moment'
import FontAwesome from 'react-fontawesome'
import Link from '~base/router/link'

import DeleteButton from '~base/components/base-deleteButton'
import CreateBarGraph from './create-bargraph'
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
        'property': 'semana_bimbo',
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
                <footer className='card-footer'>
                  <button
                    className='button is-primary'
                    type='button'
                    onClick={() => this.changeStatusOnClick('opsReview')}
                  >
                    Approve
                  </button>
                </footer>
              </div>
            </div>
          </div>
          <div className='columns'>
            <div className='column'>
              <div className='card'>
                <header className='card-header'>
                  <p className='card-header-title'>
                    Predictions Table
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
            </div>
          </div>
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
            <div className='card'>
              <header className='card-header'>
                <p className='card-header-title'>
                  Predictions Table
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
                    <DeleteButton
                      objectName='Forecast'
                      objectDelete={this.deleteObject.bind(this)}
                      message={'Estas seguro de querer eliminar este Forecast?'}
                    />
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
            </div>
            {this.getTable()}
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
