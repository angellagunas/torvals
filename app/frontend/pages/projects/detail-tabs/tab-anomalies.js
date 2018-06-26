import React, { Component } from 'react'
import moment from 'moment'
import api from '~base/api'
import Loader from '~base/components/spinner'
import {
  BaseForm,
  SelectWidget
} from '~base/components/base-form'
import { Pagination } from '~base/components/base-pagination'
import { BaseTable } from '~base/components/base-table'
import Checkbox from '~base/components/base-checkbox'
import Editable from '~base/components/base-editable'
import { toast } from 'react-toastify'
import Select from './select'

var currentRole

class TabAnomalies extends Component {
  constructor (props) {
    super(props)
    this.state = {
      isLoading: '',
      loaded: false,
      isFiltered: false,
      filters: {
        products: [],
        salesCenters: [],
        categories: []
      },
      formData: {
      },
      anomalies: [],
      requestId: 0,
      selectAll: false,
      selected: {},
      disableButton: true,
      sortAscending: true,
      pageLength: 20,
      page: 1,
      search: ''
    }
    currentRole = tree.get('user').currentRole.slug
    this.rules = this.props.rules

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

  async filterChangeHandler(name, value) {
    let aux = this.state.formData
    aux[name] = value
    this.setState({
      formData: aux
    }, () => {
      this.getData()
    })
  }

  async filterErrorHandler (e) {
    this.setState({
      isLoading: ''
    })
  }

  async getData (start = 0, limit = this.state.pageLength) {
   if(this.state.requestId === 1000){
      var request = 0
   }else{
      var request = this.state.requestId
   }
   this.setState({
      isLoading: ' is-loading',
      anomalies: [],
      requestId: request + 1 ,
      isFiltered: false
    }, async () => {
      let url = '/app/anomalies/list/' + this.props.project.uuid
      try {
        let res = await api.get(url, {
          ...this.state.formData,
          start: start,
          limit: limit,
          general: this.state.search,
          requestId: this.state.requestId
        })
        if(parseInt(res.requestId) === parseInt(this.state.requestId)){
          this.setState({
            totalAnomalies: res.total,
            anomalies: res.data,
            isLoading: '',
            isFiltered: true,
            loaded: true
          })
        }

        if(res.data.length === 0)
          this.notify('No hay anomalías que mostrar', 5000, toast.TYPE.INFO)

      } catch (e) {
        this.setState({
          isLoading: '',
          isFiltered: false,
          loaded: true
        })
        this.notify('Error:Intente de nuevo', 5000, toast.TYPE.ERROR)
      }
    })
  }

  async getFilters () {
    await this.getCatalogFilters()
    await this.getSalesCent()
    await this.getProducts()
    await this.getData()
  }


  findName = (name) => {
    let find = ''

    if (!this.rules) return find

    this.rules.catalogs.map(item => {
      if (item.slug === name) {
        find = item.name
      }
    })
    return find
  }

  async getCatalogFilters() {
    let url = '/app/catalogItems/'
    let filters = []
    this.rules.catalogs.map(async item => {
        let res = await api.get(url + item.slug)
        if (res) {
          let aux = this.state.filters
          aux[item.slug] = res.data

          this.setState({
            filters: aux
          })
        }
    })
  }

  makeFilters() {
    let filters = []
    for (const key in this.state.filters) {
      if (this.state.filters.hasOwnProperty(key)) {
        const element = this.state.filters[key];
        if (key === 'cycles' ||
          key === 'channels' ||
          key === 'salesCenters' ||
          key === 'categories' ||
          key === 'products' ||
          key === 'precio' ) {
          continue
        }
        filters.push(
          <div key={key} className='level-item' >
            <Select
              label={this.findName(key)}
              name={key}
              value={this.state.formData[key]}
              placeholder='Todas'
              optionValue='uuid'
              optionName='name'
              options={element}
              onChange={(name, value) => { this.filterChangeHandler(name, value) }}
            />
          </div >
        )
      }
    }
    return filters
  }

  getColumns () {
    const catalogs = this.props.project.rule.catalogs || []
    const catalogItems = catalogs.map((catalog, i) => {
      if(catalog.slug !== 'producto'){
        return (
          {
            'title': ` ${catalog.name}`,
            'property': '',
            'default': 'N/A',
            'sortable': true,
            formatter: (row) => {
              return  row.catalogItems.map(item => {
                if(catalog.slug === item.type){
                  return item.name
                }
              })
            }
          }
        )
      }
    }
  ).filter(item => item)

    let cols = [
      {
        'title': 'Seleccionar Todo',
        'abbreviate': true,
        'abbr': (() => {
          if (currentRole !== 'consultor-level-3' && currentRole !== 'consultor-level-2') {
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
          if (currentRole !== 'consultor-level-3' && currentRole !== 'consultor-level-2') {
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
      ...catalogItems,
      {
        'title': 'Tipo de Anomalía',
        'property': 'type',
        'default': 'N/A',
        'sortable': true,
        formatter: (row) => {
          return String(row.type)
        }
      },
      {
        'title': 'Fecha',
        'property': 'date',
        'default': 'N/A',
        'sortable': true,
        formatter: (row) => {
          return moment.utc(row.date, 'YYYY-MM-DD').local().format('DD/MM/YYYY')
        }
      },
      {
        'title': 'Predicción',
        'property': 'prediction',
        'default': 0,
        'type': 'number',
        'sortable': true,
        'className': 'editable-cell',
        formatter: (row) => {
          if (currentRole !== 'consultor-level-3' && currentRole !== 'consultor-level-2') {
          return (
            <Editable
              value={row.prediction}
              handleChange={this.changeAdjustment}
              type='text'
              obj={row}
              width={100}
            />
          )
          }
          else{
            return row.prediction
          }
        }
      }
    ]

    return cols
  }

  changeAdjustment = async (value, row) => {
    if (Number(row.prediction) !== Number(value)) {
      row.prediction = value
      const res = await this.handleChange(row)
      if (!res) {
        return false
      }
      return res
    }
    else return false
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

      this.notify('¡Ajuste guardado!', 5000, toast.TYPE.INFO)

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
      anomalies: Object.values(this.state.selected)
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
      this.setState({
        isRestoring: '',
        selected: {}
      })
    }

    this.props.reload('configuracion')
  }



  checkAll = (check) => {
    let selected = {}
    for (let item of this.state.anomalies) {
      if (check)
        selected[item.uuid] = item

      item.selected = check
    }
    this.setState({ selectAll: check, selected },
    () => {
      this.toggleButtons()
    })
  }

  toggleCheckbox = (item) => {
    let selected = this.state.selected

    if (selected[item.uuid]) {
      delete selected[item.uuid]
      item.selected = false
    }
    else {
      selected[item.uuid] = item
      item.selected = true
    }

    this.setState({
      selected,
      selectAll: Object.keys(this.state.selected).length === this.state.anomalies.length
    },
    () => {
      this.toggleButtons()
    })
  }

  componentDidMount () {
    this.getFilters()
  }

  toggleButtons() {
    let disable = true

    if (Object.keys(this.state.selected).length > 0)
      disable = false
    else if (Object.keys(this.state.selected).length <= 0) {
      this.setState({
        selectAll: false
      })
    }
    this.setState({
      disableButton: disable
    })
  }

  async searchOnChange(e){
    let value = e.target.value

    this.setState({
      search: value,
      page: 1,
      selected: {},
      selectAll: false
    })

    if (e.keyCode === 13 || e.which === 13 || value === ''){
      this.toggleButtons()
      this.getData()
    }

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

  async loadMore(page) {
    const start = (page - 1) * this.state.pageLength
    const limit = this.state.pageLength

    await this.getData(start, limit)
    this.setState({
      page: page,
      selected: {},
      selectAll: false
    },
      () => {
        this.toggleButtons()
      })

  }

  render () {
    if (!this.state.loaded) {
      return <Loader />
    }

    if (this.state.filters.products.length === 0 ||
      this.state.filters.salesCenters.length === 0
    ) {
      return (
        <section className='section'>
          <center>
            <h2 className='has-text-info'>No hay anomalías que mostrar</h2>
          </center>
        </section>
      )
    }

    return (
      <div>
        <div className='section level selects'>
          <div className='level-left'>
            {this.state.filters &&
              this.makeFilters()
            }

            <div className='level-item pad-top-5'>
              <div className='field'>
                <label className='label'>Búsqueda general</label>
                <div className='control has-icons-right'>
                  <input
                    className='input input-search'
                    type='text'
                    value={this.state.searchTerm}
                    onKeyUp={(e) => { this.searchOnChange(e) }} placeholder='Buscar'/>

                  <span className='icon is-small is-right'>
                    <i className='fa fa-search fa-xs'></i>
                  </span>
                </div>
              </div>
            </div>
          </div>
          {currentRole !== 'consultor-level-3' && currentRole !== 'consultor-level-2' &&
            <div className='level-right'>
              <div className='level-item is-margin-top-20'>
                <button
                  className={'button is-info ' + this.state.isRestoring}
                  disabled={!!this.state.isRestoring || this.state.disableButton}
                  type='button'
                  onClick={e => this.restore()}
                >
                  Recuperar ({Object.keys(this.state.selected).length})
                  </button>
              </div>
            </div>
          }
        </div>

        <section>
          {!this.state.isFiltered ?
            <section className='section'>
              <center>
                <Loader/>
                <h2 className='has-text-info'>Cargando anomalías</h2>
              </center>
            </section>
          :
            this.state.anomalies.length === 0
              ? <section className='section'>
                  <center>
                    <h2 className='has-text-info'>No hay anomalías que mostrar</h2>
                  </center>
                </section>
              :
              <div>
              <BaseTable
                className='aprobe-table is-fullwidth is-margin-top-20'
                data={this.state.anomalies}
                columns={this.getColumns()}
                sortAscending={this.state.sortAscending}
                sortBy={this.state.sortBy}
                handleSort={(e) => this.handleSort(e)}
              />
                <div className='is-margin-top-20'>
                <Pagination
                  loadPage={(page) => this.loadMore(page)}
                  page={this.state.page}
                  totalItems={this.state.totalAnomalies}
                  pageLength={this.state.pageLength}
              />
                </div>

              </div>
          }
        </section>
      </div>
    )
  }
}

export default TabAnomalies
