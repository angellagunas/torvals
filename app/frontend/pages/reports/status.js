import React, { Component } from 'react'
import moment from 'moment'
import _ from 'lodash'
import { toast } from 'react-toastify'
import tree from '~core/tree'
import Select from '../projects/detail-tabs/select'
import api from '~base/api'
import Loader from '~base/components/spinner'
import Page from '~base/page'
import { loggedIn } from '~base/middlewares/'
import { BaseTable } from '~base/components/base-table'
import Link from '~base/router/link'

class StatusRepórt extends Component {
  constructor (props) {
    super(props)
    this.state = {
      dataRows: [],
      isFiltered: false,
      filtersLoaded: false,
      filtersLoading: false,
      isLoading: '',
      filters: {
        channels: [],
        products: [],
        salesCenters: [],
        categories: [],
        cycles: []
      },
      formData: {
        cycle: 1
      },
      searchTerm: '',
      error: false,
      errorMessage: '',
      timeRemaining:{
        days: '',
        hours: '',
        minutes: ''
      }
    }

    this.currentRole = tree.get('user').currentRole.slug
    this.rules = tree.get('rule')
  }

  componentWillMount () {
    this.getProjects()
  }

  componentWillUnmount(){
    clearInterval(this.interval)
  }

  async getProjects() {
    let url = '/app/projects'

    let res = await api.get(url, {
      showOnDashboard: true
    })

    let activeProjects = res.data.filter(item => { return item.mainDataset })
    activeProjects[0].selected = true

    this.setState({
      projects: activeProjects,
      projectSelected: activeProjects[0],
      loading: false
    }, () => {
      this.getFilters()
    })
  }

  async getCatalogFilters() {
    let url = '/app/catalogItems/'
    let filters = []
    this.rules.catalogs.map(async item => {
      if (item.slug !== 'producto') {
        let res = await api.get(url + item.slug)
        if (res) {
          let aux = this.state.filters
          aux[item.slug] = res.data

          this.setState({
            filters: aux
          })
        }
      }
    })
  }

