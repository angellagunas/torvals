import React, { Component } from 'react'
import api from '~base/api'
import { ToastContainer, toast } from 'react-toastify'
import FontAwesome from 'react-fontawesome'
import CreateAdjustmentRequest from '../create-adjustmentRequest'

import {
  EditableTable
} from '~base/components/base-editableTable'

class ContainerTable extends Component {
  constructor (props) {
    super(props)
    this.state = {
      selectedRows: {},
      selectedAll: false
    }
  }

  getModifyButtons () {
    let forecast = this.props.forecast

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

    if (Object.keys(rows).length === this.props.data.length) {
      selectedAll = !selectedAll
    }

    this.setState({selectedRows: rows, selectedAll}, function () {
      this.toggleButtons()
    })
  }
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

  async handleChange (data) {
    data.adjustment = Math.round(data.adjustment)
    data.percentage = (data.adjustment - data.prediction) * 100 / data.prediction

    var url = '/admin/predictions/' + data.uuid
    const res = await api.post(url, {...data})

    data.lastAdjustment = res.data.data.lastAdjustment
    data.edited = true
    const predictionsFormatted = this.props.predictionsFormatted.map(
      (item) => data.uuid === item.uuid ? data : item
    )
    this.notify('Ajuste guardado!', 3000, toast.TYPE.SUCCESS)

    this.setState({
      predictionsFormatted,
      success: true
    }, this.filterData())

    return true
  }

  filterData () {
    let filterData = this.props.filterData
    if (filterData) {
      filterData()
    }
  }

  notify (message = '', timeout = 3000, type = toast.TYPE.INFO) {
    if (!toast.isActive(this.toastId)) {
      this.toastId = toast(message, {
        autoClose: timeout,
        type: type,
        hideProgressBar: true,
        closeButton: false
      })
    } else {
      toast.update(this.toastId, {
        render: message,
        type: type,
        autoClose: timeout,
        closeButton: false
      })
    }
  }

  selectRows (selectAll) {
    let selectedRows = {}
    let predictionsFormatted = this.props.data.map((item) => {
      if (selectAll) selectedRows[item.uuid] = item

      item.selected = selectAll
      return item
    })

    this.setState({predictionsFormatted, selectedRows, selectedAll: !this.state.selectedAll}, function () {
      this.toggleButtons()
    })
  }

  getColumns () {
    let checkboxColumn = []
    if (this.props.forecast.status === 'opsReview') {
      checkboxColumn.push({
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
      })
    }

    return [
      ...checkboxColumn,
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
        'title': 'Canal',
        'abbreviate': true,
        'abbr': 'Canal',
        'property': 'channelId',
        'default': 'N/A',
        formatter: (row) => {
          return String(row.channelName)
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
        'title': 'Pedido en firme realizado en 15/01/2018',
        'abbreviate': true,
        'abbr': 'Pedido',
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
          if (row.isLimit && !row.adjustmentRequest) {
            return (
              <span
                className='icon'
                title='No es posible pedir un ajuste más allá al límite!'
                onClick={() => {
                  this.showModalAdjustmentRequest(row)
                }}
              >
                <FontAwesome name='warning' />
              </span>
            )
          }

          if (row.isLimit && row.adjustmentRequest) {
            return (
              <span
                className='icon has-text-warning'
                title='Ya se ha pedido un cambio a esta predicción!'
                onClick={() => {
                  this.showModalAdjustmentRequest(row)
                }}
              >
                <FontAwesome name='warning' />
              </span>
            )
          }
          return ''
        }
      }
    ]
  }
  showModalAdjustmentRequest (obj) {
    this.setState({
      classNameAR: ' is-active',
      selectedAR: obj
    })
  }
  hideModalAdjustmentRequest () {
    this.setState({
      classNameAR: ''
    })
  }
  async finishUpAdjustmentRequest (obj) {
    this.setState({
      selectedAR: undefined
    })
    let loadPredictions = this.props.loadPredictions
    if (loadPredictions) {
      await loadPredictions()
    }
  }

  render () {
    return (<div>
      <CreateAdjustmentRequest
        className={this.state.classNameAR}
        hideModal={(e) => this.hideModalAdjustmentRequest(e)}
        finishUp={(e) => this.finishUpAdjustmentRequest(e)}
        prediction={this.state.selectedAR}
        baseUrl={''}
      />
      <ToastContainer />
      {this.getModifyButtons()}
      <div className='columns'>
        <div className='column'>
          <EditableTable
            columns={this.getColumns()}
            data={this.props.data}
            sortAscending={this.props.sortAscending}
            handleChange={(e) => this.handleChange(e)}
            sortBy={this.props.sortBy}
            setRowsToEdit={(e) => this.setRowsToEdit(e)}
            selectable={
              this.props.forecast.status !== 'readyToOrder'
            }
           />
        </div>
      </div>
    </div>)
  }
}

export default ContainerTable
