import React, { Component } from 'react'
import FontAwesome from 'react-fontawesome'
import api from '~base/api'
import tree from '~core/tree'
import { toast } from 'react-toastify'
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
var currentRole

class TabAdjustment extends Component {
  constructor (props) {
    super(props)
    this.state = {
      dataRows: [],
      isFiltered: false,
      filtersLoaded: false,      
      isLoading: '',
      selectedAll: false,
      modified: 0,
      filters: {
        channels: [],
        products: [],
        salesCenters: [],
        semanasBimbo: [],
        categories: []
      },
      formData: {
        semanasBimbo: 0
      },
      disableButtons: true,
      selectedCheckboxes: new Set(),
      searchTerm: '',
      isConciliating: ''
    }

    currentRole = tree.get('user').currentRole.slug
    this.interval = null
  }

  componentWillMount () {
    this.getFilters()
    this.getModifiedCount()

    if (this.props.canEdit && currentRole !== 'enterprisemanager') {
      this.interval = setInterval(() => { this.getModifiedCount() }, 10000)
    }
  }

  componentWillUnmount () {
    clearInterval(this.interval)
  }

  async getFilters() {
    if (this.props.project.activeDataset) {
      const url = '/app/rows/filters/dataset/'
      let res = await api.get(url + this.props.project.activeDataset.uuid)

      this.setState({
        filters: {
          channels: res.channels,
          products: res.products,
          salesCenters: res.salesCenters,
          semanasBimbo: res.semanasBimbo,
          categories: this.getCategory(res.products)
        },
        formData: {
          semanasBimbo: res.semanasBimbo[0]
        },
        filtersLoaded: true
      })
    }
  }

  async getModifiedCount () {
    if (this.props.project.activeDataset) {
      const url = '/app/rows/modified/dataset/'
      let res = await api.get(url + this.props.project.activeDataset.uuid)

      this.setState({
        modified: res.data
      })
    }
  }

  getCategory (products) {
    const categories = new Set()
    products.map((item) => {
      if (item.category && !categories.has(item.category)) {
        categories.add(item.category)
      }
    })
    return Array.from(categories)
  }
  
  async filterChangeHandler (e) {
    this.setState({
      formData: {
        semanasBimbo: e.formData.semanasBimbo,
        products: e.formData.products,
        channels: e.formData.channels,
        salesCenters: e.formData.salesCenters,
        categories: e.formData.categories
      }
    })
  }

  async filterErrorHandler (e) {

  }

  async getDataRows (e) {

    this.setState({
      isLoading: ' is-loading'
    })
    const url = '/app/rows/dataset/'
    let data = await api.get(url + this.props.project.activeDataset.uuid,
      {
        semanaBimbo: e.formData.semanasBimbo,
        product: e.formData.products,
        channel: e.formData.channels,
        salesCenter: e.formData.salesCenters,
        category: e.formData.categories
      })

    this.setState({
      dataRows: this.getEditedRows(data.data),
      isFiltered: true,
      isLoading: '',
      selectedCheckboxes: new Set()
    })
    this.clearSearch()
  }

