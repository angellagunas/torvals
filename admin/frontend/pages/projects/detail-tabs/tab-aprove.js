import React, { Component } from 'react'
import api from '~base/api'
import moment from 'moment'
import { EditableTable } from '~base/components/base-editableTable'
import { ToastContainer, toast } from 'react-toastify'
import FontAwesome from 'react-fontawesome'
import { BaseTable } from '~base/components/base-table'
import Checkbox from '~base/components/base-checkbox'

const range = 10

class TabAprove extends Component {
  constructor (props) {
    super(props)
    this.state = {
      dataRows: [],
      isLoading: '',
      selectedAll: false,
      disableButtons: true,
      selectedCheckboxes: new Set()
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
    this.getRemainingItems()
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
          if(!row.selected){
            row.selected = false
          }
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
        'title': 'Ajuste',
        'property': 'adjustment',
        'default': 0,
        'editable': false,
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
            return `${range} %`
        }
      },
      {
        'title': 'Creado',
        'property': 'dateRequested',
        formatter: (row) => {
          return (
            <span title={'Creado por ' + row.requestedBy.name }> 
              { moment.utc(row.dateRequested).local().format('DD/MM/YYYY hh:mm a') }
            </span>  
          )
        }
      },
      {
        'title': 'Aprobado / Rechazado',
        formatter: (row) => {
          if (row.dateRejected) {
            return (
              <span title={'Rechazado por ' + row.rejectedBy.name }> 
                { moment.utc(row.dateRejected).local().format('DD/MM/YYYY hh:mm a') }
              </span>
            )
          }
          else if (row.dateApproved) {
            return (
              <span title={'Aprobado por ' + row.approvedBy.name }>
                { moment.utc(row.dateApproved).local().format('DD/MM/YYYY hh:mm a') }
              </span>
            )
          }
        }
      },
      {
        'title': 'Estatus',
        'property': 'status',
        'default': '',
        'centered': true,
        formatter: (row) => {
          if (row.status === 'created') {
            return (
              <span
                className='icon has-text-info'
                title={'Creado por ' + row.requestedBy.name}>
                <FontAwesome name='info-circle fa-2x' />
              </span>
            )
          }
          if (row.status === 'approved') {
            return (
              <span
                className='icon has-text-success'
                title={'Aprobado por ' + row.approvedBy.name}>
                <FontAwesome name='check-circle fa-2x' />
              </span>
            )
          }
          if (row.status === 'rejected') {
            return (
              <span
                className='icon has-text-danger'
                title={'Rechazado por ' + row.rejectedBy.name}>
                <FontAwesome name='times-circle fa-2x' />
              </span>
            )
          }
          return ''
        }
      },
      {
        'title': 'Seleccionar Todo',
        'abbreviate': true,
        'abbr': (() => {
          if (this.state.remainingItems > 0) {
          return (
            <Checkbox
              label='checkAll'
              handleCheckboxChange={(e) => this.checkAll(!this.state.selectedAll)}
              key='checkAll'
              checked={false}
              hideLabel />
          )
        }
        })(),
        'property': 'checkbox',
        'default': '',
        formatter: (row, state) => {
          if (row.status === 'created') {
            return (
              <Checkbox
                label={row}
                handleCheckboxChange={this.toggleCheckbox}
                key={row}
                checked={this.state.selectedAll}
                hideLabel />
            )
          }
        }
      }
    ]
  }

  checkAll = (check) => {
    for (let row of this.state.dataRows) {
      this.toggleCheckbox(row, !this.state.selectedAll)
    }
    this.setState({selectedAll: !this.state.selectedAll}, function () {
      this.toggleButtons()
    })
  }

  toggleCheckbox = (row, all) => {
    if (row.status === 'created') {
    if (this.state.selectedCheckboxes.has(row) && !all) {
      this.state.selectedCheckboxes.delete(row)
    } 
    else {
      this.state.selectedCheckboxes.add(row)
    }
    
    row.selected = true
    this.toggleButtons()
  }
  }

  getModifyButtons () {
    return (
      <div className='columns'>
        <div className='column'>
          <div className='field is-grouped'>
            <div className='control'>
              <h4 className='subtitle'>Resultados: {this.state.dataRows.length} </h4>
            </div>
            <div className='control'>
              <h4 className='subtitle'>Pendientes: {this.state.remainingItems} </h4>
            </div>
          </div>
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
    let url = '/admin/adjustmentRequests/approve/'

    for (const row of this.state.selectedCheckboxes) {
      row.edited = true
      let res = await api.get(url + row.uuid)

      if (res) {
        row.status = res.data.status
        row.approvedBy = res.data.approvedBy
        row.dateApproved = res.data.dateApproved
        await this.handleChange(row)      
      }
    }
  }

  reject = async () => {
    let url = '/admin/adjustmentRequests/reject/'

    for (const row of this.state.selectedCheckboxes) {
      row.edited = true
      let res = await api.get(url + row.uuid)

      if (res) {
        row.status = res.data.status
        row.approvedBy = res.data.approvedBy
        row.dateApproved = res.data.dateApproved
        await this.handleChange(row)      
      }
    }
  }

  toggleButtons () {
    let disable = true

    if (this.state.selectedCheckboxes.size > 0) 
      disable = false

    this.setState({
      disableButtons: disable
    })
  }

  async handleChange (obj) {

    let index = this.state.dataRows.findIndex((item) => { return obj.uuid === item.uuid })
    let aux = this.state.dataRows

    aux.splice(index,1,obj)

    this.setState({
      dataRows: aux
    })

    if (obj.status === 'approved') {
      this.notify('Ajuste aprobado', 3000, toast.TYPE.SUCCESS) 
    }
    else if (obj.status === 'rejected') {
      this.notify('Ajuste rechazado', 3000, toast.TYPE.ERROR) 
    }

    this.state.selectedCheckboxes.delete(obj)
    this.getRemainingItems()

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

  getRemainingItems () {
    let cont = 0
    for ( let row of this.state.dataRows) {
      if (row.status === 'created') {
        cont++
      }
    }
    this.setState({
      remainingItems: cont
    })
  }

  render () {
    return (
      <div>
        <ToastContainer />
        <section className='section'>
        {this.getModifyButtons()}
        <BaseTable
          data={this.state.dataRows}
          columns={this.getColumns()}
          sortAscending={true}
          sortBy={'name'} />

        </section>
      </div>
    )
  }
}

export default TabAprove
