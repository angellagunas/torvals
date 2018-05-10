import React, { Component } from 'react'
import api from '~base/api'
import Loader from '~base/components/spinner'

import {
  EditableTable
} from '~base/components/base-editableTable'

class PredictionsDetail extends Component {
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

    this.loadPrediction()
  }

  async loadPrediction () {
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

  getColumns () {
    return [
      {
        'title': 'Month',
        'property': 'month',
        'default': 'N/A',
        formatter: (row) => {
          return String(row.month)
        }
      },
      {
        'title': 'Year',
        'property': 'year',
        'default': 'N/A',
        formatter: (row) => {
          return String(row.year)
        }
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
        'title': 'Date For.',
        'property': 'forecastDate',
        'default': 'N/A'
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
        'title': 'Adjustment',
        'property': 'adjustment',
        'default': 0,
        'editable': true,
        'type': 'number'
      }
    ]
  }

  handleSort (sort) {
    let sortAscending = sort !== this.state.sort ? false : !this.state.sortAscending
    this.setState({sort, sortAscending, selectedRows: {}})
  }

  async handleChange (data) {
    const project = this.state.forecast.project
    const prediction = this.state.predictions.find((item) => { return data.uuid === item.uuid })

    if (Math.abs(data.adjustment) > prediction.data.prediction * (project.adjustment)) {
      this.setState({notification: {
        has: true,
        type: 'error',
        'message': ' ¡No te puedes pasar de los límites establecidos!'
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
        'message': '¡Ajuste guardado!'
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
          </div>
        </div>
      </div>
    )
  }
}

export default PredictionsDetail
