import React, { Component } from 'react'
import FontAwesome from 'react-fontawesome'
import api from '~base/api'
import { toast } from 'react-toastify'
import { EditableTable } from '~base/components/base-editableTable'
import Loader from '~base/components/spinner'
import {
  BaseForm,
  SelectWidget
} from '~base/components/base-form'
import CreateAdjustmentRequest from '../../forecasts/create-adjustmentRequest'

import { BaseTable } from '~base/components/base-table'
import Checkbox from '~base/components/base-checkbox'
import Editable from '~base/components/base-editable'


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
      },
      formData: {
        semanasBimbo: 0
      },
      disableButtons: true,
      selectedCheckboxes: new Set(),
      searchTerm: ''
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
      },
      formData: {
        semanasBimbo: res.semanasBimbo[0]
      }
    })
  }

  async filterChangeHandler (e) {
    this.setState({
      formData: {
        semanasBimbo: e.formData.semanasBimbo,
        products: e.formData.products,
        channels: e.formData.channels,
        salesCenters: e.formData.salesCenters
      }
    })
  }

  async FilterErrorHandler (e) {

  }

  async getDataRows (e) {
    this.checkAll(false)
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
      isLoading: '',
      selectedCheckboxes: new Set()
    })
    this.toggleButtons()

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
          return String(row.productId)
        }
      },
      {
        'title': 'Product Name',
        'abbreviate': true,
        'abbr': 'P. Name',
        'property': 'productNamed',
        'default': 'N/A',
        formatter: (row) => {
          return String(row.productName)
        }
      },
      {
        'title': 'Centro de venta',
        'abbreviate': true,
        'abbr': 'C. Venta',
        'property': 'salesCenter',
        'default': 'N/A',
        formatter: (row) => {
          return String(row.salesCenter)
        }
      },
      {
        'title': 'Canal',
        'abbreviate': true,
        'abbr': 'Canal',
        'property': 'channel',
        'default': 'N/A',
        formatter: (row) => {
          return String(row.channel)
        }
      },
      {
        'title': 'Semana',
        'property': 'semanaBimbo',
        'default': 'N/A',
        formatter: (row) => {
          return String(row.semanaBimbo)
        }
      },
      {
        'title': 'Predicción',
        'property': 'prediction',
        'default': 0,
        formatter: (row) => {
          return String(row.prediction)
        }
      },
      {
        'title': 'Ajuste Anterior',
        'property': 'lastAdjustment',
        'default': 0,
        formatter: (row) => {
          if (row.lastAdjustment) {
            return row.lastAdjustment
          }
        }
      },
      {
        'title': 'Ajuste',
        'property': 'adjustment',
        'default': 0,
        'type': 'number',
        formatter: (row) => {
          if (!row.adjustment) {
            row.adjustment = 0
          }
          return (
            <Editable 
              value={row.adjustment}
              handleChange={this.changeAdjustment}
              type='number'
              obj={row}
              width={80}
            />
          )
        }
      },
      {
        'title': 'Rango',
        'property': 'percentage',
        'default': 0,
        'type': 'number',
        formatter: (row) => {
          return `${(generalAdjustment * 100).toFixed(2)} %`
        }
      },
      {
        'title': 'Seleccionar Todo',
        'abbreviate': true,
        'abbr': (() => {
          return (
            <Checkbox
              label='checkAll'
              handleCheckboxChange={(e) => this.checkAll(!this.state.selectedAll)}
              key='checkAll'
              checked={this.state.selectedAll}
              hideLabel />
          )
        })(),
        'property': 'checkbox',
        'default': '',
        formatter: (row) => {
          return (
            <Checkbox
              label={row}
              handleCheckboxChange={this.toggleCheckbox}
              key={row}
              checked={row.selected}
              hideLabel />
          )
        }
      },
      {
        'title': '',
        'abbreviate': true,
        'abbr': (() => {
          return (
            <div className='is-invisible'>
              <span
                className='icon'
                title='límite'
              >
                <FontAwesome name='warning fa-lg' />
              </span>
            </div>
          )
        })(),
        'property': 'isLimit',
        'default': '',
        formatter: (row) => {
          if (row.isLimit && !row.adjustmentRequest) {
            return (
              <span
                className='icon has-text-danger'
                title='No es posible ajustar más allá al límite!'
                onClick={() => {
                  this.showModalAdjustmentRequest(row)
                }}
              >
                <FontAwesome name='warning fa-lg' />
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
                <FontAwesome name='info-circle fa-lg' />
              </span>
            )
          }
          return ''
        }
      }
    ]
  }

  checkAll = (check) => {
    for (let row of this.state.dataRows) {
      this.toggleCheckbox(row, check)
    }
    this.setState({ selectedAll: check }, function () {
      this.toggleButtons()
    })
  }

  toggleCheckbox = (row, all) => {
    if (this.state.selectedCheckboxes.has(row) && !all) {
      this.state.selectedCheckboxes.delete(row)
      row.selected = false
    }
    else {
      this.state.selectedCheckboxes.add(row)
      row.selected = true
    }

    this.toggleButtons()
  }

  changeAdjustment = async (value, row) => {
    row.adjustment = value
    const res = await this.handleChange(row)
    if (!res) {
      return false
    }
    return res
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
              <div className='field has-addons'>
                <div className='control'>
                  <input 
                    className='input'
                    type='text'
                    value={this.state.searchTerm}
                    onChange={this.searchOnChange} placeholder='Buscar' />
                </div>
                <div className='control'>
                  <a className='button is-light' onClick={this.clearSearch}>
                    Limpiar
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div> 
        <div className='column'>
          <div className='field is-grouped is-grouped-right'>
            <div className='control'>
              <p style={{ paddingTop: 5 }}>Modificar porcentaje</p>
            </div>

            <div className='control'>
              <button
                className='button is-primary is-outlined'
                onClick={() => this.onClickButtonMinus()}
                disabled={this.state.disableButtons}
              >
                <span className='icon'>
                  <i className='fa fa-minus' />
                </span>
              </button>
            </div>
            <div className='control'>
              <button
                className='button is-primary is-outlined'
                onClick={() => this.onClickButtonPlus()}
                disabled={this.state.disableButtons}
              >
                <span className='icon'>
                  <i className='fa fa-plus' />
                </span>
                </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  async onClickButtonPlus () {
    for (const row of this.state.selectedCheckboxes) {
      let toAdd = row.prediction * 0.01
      if (Math.round(toAdd) === 0) { 
        toAdd = 1
      }
      var adjustment = row.adjustment
      var newAdjustment = row.adjustment + toAdd
      row.adjustment = newAdjustment
      const res = await this.handleChange(row)
      if (!res) {
        row.adjustment = adjustment
      }      
    }
  }

  async onClickButtonMinus () {
    for (const row of this.state.selectedCheckboxes) {
      let toAdd = row.prediction * 0.01
      if (Math.round(toAdd) === 0) { 
        toAdd = 1
      }
      var adjustment = row.adjustment
      var newAdjustment = row.adjustment - toAdd
      row.adjustment = newAdjustment
      const res = await this.handleChange(row)
      if (!res) {
        row.adjustment = adjustment
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
    
    var maxAdjustment = Math.ceil(obj.prediction * (1 + generalAdjustment))
    var minAdjustment = Math.floor(obj.prediction * (1 - generalAdjustment))

    obj.adjustment = Math.round(obj.adjustment)
    obj.percentage = (obj.adjustment - obj.prediction) * 100 / obj.prediction
    obj.isLimit = (obj.adjustment >= maxAdjustment || obj.adjustment <= minAdjustment)

    var url = '/admin/rows/' + obj.uuid
    const res = await api.post(url, {...obj})

    obj.lastAdjustment = res.data.data.lastAdjustment
    
    obj.edited = true


    let index = this.state.dataRows.findIndex((item) => { return obj.uuid === item.uuid })
    let aux = this.state.dataRows

    aux.splice(index,1,obj)

    this.setState({
      dataRows: aux
    })

    this.notify('Ajuste guardado!', 3000, toast.TYPE.INFO)
    
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

  showModalAdjustmentRequest (obj) {
    obj.adjustment = '' + obj.adjustment
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
    if (this.state.selectedRows.hasOwnProperty(this.state.selectedAR.uuid)) {
      this.state.selectedAR.adjustmentRequest = true
    }
    this.setState({
      selectedAR: undefined
    })
  }

  searchDatarows() {
    const items = this.state.dataRows.map((item) => {
      if (this.state.searchTerm === ''){
        return item
      }
      const regEx = new RegExp(this.state.searchTerm, 'gi')

      if (regEx.test(item.productName) || regEx.test(item.Id) || regEx.test(item.channel) || regEx.test(item.salesCenter))
        return item 
      else
        return null  
    })
    .filter(function(item){ return item != null });
    
    return items
  }

  searchOnChange = (e) => {
    this.setState({
      searchTerm: e.target.value
    })
  }

  clearSearch = () => {
    this.setState({
      searchTerm: ''
    })
  } 

  render () {
    if (!this.state.dataRows || !this.state.filters.semanasBimbo.length > 0) {
      return <Loader />
    }

    var schema = {
      type: 'object',
      title: '',
      properties: {
        semanasBimbo: {
          type: 'number',
          title: 'Semana',
          enum: []
        },
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
        }
      }
    }

    const uiSchema = {
      semanasBimbo: {'ui:widget': SelectWidget, 'ui:placeholder': 'Selecciona semana'},
      channels: {'ui:widget': SelectWidget, 'ui:placeholder': 'Selecciona canal'},
      products: {'ui:widget': SelectWidget, 'ui:placeholder': 'Selecciona producto'},
      salesCenters: {'ui:widget': SelectWidget, 'ui:placeholder': 'Selecciona Centro de Venta'}
    }

    schema.properties.semanasBimbo.enum = this.state.filters.semanasBimbo

    schema.properties.channels.enum = this.state.filters.channels.map(item => { return item.uuid })
    schema.properties.channels.enumNames = this.state.filters.channels.map(item => { return item.name })

    schema.properties.products.enum = this.state.filters.products.map(item => { return item.uuid })
    schema.properties.products.enumNames = this.state.filters.products.map(item => { return item.name })

    schema.properties.salesCenters.enum = this.state.filters.salesCenters.map(item => { return item.uuid })
    schema.properties.salesCenters.enumNames = this.state.filters.salesCenters.map(item => { return item.name })

    return (
      <div className='card'>
        <header className='card-header'>
          <p className='card-header-title'> Ajustes </p>
        </header>
        <div className='card-content'>
          
          <CreateAdjustmentRequest
            className={this.state.classNameAR}
            hideModal={(e) => this.hideModalAdjustmentRequest(e)}
            finishUp={(e) => this.finishUpAdjustmentRequest(e)}
            prediction={this.state.selectedAR}
            baseUrl={'/admin/rows/'}
          />
          <BaseForm
            schema={schema}
            uiSchema={uiSchema}
            formData={this.state.formData}
            onChange={(e) => { this.filterChangeHandler(e) }}
            onSubmit={(e) => { this.getDataRows(e) }}
            onError={(e) => { this.FilterErrorHandler(e) }}
          >
            <div className='field is-grouped'>
              <div className='control'>
                <button className={'button is-primary is-medium' + this.state.isLoading} type='submit'>Filtrar</button>
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
                <BaseTable
                  data={this.searchDatarows()}
                  columns={this.getColumns()}
                  sortAscending
                  sortBy={'name'} />
              </div>
            }
          </section>
        </div>
      </div>
    )
  }
}

export default TabAdjustment