  getEditedRows(data) {
    for (let row of data) {
      if (row.adjustment != row.prediction) {
        row.wasEdited = true
        var maxAdjustment = Math.ceil(row.prediction * (1 + generalAdjustment))
        var minAdjustment = Math.floor(row.prediction * (1 - generalAdjustment))
        row.isLimit = (row.adjustment >= maxAdjustment || row.adjustment <= minAdjustment)
      }
    }
    return data
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
          if (currentRole !== 'enterprisemanager') {
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
          else {
            return row.adjustment
          }
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
          if (currentRole !== 'enterprisemanager') {
            return (
              <Checkbox
                label='checkAll'
                handleCheckboxChange={(e) => this.checkAll(!this.state.selectedAll)}
                key='checkAll'
                checked={this.state.selectedAll}
                hideLabel />
            )
          }
        })(),
        'property': 'checkbox',
        'default': '',
        formatter: (row) => {
          if (!row.selected) {
            row.selected = false
          }
          if (currentRole !== 'enterprisemanager') {
            return (
              <Checkbox
                label={row}
                handleCheckboxChange={this.toggleCheckbox}
                key={row}
                checked={row.selected}
                hideLabel />
            )
          }
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
    for (let row of this.state.filteredData) {
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

  uncheckAll() {
    for (let row of this.state.dataRows) {
      row.selected = false
    }
    this.setState({
      selectedCheckboxes: new Set(),
      selectedAll: false
    }, function () {
      this.toggleButtons()
    })
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
        {currentRole !== 'enterprisemanager' ?
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
        </div> : null }
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

    if ((currentRole === 'opsmanager' || currentRole === 'localmanager')) {
      if (obj.adjustment > maxAdjustment || obj.adjustment < minAdjustment) {
        this.notify(' No te puedes pasar de los límites establecidos!', 3000, toast.TYPE.ERROR)
        return false
      }
    }

    var url = '/app/rows/' + obj.uuid
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
    if (this.state.selectedCheckboxes.has(this.state.selectedAR)) {
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

      if (regEx.test(item.productName) || regEx.test(item.productId) || regEx.test(item.channel) || regEx.test(item.salesCenter))
        return item 
      else
        return null  
    })
    .filter(function(item){ return item != null });
    
    this.setState({
      filteredData: items
    })
  }

  searchOnChange = (e) => {
    this.uncheckAll()

    this.setState({
      searchTerm: e.target.value
    }, () => this.searchDatarows())
  }

  clearSearch = () => {
    this.uncheckAll()
    this.setState({
      searchTerm: ''
    }, () => this.searchDatarows())
  }

  async conciliateOnClick () {
    this.setState({
      isConciliating: ' is-loading'
    })
    var url = '/app/datasets/' + this.props.project.activeDataset.uuid + '/set/conciliate'
    await api.post(url)
    await this.props.load()

    this.setState({
      isConciliating: ''
    })
  }

  render () {
    if (this.props.project.status === 'empty') {
      return (
        <div className='section columns'>
          <div className='column'>
            <article className='message is-warning'>
              <div className='message-header'>
                <p>Atención</p>
              </div>
              <div className='message-body has-text-centered is-size-5'>
                Se debe agregar al menos un
                <strong> dataset </strong> para poder generar ajustes.
              </div>
            </article>
          </div>
        </div>
      )
    }

    if (this.props.project.status === 'processing') {
      return (
        <div className='section has-text-centered subtitle has-text-primary'>
          Se están obteniendo las filas para ajuste, en un momento más las podrá consultar.
          <Loader />
        </div>
      )
    }

    if (this.props.project.status === 'pendingRows') {
      return (
        <div className='section has-text-centered subtitle has-text-primary'>
          Se está preparando al proyecto para generar un dataset de ajuste, espere por favor.
          <Loader />
        </div>
      )
    }

    if (!this.state.filters.semanasBimbo.length > 0 && this.state.filtersLoaded) {
      return (
        <div className='section has-text-centered subtitle has-text-primary'>
          El proyecto no continene data rows
        </div>
      )
    }

    if (!this.state.filters.semanasBimbo.length > 0 && !this.state.filtersLoaded) {
      return (
        <div className='section has-text-centered subtitle has-text-primary'>
          Cargando un momento por favor
          <Loader />
        </div>
      )
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
        categories: {
          type: 'string',
          title: 'Categorias de producto',
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
      semanasBimbo: {'ui:widget': SelectWidget, 'ui:placeholder': 'Seleccione semana'},
      channels: {'ui:widget': SelectWidget, 'ui:placeholder': 'Seleccione canal'},
      products: {'ui:widget': SelectWidget, 'ui:placeholder': 'Seleccione producto'},
      categories: {'ui:widget': SelectWidget, 'ui:placeholder': 'Seleccione categoria'},
      salesCenters: {'ui:widget': SelectWidget, 'ui:placeholder': 'Seleccione Centro de Venta'}
    }

    schema.properties.semanasBimbo.enum = this.state.filters.semanasBimbo

    schema.properties.channels.enum = this.state.filters.channels.map(item => { return item.uuid })
    schema.properties.channels.enumNames = this.state.filters.channels.map(item => { return item.name })

    schema.properties.products.enum = this.state.filters.products.map(item => { return item.uuid })
    schema.properties.products.enumNames = this.state.filters.products.map(item => { return item.name })

    schema.properties.categories.enum = this.state.filters.categories
    schema.properties.categories.enumNames = this.state.filters.categories

    schema.properties.salesCenters.enum = this.state.filters.salesCenters.map(item => { return item.uuid })
    schema.properties.salesCenters.enumNames = this.state.filters.salesCenters.map(item => { return item.name })

    return (
      <div className='card'>
        <header className='card-header'>
          <p className='card-header-title'> Ajustes </p>
        </header>
        {currentRole === 'enterprisemanager' ?
          <div className='notification is-error has-text-centered is-uppercase  is-paddingless'>
            <span className='icon is-medium has-text-warning'>
              <i className='fa fa-warning'></i>
            </span>
            Modo de Visualización - No se permiten ajustes para tu tipo de usuario.
          </div>
          :
          <div className='notification is-warning has-text-centered is-uppercase is-paddingless'>
            <span className='icon is-medium has-text-info'>
              <i className='fa fa-warning'></i>
            </span>
            Modo de Ajuste - Para este periodo se permite un ajuste máximo de <strong>{(generalAdjustment * 100) + '%'}</strong> sobre el ajuste anterior.
            {currentRole === 'opsmanager' && ' Tu tipo de usuario permite ajustes fuera de rango'}
          </div>
        }
        <div className='section is-paddingless-top'>
          
          <CreateAdjustmentRequest
            className={this.state.classNameAR}
            hideModal={(e) => this.hideModalAdjustmentRequest(e)}
            finishUp={(e) => this.finishUpAdjustmentRequest(e)}
            prediction={this.state.selectedAR}
            baseUrl={'/app/rows/'}
          />
          <div className='columns'>
            <div className='column'>
              <BaseForm
                schema={schema}
                uiSchema={uiSchema}
                formData={this.state.formData}
                onChange={(e) => { this.filterChangeHandler(e) }}
                onSubmit={(e) => { this.getDataRows(e) }}
                onError={(e) => { this.filterErrorHandler(e) }}
              >
                <div className='field is-grouped'>
                  <div className='control'>
                    <button
                      className={'button is-primary is-medium' + this.state.isLoading}
                      type='submit'
                      disabled={!!this.state.isLoading}
                    >
                      Filtrar
                    </button>
                  </div>
                </div>
              </BaseForm>
            </div>
            { this.props.canEdit && currentRole !== 'enterprisemanager' &&
              <div className='column has-text-right'>
                <div className='field is-grouped is-grouped-right'>
                  <div className='control'>
                    <button
                      className={'button is-success is-medium' + this.state.isConciliating}
                      disabled={!!this.state.isConciliating}
                      type='button'
                      onClick={e => this.conciliateOnClick()}
                    >
                      Confirmar ajustes ({ this.state.modified })
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>
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
                  data={this.state.filteredData}
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
