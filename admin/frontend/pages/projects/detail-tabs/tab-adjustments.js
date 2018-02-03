import React, { Component } from 'react'
import FontAwesome from 'react-fontawesome'
import api from '~base/api'
import { ToastContainer, toast } from 'react-toastify'
import { EditableTable } from '~base/components/base-editableTable'
import Loader from '~base/components/spinner'
import {
  BaseForm,
  SelectWidget
} from '~base/components/base-form'


const generalAdjustment = 0.1

class TabAdjustment extends Component {
  constructor (props) {
    super(props)
    this.state = {
      dataRows: [],
      isFiltered: false,
      isLoading: '',
      selectedRows: {},
      selectedAll: false,
      filters: {
        channels: [],
        products: [],
        salesCenters: [],
        semanasBimbo: []
      }
    }
  }
  componentWillMount () {
    this.getFilters()
  }

  async getFilters () {
    const url = '/admin/rows/filters/dataset/'
    let res = await api.get(url + this.props.project.activeDataset.uuid)

    this.setState({
      filters: {
        channels: res.channels,
        products: res.products,
        salesCenters: res.salesCenters,
        semanasBimbo: res.semanasBimbo
      }
    })
  }

  async filterChangeHandler (e) {
   
  }


  async FilterErrorHandler (e) {
   
  }