  async getFilters () {
    this.setState({ filtersLoading: true })

    const url = '/app/rows/filters/dataset/'

    await this.getCatalogFilters()

    try {
      let res = await api.get(url + this.state.projectSelected.mainDataset.uuid)

      let cycles = _.orderBy(res.cycles, 'cycle', 'asc')

      if (this.currentRole === 'manager-level-2') {
        cycles = cycles.map((item, key) => {
          return { ...item, adjustmentRange: this.rules.rangesLvl2[key], name: moment.utc(item.dateStart).format('MMMM') }
        })
      } else {
        cycles = cycles.map((item, key) => {
          return { ...item, adjustmentRange: this.rules.ranges[key], name: moment.utc(item.dateStart).format('MMMM') }
        })
      }

      cycles = cycles.map(item => {
          if (moment.utc(item.dateEnd).isAfter(moment.utc().startOf('month'), 'days')) {
            return item
          }
      }).filter(item => item)

      let formData = this.state.formData
      formData.cycle = cycles[0].cycle

      this.interval = setInterval(() => {
        this.getTimeRemaining()
      }, 60000)

      if (res.salesCenters.length > 0) {
        formData.salesCenter = res.salesCenters[0].uuid
      }

      if (res.channels.length === 1) {
        formData.channel = res.channels[0].uuid
      }
      this.setState({
        filters: {
          ...this.state.filters,
          channels: _.orderBy(res.channels, 'name'),
          products: res.products,
          salesCenters: _.orderBy(res.salesCenters, 'name'),
          categories: this.getCategory(res.products),
          cycles: cycles
        },
        formData: formData,
        filtersLoading: false,
        filtersLoaded: true
      }, () => {
        this.getDataRows()
      })
    } catch (e) {
      console.log(e)
      this.setState({
        error: true,
        filtersLoading: false,
        errorMessage: '¡No se pudieron cargar los filtros!'
      })

      this.notify(
          'Ha habido un error al obtener los filtros! ' + e.message,
          5000,
          toast.TYPE.ERROR
        )
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

  async filterChangeHandler(name, value) {
    if (name === 'project') {
      let project = this.state.projects.find(item => {
        return item.uuid === value
      })

      this.setState({
        projectSelected: project
      }, () => {
        this.getDataRows()
      })
    }
    else {
      let aux = this.state.formData
      aux[name] = value
      this.setState({
        formData: aux
      }, () => {
        this.getDataRows()
      })
    }
  }

  notify(message = '', timeout = 5000, type = toast.TYPE.INFO) {
    let className = ''
    if (type === toast.TYPE.WARNING) {
      className = 'has-bg-warning'
    }
    if (!toast.isActive(this.toastId)) {
      this.toastId = toast(message, {
        autoClose: timeout,
        type: type,
        hideProgressBar: true,
        closeButton: false,
        className: className
      })
    } else {
      toast.update(this.toastId, {
        render: message,
        type: type,
        autoClose: timeout,
        closeButton: false,
        className: className
      })
    }
  }


  async getDataRows() {
     if (!this.state.formData.cycle) {
      this.notify('¡Se debe filtrar por ciclo!', 5000, toast.TYPE.ERROR)
      return
    }

      this.getTimeRemaining()

    var cycle = this.state.filters.cycles.find(item => {
      return item.cycle === this.state.formData.cycle
    })

    this.setState({
      isLoading: ' is-loading',
      isFiltered: false,
      salesTable: [],
      noSalesData: ''
    })

    const url = '/app/rows/dataset/'
    try {
      let data = await api.get(
        url + this.state.projectSelected.mainDataset.uuid,
        {
          ...this.state.formData,
          cycle: cycle.uuid
        }
      )
      this.setState({
        dataRows: data.data,
        isFiltered: true,
        isLoading: '',
        selectedCheckboxes: new Set()
      })
      this.clearSearch()
    } catch (e) {
      console.log(e)
      this.setState({
        dataRows: [],
        isFiltered: true,
        isLoading: '',
        selectedCheckboxes: new Set()
      })
    } 
  }

  getColumns() {
    let cols = [
      {
        'title': 'Usuario',
        'property': 'productName',
        'default': 'N/A',
        'sortable': true
      },
      {
        'title': 'Centro de venta',
        'property': 'salesCenter',
        'default': '0',
        'sortable': true
      },
      {
        'title': 'Ajustes por periodo',
        'property': 'adjustment',
        'default': '0',
        'sortable': true,
        formatter: (row) => {
          if (row.adjustment) {
            return row.adjustment.toFixed().replace(/./g, (c, i, a) => {
              return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
            })
          }
        }
      },
      {
        'title': 'Aprobados',
        'property': 'adjustment',
        'default': '0',
        'sortable': true,
        formatter: (row) => {
          if (row.adjustment) {
            return row.adjustment.toFixed().replace(/./g, (c, i, a) => {
              return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
            })
          }
        }
      },
      {
        'title': 'Rechazados',
        'property': 'adjustment',
        'default': '0',
        'sortable': true,
        formatter: (row) => {
          if (row.adjustment) {
            return row.adjustment.toFixed().replace(/./g, (c, i, a) => {
              return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
            })
          }
        }
      },
      {
        'title': 'Pendientes',
        'property': 'adjustment',
        'default': '0',
        'sortable': true,
        formatter: (row) => {
          if (row.adjustment) {
            return row.adjustment.toFixed().replace(/./g, (c, i, a) => {
              return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
            })
          }
        }
      },
      {
        'title': 'Acciones',
        formatter: (row) => {
            return (
              <Link className='button is-primary' to={'/projects/' + row.uuid}>
                <span className='icon is-small' title='Visualizar'>
                  <i className='fa fa-eye' />
                </span>
              </Link>
            )
        }
      }
    ]

    return cols
  }

  handleSort(e) {
    let sorted = this.state.dataRows

    if (e === 'product.externalId') {
      if (this.state.sortAscending) {
        sorted.sort((a, b) => { return parseFloat(a.product.externalId) - parseFloat(b.product.externalId) })
      } else {
        sorted.sort((a, b) => { return parseFloat(b.product.externalId) - parseFloat(a.product.externalId) })
      }
    } else {
      if (this.state.sortAscending) {
        sorted = _.orderBy(sorted, [e], ['asc'])
      } else {
        sorted = _.orderBy(sorted, [e], ['desc'])
      }
    }

    this.setState({
      dataRows: sorted,
      sortAscending: !this.state.sortAscending,
      sortBy: e
    }, () => {
      this.searchDatarows()
    })

  }

  async searchDatarows() {
    if (this.state.searchTerm === '') {
      this.setState({
        filteredData: this.state.dataRows
      })
      return
    }

    const items = this.state.dataRows.filter((item) => {
      const regEx = new RegExp(this.state.searchTerm, 'gi')
      const searchStr = `${item.productName} ${item.salesCenter}`

      if (regEx.test(searchStr))
        return true

      return false
    })

    await this.setState({
      filteredData: items
    })
  }

  searchOnChange = (e) => {
    this.setState({
      searchTerm: e.target.value
    }, () => this.searchDatarows())
  }

  clearSearch (){
    this.setState({
      searchTerm: ''
    }, () => this.searchDatarows())
  }

  loadTable() {
    if (this.state.noSalesData === '') {
      return (
        <div className='is-fullwidth has-text-centered subtitle has-text-primary'>
          Cargando, un momento por favor
          <Loader />
        </div>
      )
    }
    else {
      return (
        <div className='is-fullwidth has-text-centered subtitle has-text-primary'>
          {this.state.noSalesData}
        </div>
      )
    }
  }

  getCycleName() {
    let cycle = this.state.filters.cycles.find(item => {
      return item.cycle === this.state.formData.cycle
    })
    return moment.utc(cycle.dateStart).format('MMMM')
  }

  findName = (name) => {
    let find = ''
    this.rules.catalogs.map(item => {
      if (item.slug === name) {
        find = item.name
      }
    })
    return find
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
          key === 'products') {
          continue
        }
        filters.push(
          <div key={key} className='level-item'>
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
          </div>
        )
      }
    }
    return filters
  }

  getTimeRemaining(){
    let cycle = this.state.filters.cycles.find(item => {
      return item.cycle === this.state.formData.cycle
    })
    let now = moment.utc()
    let then = moment.utc(cycle.dateEnd);
    let diff = moment.duration(then.diff(now));
    let days = parseInt(diff.asDays());

    let hours = parseInt(diff.asHours());

    hours = hours - days * 24;

    let minutes = parseInt(diff.asMinutes()); 

    minutes = minutes - (days * 24 * 60 + hours * 60);

    this.setState({
      timeRemaining: {
        days,
        hours,
        minutes
      }
    })
  }

  render () {
    return (
      <div className='status-report'>
        <div className='section-header'>
          <h2>Status de proyecto </h2>
        </div>
        <div className='section level selects'>
          <div className='level-left'>
            {this.state.projectSelected && this.state.projects &&
            <div className='level-item'>
              <Select
                label='Proyecto'
                name='project'
                value={this.state.projectSelected.uuid}
                optionValue='uuid'
                optionName='name'
                options={this.state.projects}
                onChange={(name, value) => { this.filterChangeHandler(name, value) }}
              />
            </div>
            }
            <div className='level-item'>
              <Select
                label='Ciclo'
                name='cycle'
                value={this.state.formData.cycle}
                optionValue='cycle'
                optionName='name'
                type='integer'
                options={this.state.filters.cycles}
                onChange={(name, value) => { this.filterChangeHandler(name, value) }}
              />
            </div>
            <div className='level-item'>
              <Select
                label='Categoría'
                name='category'
                value=''
                placeholder='Todas'
                options={this.state.filters.categories}
                onChange={(name, value) => { this.filterChangeHandler(name, value) }}
              />
            </div>

            <div className='level-item'>
              {this.state.filters.channels.length === 1 ?
                <div className='channel'>
                  <span>Canal: </span>
                  <span className='has-text-weight-bold is-capitalized'>{this.state.filters.channels[0].name}
                  </span>
                </div>
                :
                <Select
                  label='Canal'
                  name='channel'
                  value=''
                  placeholder='Todos'
                  optionValue='uuid'
                  optionName='name'
                  options={this.state.filters.channels}
                  onChange={(name, value) => { this.filterChangeHandler(name, value) }}
                />
              }
            </div>

            <div className='level-item'>
              {this.state.filters.salesCenters.length === 1 ?
                <div className='saleCenter'>
                  <span>Centro de Venta: </span>
                  <span className='has-text-weight-bold is-capitalized'>{this.state.filters.salesCenters[0].name}
                  </span>
                </div>
                :
                <Select
                  label='Centro de Venta'
                  name='salesCenter'
                  value={this.state.formData.salesCenter}
                  optionValue='uuid'
                  optionName='name'
                  options={this.state.filters.salesCenters}
                  onChange={(name, value) => { this.filterChangeHandler(name, value) }}
                />
              }
            </div>
            {this.state.filters &&
              this.makeFilters()
            }
          </div>
        </div>
        <div className='section columns is-padingless-top'>
          <div className='column is-3'>
            <div className='notification is-success'>
              <div className='level'>
                <div className='level-item'>
                  <span className='icon is-large'>
                    <i className='fa fa-2x fa-check'></i>
                  </span>
                </div>
                <div className='level-item'>
                  <p><strong>5 Usuarios</strong></p>
                  <p>Ajustes finalizados</p>
              </div>
              </div>
            </div>
          </div>
          <div className='column is-3'>
            <div className='notification is-info'>
              <div className='level'>
                <div className='level-item'>
                  <span className='icon is-large'>
                    <i className='fa fa-2x fa-cog'></i>
                  </span>
                </div>
                <div className='level-item'>
                  <p><strong>5 Usuarios</strong></p>
                  <p>Ajustes en proceso</p>
                </div>
              </div>
            </div>
          </div>
          <div className='column is-3'>
            <div className='notification is-danger'>
              <div className='level'>
                <div className='level-left'>
                <div className='level-item'>
                  <span className='icon is-large'>
                    <i className='fa fa-2x fa-exclamation-circle'></i>
                  </span>
                </div>
                <div className='level-item'>
                  <p><strong>5 Usuarios</strong></p>
                  <p>Sin ajustes</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className='column is-narrow'>
            <div className='time has-text-centered'>
              <p className='desc'>Tiempo restante para ajustar</p>
              <div className='level'>
                <div className='level-item'>
                  <p className='num'>{this.state.timeRemaining.days}</p> 
                  <p className='desc'>Días</p>
                </div>
                <div className='level-item'>
                  <p className='num'>{this.state.timeRemaining.hours}</p>
                  <p className='desc'>Horas</p>
                </div>
                <div className='level-item'>
                  <p className='num'>:</p>
                  <p className='desc'>&nbsp;</p>
                </div>
                <div className='level-item'>
                  <p className='num'>{this.state.timeRemaining.minutes}</p>
                  <p className='desc'>Min.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className='section search-section'>
        <div className='level'>
          <div className='level-left'>
            <div className='level-item'>

              <div className='field'>
                <label className='label'>Búsqueda general</label>
                <div className='control has-icons-right'>
                  <input
                    className='input'
                    type='text'
                    value={this.state.searchTerm}
                    onChange={this.searchOnChange} placeholder='Buscar' />

                  <span className='icon is-small is-right'>
                    <i className='fa fa-search fa-xs' />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {this.state.filteredData
          ? this.state.filteredData.length > 0
            ? <div className='scroll-table'>
              <div className='scroll-table-container'>

                <BaseTable
                  className='dash-table is-fullwidth'
                  data={this.state.filteredData}
                  columns={this.getColumns()}
                  handleSort={(e) => { this.handleSort(e) }}
                  sortAscending={this.state.sortAscending}
                  sortBy={this.state.sortBy}
                />
              </div>
            </div>
            : <section className='section'>
              <center>
                <h1 className='has-text-info'>No hay productos que mostrar, intente con otro filtro</h1>
              </center>
            </section>
          : <section className='section'>
            {this.loadTable()}
          </section>
        }
      </div>
      </div>
    )
  }
}

export default Page({
  path: '/reports/status',
  exact: true,
  validate: loggedIn,
  component: StatusRepórt,
  title: 'Status de proyecto',
  icon: 'user',
  roles: 'consultor-level-3, analyst, orgadmin, admin, consultor-level-2, manager-level-2, manager-level-3'  
})