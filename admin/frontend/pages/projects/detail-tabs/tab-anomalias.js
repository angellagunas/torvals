import React, { Component } from 'react'
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

class TabAnomalias extends Component {
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
      anomalias: [],
      selectAll: false,
      selected: new Set()
    }
  }

  async getProducts () {
    const url = '/admin/products/'
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
    const url = '/admin/salesCenters/'
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
        product: e.formData.products,
        salesCenter: e.formData.salesCenters,
        category: e.formData.categories
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

    let url = '/admin/projects/historical/' + this.props.project.uuid
    try {
      let res = await api.post(url, {
        ...this.state.formData
      })
      this.setState({
        anomalias: res.data,
        isLoading: ''
      })
    } catch (e) {
      this.setState({
        isLoading: ''
      })
      this.notify('Error:Intente de nuevo', 3000, toast.TYPE.ERROR)      
    }
  }

  async getFilters () {
    await this.getSalesCent()
    await this.getProducts()
    await this.getData()
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
        'title': 'Categoría',
        'property': 'category',
        'default': 'N/A',
        formatter: (row) => {
          return String(row.category)
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
        'title': 'Tipo de Anomalia',
        'property': 'anomaly',
        'default': 'N/A',
        formatter: (row) => {
          return String(row.anomaly)
        }
      },
      {
        'title': 'Fecha',
        'property': 'date',
        'default': 'N/A',
        formatter: (row) => {
          return String(row.date)
        }
      },
      {
        'title': 'Predicción',
        'property': 'prediction',
        'default': 0,
        'type': 'number',
        formatter: (row) => {
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
      },
      {
        'title': 'Seleccionar Todo',
        'abbreviate': true,
        'abbr': (() => {
          return (
            <Checkbox
              label='checkAll'
              handleCheckboxChange={(e) => this.checkAll(!this.state.selectAll)}
              key='checkAll'
              checked={this.state.selectAll}
              hideLabel />
          )
        })(),
        'property': 'checkbox',
        'default': '',
        formatter: (row) => {
          if (!row.selected) {
            row.selected = false
          }
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
    ]
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

   /*  var url = '/admin/rows/' + obj.uuid
    const res = await api.post(url, { ...obj })
 */
    this.setState({
      isRecovering: ' is-loading'
    })

    this.notify('Ajuste guardado!', 3000, toast.TYPE.INFO)

    return true
  }


  notify(message = '', timeout = 3000, type = toast.TYPE.INFO) {
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

  async recovery () {
    this.setState({
      isRecovering: ' is-loading'
    })
    var url = '/admin/datasets/' + this.props.project.activeDataset.uuid + '/set/conciliate'

    try {
      await api.post(url)
    } catch (e) {
      this.notify('Error ' + e.message, 3000, toast.TYPE.ERROR)
    }

    this.setState({
      isRecovering: '',
      isFiltered: false
    })
  }


  checkAll = (check) => {
    this.state.selected.clear()
    for (let item of this.state.anomalias) {
      if (check)
        this.state.selected.add(item)

      item.selected = check
    }
    this.setState({ selectAll: check })
  }

  toggleCheckbox = (item, all) => {
    if (this.state.selected.has(item) && !all) {
      this.state.selected.delete(item)
      item.selected = false
    }
    else {
      this.state.selected.add(item)
      item.selected = true
    }
  }

  componentDidMount () {
    this.getFilters()
  }

  render () {
    if (this.state.isFiltered ||
      this.state.filters.products.length === 0 ||
      this.state.filters.salesCenters.length === 0
    ) {
      return <Loader />
    }

    var schema = {
      type: 'object',
      title: '',
      properties: {
        salesCenters: {
          type: 'string',
          title: 'Centros de Venta',
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
        }
      }
    }

    const uiSchema = {
      salesCenters: { 'ui:widget': SelectWidget, 'ui:placeholder': 'Seleccione Centro de Venta' },
      products: { 'ui:widget': SelectWidget, 'ui:placeholder': 'Seleccione producto' },
      categories: { 'ui:widget': SelectWidget, 'ui:placeholder': 'Seleccione categoria' }
    }

    schema.properties.products.enum = this.state.filters.products.map(item => { return item.uuid })
    schema.properties.products.enumNames = this.state.filters.products.map(item => { return item.name })

    if (this.state.filters.categories.length > 0) {
      schema.properties.categories.enum = this.state.filters.categories
      schema.properties.categories.enumNames = this.state.filters.categories
    }
    schema.properties.salesCenters.enum = this.state.filters.salesCenters.map(item => { return item.uuid })
    schema.properties.salesCenters.enumNames = this.state.filters.salesCenters.map(item => { return item.name })

    return (
      <div className='section'>
        <div className='columns'>
          <div className='column is-half'>
            <BaseForm
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
          <div className='column has-text-right'>
            <div className='field is-grouped is-grouped-right'>
              <div className='control'>
                <button
                  className={'button is-info is-medium' + this.state.isRecovering}
                  disabled={!!this.state.isRecovering}
                  type='button'
                  onClick={e => this.recovery()}
                >
                  Recuperar ({this.state.selected.size})
                  </button>
              </div>
            </div>
          </div>

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
              <BaseTable
                data={this.state.anomalias}
                columns={this.getColumns()}
                sortAscending
                sortBy={'name'}
              />
            </div>
          }
        </section>
      </div>
    )
  }
}

export default TabAnomalias
