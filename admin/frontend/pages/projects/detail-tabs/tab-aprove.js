import React, { Component } from 'react'
import api from '~base/api'
import moment from 'moment'
import { EditableTable } from '~base/components/base-editableTable'
import { ToastContainer, toast } from 'react-toastify'
import FontAwesome from 'react-fontawesome'

class TabAprove extends Component {
  constructor (props) {
    super(props)
    this.state = {
      dataRows: [],
      isLoading: '',
      selectedRows: {},
      selectedAll: false,
      disableButtons: true
    }
  }

  componentWillMount () {
    this.getAdjustmentRequests()
  }

  async getAdjustmentRequests () {
    let url = '/admin/adjustmentRequests/dataset/' + this.props.project.activeDataset.uuid
    let data = await api.get(url)
    this.setState({
      dataRows: data.data
    })
  }

  getColumns () {
    return [
      {
        'title': 'Product Id',
        'abbreviate': true,
        'abbr': 'P. Id',
        'property': 'productId',
        'default': 'N/A',
        formatter: (row) => {
          return String(row.datasetRow.product.externalId)
        }
      },
      {
        'title': 'Product Name',
        'abbreviate': true,
        'abbr': 'P. Name',
        'property': 'productNamed',
        'default': 'N/A',
        formatter: (row) => {
          return String(row.datasetRow.product.name)
        }
      },
      {
        'title': 'Centro de venta',
        'abbreviate': true,
        'abbr': 'C. Venta',
        'property': 'salesCenter',
        'default': 'N/A',
        formatter: (row) => {
          return String(row.datasetRow.salesCenter.name)
        }
      },
      {
        'title': 'Semana',
        'property': 'semanaBimbo',
        'default': 'N/A',
        formatter: (row) => {
          return String(row.datasetRow.data.semanaBimbo)
        }
      },
      {
        'title': 'Predicción',
        'property': 'prediction',
        'default': 0,
        formatter: (row) => {
          return String(row.datasetRow.data.prediction)
        }
      },
      {
        'title': 'Ajuste Anterior',
        'property': 'lastAdjustment',
        'default': 0,
        formatter: (row) => {
          if (row.datasetRow.data.lastAdjustment) {
            return row.datasetRow.data.lastAdjustment
          }
        }
      },
      {
        'title': 'Ajuste',
        'property': 'adjustment',
        'default': 0,
        'editable': true,
        'type': 'number',
        formatter: (row) => {
          if (!row.datasetRow.data.adjustment) {
            row.datasetRow.data.adjustment = 0
          }
          return row.datasetRow.data.adjustment
        }
      },
      {
        'title': 'Rango',
        'property': 'percentage',
        'default': 0,
        'type': 'number',
        formatter: (row) => {
          if (row.datasetRow.data.percentage) {
            return `${row.datasetRow.data.percentage.toFixed(2)} %`
          }
          else {
            row.datasetRow.data.percentage = (row.datasetRow.data.adjustment - row.datasetRow.data.prediction) * 100 / row.datasetRow.data.prediction
            return `${row.datasetRow.data.percentage.toFixed(2)} %`
          }
        }
      },
      {
        'title': 'Fecha',
        'property': 'dateRequested',
        formatter: (row) => {
          return (
            moment.utc(row.dateRequested).local().format('DD/MM/YYYY hh:mm a')
          )
        }
      },
      {
        'title': 'Estatus',
        'property': 'status',
        'default': '',
        formatter: (row) => {
          if (row.status === 'created') {
            return (
              <span
                className='icon has-text-info'
                title='Creado'>
                <FontAwesome name='info-circle fa-lg' />
              </span>
            )
          }
          if (row.status === 'approved') {
            return (
              <span
                className='icon has-text-success'
                title='Aprobado'>
                <FontAwesome name='check-circle fa-lg' />
              </span>
            )
          }
          if (row.status === 'rejected') {
            return (
              <span
                className='icon has-text-danger'
                title='Rechazado'>
                <FontAwesome name='times-circle fa-lg' />
              </span>
            )
          }
          return ''
        }
      },
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
                  checked={state.isRowSelected || false} />
              </label>
            </div>
          </div>)
        }
      }
    ]
  }

  getModifyButtons () {
    return (
      <div className='columns'>
        <div className='column'>
          <h4 className='subtitle'>Resultados: {this.state.dataRows.length} </h4>
        </div>
        <div className='column'>
          <div className='field is-grouped is-grouped-right'>
            <div className='control'>
              <button
                className='button is-danger'
                onClick={this.reject}
                disabled={this.state.disableButtons}
              >
                <span className='icon'>
                  <i className='fa fa-times-circle' />
                </span>
                <span>Rechazar</span>
              </button>
            </div>
            <div className='control'>
              <button
                className='button is-success'
                onClick={this.aprove}
                disabled={this.state.disableButtons}
              >
                <span className='icon'>
                  <i className='fa fa-check-circle' />
                </span>
                <span>Aprobar</span>
                </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  aprove = async () => {
    let rows = this.state.selectedRows
    let url = '/admin/adjustmentRequests/approve/'

    for (var i in rows) {
      rows[i].edited = true
      let res = await api.get(url + rows[i].uuid)

      if (res) {
        rows[i].status = res.data.status
        await this.handleChange(rows[i])      
      }
    }
  }

  reject = async () => {
    let rows = this.state.selectedRows
    let url = '/admin/adjustmentRequests/reject/'

    for (var i in rows) {
      rows[i].edited = true
      let res = await api.get(url + rows[i].uuid)

      if (res) {
        rows[i].status = res.data.status
        await this.handleChange(rows[i])      
      }
    }
  }

  toggleButtons () {
    let disable = true
  
    if (Object.keys(this.state.selectedRows).length) 
      disable = false

    this.setState({
      disableButtons: disable
    })
  }

  selectRows (selectAll) {
    let selectedRows = {}
    this.state.dataRows.map((item) => {
      if (selectAll && !item.edited) {
        selectedRows[item.uuid] = item
        item.selected = true
      }
      else if (selectAll && item.edited) 
        item.selected = false
      else
        item.selected = selectAll  
      return item
    })

    this.setState({selectedRows, selectedAll: !this.state.selectedAll}, function () {
      this.toggleButtons()
    })
  }

  setRowsToEdit (row, index) {
    let rows = { ...this.state.selectedRows }
    let selectedAll = false

    if (rows.hasOwnProperty(row.uuid)) {
      row.selected = !row.selected
      delete rows[row.uuid]
    } else if(!row.edited) {
      row.selected = true
      rows[row.uuid] = row
    }

    if (Object.keys(rows).length === this.state.dataRows.length) {
      selectedAll = !selectedAll
    }

    this.setState({ selectedRows: rows, selectedAll }, function () {
      this.toggleButtons()
    })
  }

  async handleChange (obj) {

    const row = this.state.dataRows.find((item) => { return obj.uuid === item.uuid })
    
    if (obj.status === 'approved') {
      this.notify('Ajuste aprobado', 3000, toast.TYPE.SUCCESS) 
    }
    else if (obj.status === 'rejected') {
      this.notify('Ajuste rechazado', 3000, toast.TYPE.ERROR) 
    }


    this.selectRows(false)

    return true
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


  render () {
    return (
      <div>
        <ToastContainer />
        <section className='section'>
        {this.getModifyButtons()}
          <EditableTable
            columns={this.getColumns()}
            data={this.state.dataRows}
            handleChange={(e) => this.handleChange(e)}
            setRowsToEdit={(e) => this.setRowsToEdit(e)}
            selectable={true}
            noDouble={true}
          />

        </section>
      </div>
    )
  }
}

export default TabAprove
