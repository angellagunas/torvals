import React, { Component } from 'react'
import moment from 'moment'
import api from '~base/api'
import Loader from '~base/components/spinner'
import {
  BaseForm,
  SelectWidget
} from '~base/components/base-form'
import { BaseTable } from '~base/components/base-table'
import Checkbox from '~base/components/base-checkbox'
import Editable from '~base/components/base-editable'
import { toast } from 'react-toastify'

var currentRole

class TabAnomalies extends Component {
  constructor (props) {
    super(props)
    this.state = {
      isLoading: '',
      isFiltered: false,
      filters: {
        products: [],
        salesCenters: [],
        categories: []
      },
      formData: {
      },
      anomalies: [],
      selectAll: false,
      selected: new Set(),
      disableButton: true,
      sortAscending: true      
    }
    currentRole = tree.get('user').currentRole.slug
  }
 
  async getProducts () {
    const url = '/app/products/'
    let res = await api.get(url, {
      start: 0,
      limit: 0,
      sort: 'name',
      organization: this.props.project.organization.uuid
    })
    this.setState({
      filters: {
        ...this.state.filters,
        products: res.data
      }
    }, () => {
      this.getCategory(res.data)
    })
  }

  async getSalesCent () {
    const url = '/app/salesCenters/'
    let res = await api.get(url, {
      start: 0,
      limit: 0,
      sort: 'name',
      organization: this.props.project.organization.uuid
    })

    this.setState({
      filters: {
        ...this.state.filters,
        salesCenters: res.data
      }
    })

    if (res.data.length === 1) {
      this.setState({
        formData: {
          ...this.state.formData,
          salesCenter: res.data[0].uuid
        }
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
    this.setState({
      filters: {
        ...this.state.filters,
        categories: Array.from(categories)
      }
    })
  }

  async filterChangeHandler (e) {
    this.setState({
      formData: {
        product: e.formData.product,
        salesCenter: e.formData.salesCenter,
        category: e.formData.category
      }
    })
  }

  async filterErrorHandler (e) {
    this.setState({
      isLoading: ''
    })
  }

  async getData (e) {
    this.setState({
      isLoading: ' is-loading'
    })

    let url = '/app/anomalies/list/' + this.props.project.uuid
    try {
      let res = await api.get(url, {
        ...this.state.formData
      })

      this.setState({
        anomalies: res.data,
        isLoading: '',
        isFiltered: true
      })

      if(res.data.length === 0)
        this.notify('No hay anomalias que mostrar', 5000, toast.TYPE.INFO)      
        
    } catch (e) {
      this.setState({
        isLoading: '',
        isFiltered: false
      })
      this.notify('Error:Intente de nuevo', 5000, toast.TYPE.ERROR)      
    }
  }

  async getFilters () {
    await this.getSalesCent()
    await this.getProducts()
    await this.getData()
  }

  getColumns () {
    let cols = [
      {
        'title': 'Id',
        'property': 'productId',
        'default': 'N/A',
        'sortable': true,                        
        formatter: (row) => {
          return String(row.product.externalId)
        }
      },
      {
        'title': 'Producto',
        'property': 'product.name',
        'default': 'N/A',
        'sortable': true,                                
        formatter: (row) => {
          return String(row.product.name)
        }
      },
      {
        'title': 'Categoría',
        'property': 'product.category',
        'default': 'N/A',
        'sortable': true,                                
        formatter: (row) => {
          if (row.product.category){
            return String(row.product.category)
          }
          else{
            return 'Sin categoría'
          }
        }
      },
      {
        'title': 'Tipo de Anomalia',
        'property': 'type',
        'default': 'N/A',
        'sortable': true,                                
        formatter: (row) => {
          return String(row.type)
        }
      },
      {
        'title': 'Fecha',
        'property': 'dateCreated',
        'default': 'N/A',
        'sortable': true,                                
        formatter: (row) => {
          return moment.utc(row.dateCreated).local().format('DD/MM/YYYY hh:mm a')
        }
      },
      {
        'title': 'Predicción',
        'property': 'prediction',
        'default': 0,
        'type': 'number',
        'sortable': true,                                
        formatter: (row) => {
          if (currentRole !== 'manager-level-3') {
          return (
            <Editable
              value={row.prediction}
              handleChange={this.changeAdjustment}
              type='number'
              obj={row}
              width={80}
            />
          )
          }
          else{
            return row.prediction
          }
        }
      },
      {
        'title': 'Seleccionar Todo',
        'abbreviate': true,
        'abbr': (() => {
          if (currentRole !== 'manager-level-3') {
          return (
            <Checkbox
              label='checkAll'
              handleCheckboxChange={(e) => this.checkAll(!this.state.selectAll)}
              key='checkAll'
              checked={this.state.selectAll}
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
          if (currentRole !== 'manager-level-3') {
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
      }
    ]

    if ( this.state.filters.salesCenters.length > 1){
      cols.splice(3,0, { 
        'title': 'Centro de venta',
        'abbreviate': true,
        'abbr': 'C. Venta',
        'property': 'salesCenter',
        'default': 'N/A',
        formatter: (row) => {
          return String(row.salesCenter.name)
        }
      })
    }

    return cols
  }

  changeAdjustment = async (value, row) => {
    row.prediction = value
    const res = await this.handleChange(row)
    if (!res) {
      return false
    }
    return res
  }


  async handleChange(obj) {

    var url = '/app/anomalies/' + obj.uuid
    const res = await api.post(url, { ...obj })
    
    if(res.data){
      obj.edited = true
      let index = this.state.anomalies.findIndex((item) => { return obj.uuid === item.uuid })
      let aux = this.state.anomalies

      aux.splice(index, 1, obj)

      this.setState({
        anomalies: aux
      })

      this.notify('Ajuste guardado!', 5000, toast.TYPE.INFO)
      
    }
    else{
      this.notify('Intente de nuevo', 5000, toast.TYPE.ERROR)
    }

    return true
  }


  notify(message = '', timeout = 5000, type = toast.TYPE.INFO) {
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

  async restore () {
    this.setState({
      isRestoring: ' is-loading'
    })
    let url = '/app/anomalies/restore/'
    let res = await api.post(url + this.props.project.uuid, {
      anomalies: this.state.selected
    })

    if (res.data.status === 'ok') {
      url = '/app/datasets/' + this.props.project.activeDataset.uuid + '/set/conciliate'
      try {
        await api.post(url)
      } catch (e) {
        this.setState({
          isRestoring: ''
        })
        this.notify('Error ' + e.message, 5000, toast.TYPE.ERROR)
      }
      this.state.selected.clear()
      this.setState({
        isRestoring: ''
      })
    }

    this.props.reload('configuracion')
  }
  
   

  checkAll = (check) => {
    this.state.selected.clear()
    for (let item of this.state.anomalies) {
      if (check)
        this.state.selected.add(item)

      item.selected = check
    }
    this.setState({ selectAll: check })
    this.toggleButtons()
  }

  toggleCheckbox = (item) => {
    if (this.state.selected.has(item)) {
      this.state.selected.delete(item)
      item.selected = false
    }
    else {
      this.state.selected.add(item)
      
      item.selected = true
    }
    this.toggleButtons()
  }

  componentDidMount () {
    this.getFilters()
  }

  toggleButtons() {
    let disable = true

    if (this.state.selected.size > 0)
      disable = false
    else if (this.state.selected.size <= 0) {
      this.setState({
        selectAll: false
      })
    }
    this.setState({
      disableButton: disable
    })
  }

  handleSort(e){
    let sorted = this.state.anomalies

    if (e === 'productId'){
          if (this.state.sortAscending){
            sorted.sort((a, b) => { return parseFloat(a.product.externalId) - parseFloat(b.product.externalId) })
          }
          else{
            sorted.sort((a, b) => { return parseFloat(b.product.externalId) - parseFloat(a.product.externalId) })                        
          }
    }
    else{
      if (this.state.sortAscending){
        sorted = _.orderBy(sorted,[e], ['asc'])
              
      }
      else{
        sorted = _.orderBy(sorted,[e], ['desc'])    
      }
    }
    
    this.setState({
      anomalies: sorted,
      sortAscending: !this.state.sortAscending,
      sortBy: e
    })
  }

  render () {
    if (this.state.filters.products.length === 0 ||
      this.state.filters.salesCenters.length === 0
    ) {
      return <Loader />
    }

    var schema = {
      type: 'object',
      title: '',
      properties: {}
    }

    const uiSchema = {
      salesCenter: { 'ui:widget': SelectWidget, 'ui:placeholder': 'Todos los centros de venta' },
      product: { 'ui:widget': SelectWidget, 'ui:placeholder': 'Todos los productos' },
      category: { 'ui:widget': SelectWidget, 'ui:placeholder': 'Todas las categorias' }
    }

    if (this.state.filters.products.length > 0) {
      schema.properties.product = {
        type: 'string',
        title: 'Productos',
        enum: [],
        enumNames: []
      }
      schema.properties.product.enum = this.state.filters.products.map(item => { return item.uuid })
      schema.properties.product.enumNames = this.state.filters.products.map(item => { return item.name })
    }
    
    if (this.state.filters.categories.length > 0) {
      schema.properties.category = {
        type: 'string',
        title: 'Categorias de producto',
        enum: [],
        enumNames: []
      }
      schema.properties.category.enum = this.state.filters.categories
      schema.properties.category.enumNames = this.state.filters.categories
    }
    if (this.state.filters.salesCenters.length > 0) {
      schema.properties.salesCenter = {
        type: 'string',
        title: 'Centros de Venta',
        enum: [],
        enumNames: []
      }
      schema.properties.salesCenter.enum = this.state.filters.salesCenters.map(item => { return item.uuid })
      schema.properties.salesCenter.enumNames = this.state.filters.salesCenters.map(item => { return 'Centro de Venta ' + item.name })
      if (this.state.filters.salesCenters.length === 1) {
        uiSchema.salesCenter['ui:disabled'] = true
      }
    }
    
    return (
      <div className='section'>
        <div className='columns'>
          <div className='column is-half'>
            <BaseForm
              className='inline-form'
              schema={schema}
              uiSchema={uiSchema}
              formData={this.state.formData}
              onChange={(e) => { this.filterChangeHandler(e) }}
              onSubmit={(e) => { this.getData(e) }}
              onError={(e) => { this.filterErrorHandler(e) }}
            >
              <div className='field is-grouped'>
                <div className='control'>
                  <button
                    className={'button is-primary' + this.state.isLoading}
                    type='submit'
                    disabled={!!this.state.isLoading}
                  >
                    <span className='icon'>
                        <i className='fa fa-filter' />
                      </span>
                      <span>
                        Filtrar
                    </span>
                    </button>
                </div>
              </div>
            </BaseForm>
          </div>
          {currentRole !== 'manager-level-3'  && <div className='column has-text-right'>
            <div className='field is-grouped is-grouped-right'>
              <div className='control'>
                <button
                  className={'button is-info is-medium' + this.state.isRestoring}
                  disabled={!!this.state.isRestoring || this.state.disableButton}
                  type='button'
                  onClick={e => this.restore()}
                >
                  Recuperar ({this.state.selected.size})
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
                No hay anomalias que mostrar
              </div>
            </article>
            : <div>
              <BaseTable
                data={this.state.anomalies}
                columns={this.getColumns()}
                sortAscending={this.state.sortAscending}
                sortBy={this.state.sortBy}
                handleSort={(e) => this.handleSort(e)} 
              />
            </div>
          }
        </section>
      </div>
    )
  }
}

export default TabAnomalies
