import React, { Component } from 'react'
import { FormattedMessage, injectIntl } from 'react-intl'
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
import { defaultCatalogs } from '~base/tools'

var currentRole

class TabAnomalies extends Component {
  constructor (props) {
    super(props)
    this.state = {
      isLoading: '',
      loaded: false,
      isFiltered: false,
      filters: {},
      formData: {},
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
          this.notify(this.formatTitle('anomalies.emptyAnomalies'), 5000, toast.TYPE.INFO)

      } catch (e) {
        this.setState({
          isLoading: '',
          isFiltered: false,
          loaded: true
        })

        this.notify('Error ' + e.message, 5000, toast.TYPE.ERROR)
      }
    })
  }

  async getFilters () {
    await this.getCatalogFilters()
    await this.getData()
  }


  findName = (name) => {
    let find = ''

    if (!this.rules) return find

    this.rules.catalogs.map(item => {
      if (item.slug === name) {
        find = item
      }
    })

    let title = find.name
    if (this.findInCatalogs(find.slug)) {
      title = this.formatTitle('catalogs.' + find.slug)
    }
    return title
  }

  formatTitle(id) {
    return this.props.intl.formatMessage({ id: id })
  }

  findInCatalogs(slug) {
    let find = false
    defaultCatalogs.map(item => {
      if (item.value === slug) {
        find = true
      }
    })
    return find
  }

  async getCatalogFilters() {
    let url = '/app/catalogItems/'
    let filters = []
    this.rules.catalogs.map(async item => {
        let res = await api.get(url + item.slug,{limit:0})
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
          <div key={key} className='column is-narrow' >
            <Select
              label={this.findName(key)}
              name={key}
              value={x.length > 1 ? this.state.formData[key] : "" }
              placeholder={x.length > 1 ? this.formatTitle('anomalies.all') : null}
              optionValue='uuid'
              optionName='name'
              options={x}
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
        let title = catalog.name
        if (this.findInCatalogs(catalog.slug)) {
          title = this.formatTitle('catalogs.' + catalog.slug)
        }

        return (
          {
            'title': ` ${title}`,
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
        'title': this.formatTitle('dashboard.selectAll'),
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
        'title': this.formatTitle('tables.colId'),
        'property': 'productId',
        'default': 'N/A',
        'sortable': true,
        formatter: (row) => {
          return String(row.newProduct.externalId)
        }
      },
      {
        'title': this.formatTitle('tables.colProduct'),
        'property': 'product.name',
        'default': 'N/A',
        'sortable': true,
        formatter: (row) => {
          return String(row.newProduct.name)
        }
      },
      ...catalogItems,
      {
        'title': this.formatTitle('anomalies.type'),
        'property': 'type',
        'default': 'N/A',
        'sortable': true,
        formatter: (row) => {
          return String(row.type)
        }
      },
      {
        'title': this.formatTitle('tables.colDate'),
        'property': 'date',
        'default': 'N/A',
        'sortable': true,
        formatter: (row) => {
          return moment.utc(row.date, 'YYYY-MM-DD').local().format('DD/MM/YYYY')
        }
      },
      {
        'title': this.formatTitle('tables.colForecast'),
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

    if (res.data) {
      obj.edited = true
      let index = this.state.anomalies.findIndex((item) => { return obj.uuid === item.uuid })
      let aux = this.state.anomalies

      aux.splice(index, 1, obj)

      this.setState({
        anomalies: aux
      })

      this.notify(this.formatTitle('anomalies.saved'), 5000, toast.TYPE.INFO)

    }
    else{
      this.notify(this.formatTitle('anomalies.try'), 5000, toast.TYPE.ERROR)
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
    console.log("tree.get('user')", tree.get('user'))
    let res = await api.post(url + this.props.project.uuid, {
      anomalies: Object.values(this.state.selected),
      rol: currentRole,
      userUuid: tree.get('user').uuid
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

    if (currentRole !== 'manager-level-1') {
      this.props.reload('configuracion')
    } else {
      window.location.reload(false)
    }
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

    return (
      <div>
        <div className='section level selects'>
          <div className='columns is-multiline is-mobile'>
            {this.state.filters &&
              this.makeFilters()
            }

            <div className='column is-narrow pad-top-5'>
              <div className='field'>
                <label className='label'>
                  <FormattedMessage
                    id="dashboard.searchText"
                    defaultMessage={`Búsqueda general`}
                  />
                </label>
                <div className='control has-icons-right'>
                  <input
                    className='input input-search'
                    type='text'
                    value={this.state.searchTerm}
                    onKeyUp={(e) => { this.searchOnChange(e) }} placeholder={this.formatTitle('dashboard.searchText')} />

                  <span className='icon is-small is-right'>
                    <i className='fa fa-search fa-xs'></i>
                  </span>
                </div>
              </div>
            </div>
            {currentRole !== 'consultor-level-3' && currentRole !== 'consultor-level-2' &&
              <div className='column is-narrow is-margin-top-20'>
                <button
                  className={'button is-info ' + this.state.isRestoring}
                  disabled={!!this.state.isRestoring || this.state.disableButton}
                  type='button'
                  onClick={e => this.restore()}
                >
                  <FormattedMessage
                    id="anomalies.recover"
                    defaultMessage={`Recuperar`}
                  /> ({Object.keys(this.state.selected).length})
                </button>
              </div>
            }
          </div>
        </div>

        <section>
          {!this.state.isFiltered ?
            <section className='section'>
              <center>
                <Loader/>
                <h2 className='has-text-info'>
                  <FormattedMessage
                    id="anomalies.loadingAnomalies"
                    defaultMessage={`Cargando anomalías`}
                  />
                </h2>
              </center>
            </section>
          :
            this.state.anomalies.length === 0
              ? <section className='section'>
                  <center>
                  <h2 className='subtitle has-text-primary'>
                    <FormattedMessage
                      id="anomalies.emptyAnomalies"
                      defaultMessage={`No hay anomalías que mostrar`}
                    />
                  </h2>
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

export default injectIntl(TabAnomalies)
