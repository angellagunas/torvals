import React, { Component } from 'react'
import { FormattedMessage, injectIntl } from 'react-intl'
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
import classNames from 'classnames'
import { defaultCatalogs } from '~base/tools'

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
        cycles: [],
        users: []
      },
      formData: {
        cycle: 1,
        user: undefined
      },
      searchTerm: '',
      error: false,
      errorMessage: '',
      timeRemaining:{
        days: '',
        hours: '',
        minutes: ''
      },
      users: {
        finishedUsers: [],
        inProgressUsers: [],
        inactiveUsers: []
      },
      filterReady: false,
      filterProgress: false,
      filterInactive: false,
    }

    this.currentRole = tree.get('user').currentRole.slug
    this.rules = tree.get('rule')
  }

  formatTitle(id) {
    return this.props.intl.formatMessage({ id: id })
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

    const url = '/app/reports/filters/' + this.state.projectSelected.uuid

    await this.getCatalogFilters()

    try {
      let res = await api.get(url)

      let cycles = _.orderBy(res.cycles, 'dateStart', 'asc')
      .map(item => {
        return {
          ...item, 
          name: moment.utc(item.dateStart).format('MMMM D') + ' - ' + moment.utc(item.dateEnd).format('MMMM D')
        }
      })      

      cycles = _.orderBy(cycles, 'dateStart', 'asc')

      let formData = this.state.formData
      formData.cycle = cycles[0].cycle

      this.interval = setInterval(() => {
        this.getTimeRemaining()
      }, 60000)


      this.setState({
        filters: {
          ...this.state.filters,
          cycles: cycles,
          users: res.users
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
        filters: {
          cycles: [],
          users: []
        },
        error: true,
        filtersLoading: false,
        errorMessage: this.formatTitle('adjustments.noFilters')
      })

      this.notify(
        this.formatTitle('adjustments.noFilters') + ' ' + e.message,
        5000,
        toast.TYPE.ERROR
      )
    }
  }


  async filterChangeHandler(name, value) {
    if (name === 'project') {
      let project = this.state.projects.find(item => {
        return item.uuid === value
      })

      this.setState({
        projectSelected: project
      }, () => {
        this.getFilters()
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

  async getUsers(){

    var cycle = this.state.filters.cycles.find(item => {
      return item.cycle === this.state.formData.cycle
    })

    const url = '/app/reports/user'
    try {

      let res = await api.post(
        url,
        {
          users: this.state.formData.user ? [this.state.formData.user] : undefined,
          cycles: [cycle.uuid],
          projects: [this.state.projectSelected.uuid]
        }
      )
      this.setState({
        users: res.data
      })
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

  async getDataRows() {
     if (!this.state.formData.cycle) {
      this.notify('¡Se debe filtrar por ciclo!', 5000, toast.TYPE.ERROR)
      return
    }

    this.getTimeRemaining()

    await this.getUsers()

    var cycle = this.state.filters.cycles.find(item => {
      return item.cycle === this.state.formData.cycle
    })

    this.setState({
      isLoading: ' is-loading',
      isFiltered: false,
      salesTable: [],
      noSalesData: ''
    })

    const url = '/app/reports/adjustments'
    try {
      let catalogItems = []
      for (const key in this.state.formData) {
        if (this.state.formData.hasOwnProperty(key)) {
          const element = this.state.formData[key];
          if(key !== 'cycle' && key !== 'user'){
            catalogItems.push(element)
          }
        }
      }

      catalogItems = catalogItems.filter(item => item)

      let users = this.state.formData.user ? [this.state.formData.user] : undefined
      if(this.state.filterReady){
        users = this.state.users.finishedUsers
      }
      else if (this.state.filterProgress) {
        users = this.state.users.inProgressUsers
      }
      else if (this.state.filterInactive) {
        users = this.state.users.inactiveUsers
      }


      let data = await api.post(
        url,
        {
          users: users && users.length > 0 ? users : undefined,
          catalogItems: catalogItems.length > 0 ? catalogItems : undefined,
          cycles: [cycle.uuid],
          projects: [this.state.projectSelected.uuid]
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
        'title': this.formatTitle('tables.colUser'),
        'property': 'user.name',
        'default': 'N/A',
        'sortable': true,
        formatter: (row) => {
          return row.user[0].name
        }
      },
      {
        'title': this.formatTitle('tables.colAdjustmentsByPeriod'),
        'property': 'total',
        'default': '0',
        'sortable': true
      },
      {
        'title': this.formatTitle('approve.approved'),
        'property': 'approved',
        'default': '0',
        'sortable': true
      },
      {
        'title': this.formatTitle('approve.rejected'),
        'property': 'rejected',
        'default': '0',
        'sortable': true
      },
      {
        'title': this.formatTitle('approve.pending'),
        'property': 'created',
        'default': '0',
        'sortable': true
      },
      {
        'title': this.formatTitle('tables.colActions'),
        formatter: (row) => {
            return (
              <a className='button is-primary' onClick={() => this.userDetail(row.user[0])}>
                <span className='icon is-small' title='Visualizar'>
                  <i className='fa fa-eye' />
                </span>
              </a>
            )
        }
      }
    ]

    return cols
  }


  userDetail(user){
    tree.set('userDetail', user)
    tree.commit()
    this.props.history.push('/manage/users-groups')
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
          <FormattedMessage
            id="report.loadingMsg"
            defaultMessage={`Cargando, un momento por favor`}
          />
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
        find = item
      }
    })
    let title = find.name
    if (this.findInCatalogs(find.slug)) {
      title = this.formatTitle('catalogs.' + find.slug)
    }
    return title
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
          key === 'producto' ||
          key === 'precio' ||
          key === 'users') {
          continue
        }
        filters.push(
          <div key={key} className='level-item'>
            <Select
              label={this.findName(key)}
              name={key}
              value={this.state.formData[key]}
              placeholder={this.formatTitle('anomalies.all')}
              optionValue='uuid'
              optionName='name'
              options={element}
              onChange={(name, value) => { this.filterChangeHandler(name, value) }}
              disabled={this.state.filtersLoading}
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


  filterUsers(type){
    if(type === 1){
      this.setState({
        filterReady: !this.state.filterReady,
        filterProgress: false,
        filterInactive: false
      }, () => {
        this.getDataRows()
      })
    }
    else if (type === 2) {
      this.setState({
        filterReady: false,
        filterProgress: !this.state.filterProgress,
        filterInactive: false
      }, () => {
        this.getDataRows()
      })
    }
    else if (type === 3) {
      this.setState({
        filterReady: false,
        filterProgress: false,
        filterInactive: !this.state.filterInactive
      }, () => {
        this.getDataRows()
      })
    }
  }

  render () {
    return (
      <div className='status-report'>
        <div className='section-header'>
          <h2>
            <FormattedMessage
              id="report.statusTitle"
              defaultMessage={`Estado de proyecto`}
            />
          </h2>
        </div>
        <div className='section level selects'>
          <div className='level-left'>
            {this.state.projectSelected && this.state.projects &&
            <div className='level-item'>
              <Select
                label={this.formatTitle('projectConfig.project')}
                name='project'
                value={this.state.projectSelected.uuid}
                optionValue='uuid'
                optionName='name'
                options={this.state.projects}
                onChange={(name, value) => { this.filterChangeHandler(name, value) }}
              />
            </div>
            }
            {this.state.filters.cycles.length > 0 &&
            <div className='level-item'>
              <Select
                label={this.formatTitle('adjustments.cycle')}
                name='cycle'
                value={this.state.formData.cycle}
                optionValue='cycle'
                optionName='name'
                type='integer'
                options={this.state.filters.cycles}
                onChange={(name, value) => { this.filterChangeHandler(name, value) }}
                disabled={this.state.filtersLoading}
              />
            </div>
            }
            {this.state.filters.users.length > 0 &&
            <div className='level-item'>
              <Select
                label={this.formatTitle('import.users')}
                name='user'
                value={this.state.formData.user}
                optionValue='uuid'
                optionName='name'
                placeholder={this.formatTitle('anomalies.all')}
                options={this.state.filters.users}
                onChange={(name, value) => { this.filterChangeHandler(name, value) }}
                disabled={this.state.filtersLoading}
              />
            </div>
            }


            {this.state.filters &&
              this.makeFilters()
            }
          </div>
        </div>
        <div className='section columns is-padingless-top'>
          <div className='column is-3'>
            <div className={
              classNames('notification is-success filter-widget',
                { 'filter-widget__active': this.state.filterReady })
              }
              onClick={() => { this.filterUsers(1) }}>
              <div className='level'>
                <div className='level-left'>
                  <div className='level-item'>
                    <span className='icon is-large'>
                      <i className='fa fa-2x fa-check'></i>
                    </span>
                  </div>
                  <div className='level-item'>
                    <p><strong>{this.state.users.finishedUsers.length} Usuarios</strong></p>
                    <p>
                      <FormattedMessage
                        id="report.adjustmentFinished"
                        defaultMessage={`Ajustes finalizados`}
                      />
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className='column is-3'>
            <div className={
              classNames('notification is-info filter-widget',
                { 'filter-widget__active': this.state.filterProgress })
              }
              onClick={() => { this.filterUsers(2) }}>
              <div className='level'>
                <div className='level-left'>
                  <div className='level-item'>
                    <span className='icon is-large'>
                      <i className='fa fa-2x fa-cog'></i>
                    </span>
                  </div>
                  <div className='level-item'>
                    <p><strong>{this.state.users.inProgressUsers.length} Usuarios</strong></p>
                    <p>
                      <FormattedMessage
                        id="report.adjustmentInProcess"
                        defaultMessage={`Ajustes en proceso`}
                      />
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className='column is-3'>
            <div className={
              classNames('notification is-danger filter-widget',
                { 'filter-widget__active': this.state.filterInactive })
              }
              onClick={() => { this.filterUsers(3) }}>
              <div className='level'>
                <div className='level-left'>
                  <div className='level-item'>
                    <span className='icon is-large'>
                      <i className='fa fa-2x fa-exclamation-circle'></i>
                    </span>
                  </div>
                  <div className='level-item'>
                    <p><strong>{this.state.users.inactiveUsers.length} Usuarios</strong></p>
                    <p>
                      <FormattedMessage
                        id="report.noAdjustment"
                        defaultMessage={`Sin ajustes`}
                      />
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className='column is-narrow'>
            <div className='time has-text-centered'>
              <p className='desc'>
                <FormattedMessage
                  id="report.adjustmentTimeLeft"
                  defaultMessage={`Tiempo restante para ajustar`}
                />
              </p>
              <div className='level'>
                <div className='level-item'>
                  <p className='num'>{this.state.timeRemaining.days}</p>
                  <p className='desc'>
                    <FormattedMessage
                      id="report.days"
                      defaultMessage={`Días`}
                    />
                  </p>
                </div>
                <div className='level-item'>
                  <p className='num'>{this.state.timeRemaining.hours}</p>
                  <p className='desc'>
                    <FormattedMessage
                      id="report.hours"
                      defaultMessage={`Horas`}
                    />
                  </p>
                </div>
                <div className='level-item'>
                  <p className='num'>:</p>
                  <p className='desc'>&nbsp;</p>
                </div>
                <div className='level-item'>
                  <p className='num'>{this.state.timeRemaining.minutes}</p>
                  <p className='desc'>
                    <FormattedMessage
                      id="report.minutes"
                      defaultMessage={`Min.`}
                    />
                  </p>
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
                <label className='label'>
                  <FormattedMessage
                      id="dashboard.searchText"
                    defaultMessage={`Búsqueda general`}
                  />
                </label>
                <div className='control has-icons-right'>
                  <input
                    className='input'
                    type='text'
                    value={this.state.searchTerm}
                    onChange={this.searchOnChange}
                    placeholder={this.formatTitle('dashboard.searchText')}
                  />

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
                  className='dash-table is-fullwidth status-table'
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
                <h1 className='has-text-info'>
                  <FormattedMessage
                    id="report.noInfo"
                    defaultMessage={`No hay información que mostrar, intente con otro filtro`}
                  />
                </h1>
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
  component: injectIntl(StatusRepórt),
  title: 'Status de proyecto',
  icon: 'calendar-check-o',
  roles: 'consultor-level-3, analyst, orgadmin, admin, consultor-level-2, manager-level-2, manager-level-3'
})