  async getDataRows (e) {
    this.setState({
      isLoading: ' is-loading'
    })
    const url = '/admin/rows/dataset/'
    let data = await api.get(url + this.props.project.activeDataset.uuid,
      {
        semanaBimbo: e.formData.semanasBimbo,
        product: e.formData.products,
        channel: e.formData.channels,
        salesCenter: e.formData.salesCenters
      })

    this.setState({
      dataRows: data.data,
      isFiltered: true,
      isLoading: ''
    })
  }

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
                  checked={state.isRowSelected || false} />
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
        'title': 'Canal',
        'abbreviate': true,
        'abbr': 'Canal',
        'property': 'channelId',
        'default': 'N/A',
        formatter: (row) => {
          return String(row.channel.name)
        }
      },
      {
        'title': 'Semana',
        'property': 'semanaBimbo',
        'default': 'N/A',
        formatter: (row) => {
          return String(row.data.semanaBimbo)
        }
      },
      {
        'title': 'Predicción',
        'property': 'prediction',
        'default': 0,
        formatter: (row) => {
          return String(row.apiData.prediccion)
        }
      },
      {
        'title': 'Ajuste Anterior',
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
          if (row.data.adjustment) {
            return row.data.adjustment.toFixed(2)
          }
          return 'N/A'
        }
      },
      {
        'title': 'Rango',
        'property': 'percentage',
        'default': 0,
        'type': 'number',
        formatter: (row) => {
          if (row.data.percentage) {
            return `${row.data.percentage.toFixed(2)} %`
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
 

  getModifyButtons () {

    return (
      <div className='columns'>
        <div className='column'>
          <h4 className='subtitle'>Resultados: {this.state.dataRows.length} </h4>        
        </div>
        <div className='column'>
          <div className='field is-grouped is-grouped-right'>
            <div className='control'>
              <p style={{ paddingTop: 5 }}>Modificar porcentaje</p>
            </div>
            
            <div className='control'>
              <button
                className='button'
                style={{ paddingLeft: 14, paddingRight: 14 }}
                onClick={() => this.onClickButtonMinus()}
                disabled={this.state.disableButtons}
              >
                -
                </button>
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
          </div>
        </div>
      </div>
    )
  }


  selectRows (selectAll) {
    let selectedRows = {}
    this.state.dataRows.map((item) => {
      if (selectAll) selectedRows[item.uuid] = item

      item.selected = selectAll
      return item
    })

    this.setState({selectedRows, selectedAll: !this.state.selectedAll}, function () {
      this.toggleButtons()
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

    if (Object.keys(rows).length === this.state.dataRows.length) {
      selectedAll = !selectedAll
    }

    this.setState({selectedRows: rows, selectedAll}, function () {
      this.toggleButtons()
    })
  }

  async onClickButtonPlus () {
    let rows = this.state.selectedRows

    for (var item in rows) {
      console.log(rows[item])
      let toAdd = rows[item].data.prediction * 0.01
      if (Math.round(toAdd) === 0)
        toAdd = 1
      rows[item].edited = true
      var adjustment = rows[item].data.adjustment
      var newAdjustment = rows[item].data.adjustment + toAdd
      rows[item].data.adjustment = newAdjustment
      const res = await this.handleChange(rows[item])
      if (!res)
      rows[item].data.adjustment = adjustment
    }
  }

  async onClickButtonMinus () {
    let rows = this.state.selectedRows

    for (var item in rows) {
      console.log(rows[item])
      let toAdd = rows[item].data.prediction * 0.01
      if (Math.round(toAdd) === 0)
        toAdd = 1
      rows[item].edited = true
      var adjustment = rows[item].data.adjustment
      var newAdjustment = rows[item].data.adjustment - toAdd
      rows[item].data.adjustment = newAdjustment
      const res = await this.handleChange(rows[item])
      if (!res)
      rows[item].data.adjustment = adjustment
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

  async handleChange (obj) {
    const prediction = this.state.dataRows.find((item) => { return obj.uuid === item.uuid })
    console.log(obj)

    var maxAdjustment = Math.ceil(prediction.data.adjustment * (1 + generalAdjustment))
    var minAdjustment = Math.floor(prediction.data.adjustment * (1 - generalAdjustment))
    obj.data.adjustment = Math.round(obj.data.adjustment)
    obj.data.percentage = (obj.data.adjustment - obj.data.prediction) * 100 / obj.data.prediction

    obj.isLimit = (obj.data.adjustment >= maxAdjustment || obj.data.adjustment <= minAdjustment)

    var url = '/admin/rows/' + obj.uuid
    const res = await api.post(url, {...obj})

    obj.lastAdjustment = res.data.data.lastAdjustment
    obj.edited = true

    this.notify('Ajuste guardado!', 3000, toast.TYPE.SUCCESS)

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
    if (!this.state.dataRows || !this.state.filters) {
      return <Loader />
    }

    var schema = {
      type: 'object',
      title: '',
      properties: {
        channels: {
          type: 'string',
          title: 'Canales',
          enum: [],
          enumNames: []
        },
        products: {
          type: 'string',
          title: 'Productos',
          enum: [],
          enumNames: []
        },
        salesCenters: {
          type: 'string',
          title: 'Centros de Venta',
          enum: [],
          enumNames: []
        },
        semanasBimbo: {
          type: 'number',
          title: 'Semana',
          enum: []
        }
      }
    }

    const uiSchema = {
      channels: { 'ui:widget': SelectWidget },
      products: { 'ui:widget': SelectWidget },
      salesCenters: { 'ui:widget': SelectWidget },
      semanasBimbo: { 'ui:widget': SelectWidget }
    }

    schema.properties.channels.enum = this.state.filters.channels.map(item => { return item.uuid })
    schema.properties.channels.enumNames = this.state.filters.channels.map(item => { return item.name })

    schema.properties.products.enum = this.state.filters.products.map(item => { return item.uuid })
    schema.properties.products.enumNames = this.state.filters.products.map(item => { return item.name })

    schema.properties.salesCenters.enum = this.state.filters.salesCenters.map(item => { return item.uuid })
    schema.properties.salesCenters.enumNames = this.state.filters.salesCenters.map(item => { return item.name })

    schema.properties.semanasBimbo.enum = this.state.filters.semanasBimbo

    return (
      <div className='card'>
        <header className='card-header'>
          <p className='card-header-title'> Ajustes </p>
        </header>
        <div className='card-content'>
        <ToastContainer />

          <BaseForm
            schema={schema}
            uiSchema={uiSchema}
            onChange={(e) => { this.filterChangeHandler(e) }}
            onSubmit={(e) => { this.getDataRows(e) }}
            onError={(e) => { this.FilterErrorHandler(e) }}
          >
            <div className='field is-grouped'>
              <div className='control'>
                <button className={'button is-primary' + this.state.isLoading} type='submit'>Filtrar</button>
              </div>
            </div>
          </BaseForm>
          <section className='section'>

            {!this.state.isFiltered
              ? <article className='message is-primary'>
                <div className='message-header'>
                  <p>Información</p>
                </div>
                <div className='message-body'>
                  Debe aplicar un filtro para visualizar información
                </div>
              </article>
              : <div>
                {this.getModifyButtons()}
                <EditableTable
                  columns={this.getColumns()}
                  data={this.state.dataRows}
                  handleChange={(e) => this.handleChange(e)}
                  setRowsToEdit={(e) => this.setRowsToEdit(e)}
                  selectable
                />
              </div>
            }
          </section>
        </div>
      </div>
    )
  }
}

export default TabAdjustment
