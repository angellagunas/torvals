import React, { Component } from 'react'
import { FormattedMessage, injectIntl } from 'react-intl'
import moment from 'moment'
import _ from 'lodash'
import { toast } from 'react-toastify'
import tree from '~core/tree'
import Select from '../projects/detail-tabs/select'
import api from '~base/api'
import { validateRegText } from '~base/tools'
import Loader from '~base/components/spinner'
import Page from '~base/page'
import { loggedIn } from '~base/middlewares/'
import { BaseTable } from '~base/components/base-table'
import BaseModal from '~base/components/base-modal'
import Spinner from '~base/components/spinner'
import { defaultCatalogs } from '~base/tools'
import { Timer } from '~base/components/timer'

class StatusRepórt extends Component {
  constructor (props) {
    super(props)
    this.state = {
      dataRows: [],
      showCycles: false,
      isFiltered: false,
      filtersLoaded: false,
      filtersLoading: false,
      isLoading: '',
      isDownloading: false,
      downloadCycle: '',
      showModal: false,
      userName: '',
      userGroup: [],
      filters: {
        cycles: [],
        users: [],
        status: [
          { uuid: 0, name: 'Todos' },
          { uuid: 1, name: 'Finalizado' },
          { uuid: 2, name: 'En proceso' },
          { uuid: 3, name: 'Inactivo' }
        ],
        exercise: [{ uuid: '1', name: 'Test' }]
      },
      formData: {
        cycle: 1,
        exercise: '',
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
          name: moment.utc(item.dateStart).format('MMMM D') + ' - ' + moment.utc(item.dateEnd).format('MMMM D'),
          viewName: `Ciclo ${item.cycle} (Periodo ${item.periodStart} - ${item.periodEnd})`
        }
      })

      cycles = _.orderBy(cycles, 'dateStart', 'asc').slice(-7)
      cycles = [
        {
          cycle: -1, // Todos
          viewName: `Todos (Periodo ${cycles[0].periodStart} - ${cycles[cycles.length - 1].periodEnd})`
        },
        ...cycles
      ]

      let formData = this.state.formData
      formData.cycle = cycles[1].cycle

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

  async getUsers(isState=true, dataCycle){
    const formCycle = dataCycle || this.state.formData.cycle
    const cycle = this.state.filters.cycles.find(item => {
      return item.cycle === formCycle
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
      if (isState) {
        this.setState({
          users: res.data
        })
      }
      return res.data
    } catch (e) {
      console.log(e)
      if (isState) {
        this.setState({
          dataRows: [],
          isFiltered: true,
          isLoading: '',
          selectedCheckboxes: new Set()
        })
      }
      return []
    }
  }

  async getDataRows(isState=true, dataCycle) {
    const { formData, filters } = this.state
    const formCycle = dataCycle || formData.cycle

    if (!formCycle) {
      this.notify('¡Se debe filtrar por ciclo!', 5000, toast.TYPE.ERROR)
      return
    }

    // Todos
    if (formCycle === -1) {
      return this.getAllDataRows()
    }

    const apiUsers = await this.getUsers(isState, dataCycle)

    const cycle = filters.cycles.find(item => {
      return item.cycle === formCycle
    })

    if (isState) {
      this.setState({
        isLoading: ' is-loading',
        isFiltered: false,
        salesTable: [],
        noSalesData: ''
      })
    }

    const url = '/app/reports/adjustments'
    try {
      let catalogItems = []
      for (const key in formData) {
        if (formData.hasOwnProperty(key)) {
          const element = formData[key];
          if(key !== 'cycle' && key !== 'user'){
            catalogItems.push(element)
          }
        }
      }

      catalogItems = catalogItems.filter(item => item)

      let users = formData.user ? [formData.user] : undefined
      const userList = apiUsers || this.state.users

      if(this.state.filterReady) {
        users = userList.finishedUsers
      }
      else if (this.state.filterProgress) {
        users = userList.inProgressUsers
      }
      else if (this.state.filterInactive) {
        users = userList.inactiveUsers
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

      for (let activeUser of filters.users) {
        const findUser = data.data.find(info => info.user[0].uuid === activeUser.uuid)
        if (findUser) {
          findUser.user[0].groups = activeUser.groups
          continue
        }

        if (users || formData['centro-de-venta'] || formData.canal) continue

        data.data.push({
          approved: 0,
          created: 0,
          rejected: 0,
          total: 0,
          user: [activeUser],
          _id: {
            user: activeUser._id
          }
        })
      }

      for (let users of data.data) {
        if (userList.finishedUsers.includes(users.user[0].uuid)) {
          users.status = 'Finalizado'
        }
        if (userList.inProgressUsers.includes(users.user[0].uuid)) {
          users.status = 'En proceso'
        }
      }

      if (isState) {
        this.setState({
          dataRows: data.data,
          isFiltered: true,
          isLoading: '',
          selectedCheckboxes: new Set(),
          showCycles: false
        })
        this.clearSearch()
      }
      return data.data
    } catch (e) {
      console.log(e)
      if (isState) {
        this.setState({
          dataRows: [],
          isFiltered: true,
          isLoading: '',
          selectedCheckboxes: new Set()
        })
      }
      return []
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
          return (
            <a className='' onClick={() => this.userDetail(row.user[0])}>
              { row.user[0].name }
            </a>
          )
        }
      },
      {
        'title': 'Rol',
        'property': 'role.name',
        'default': '',
        'sortable': true,
        formatter: (row) => {
          return row.user[0].organizations[0].role.name
        }
      },
      {
        'title': this.formatTitle('tables.colAdjustmentsByPeriod'),
        'property': 'user.total',
        'default': '0',
        'sortable': true,
        formatter: (row) => {
          return row.total - (row.approved + row.created + row.rejected)
        }
      },
      {
        'title': 'Estatus',
        'property': 'status',
        'default': 'Sin ajustes',
        'sortable': true
      },
      {
        'title': this.formatTitle('tables.colGroups'),
        'property': 'user.groups',
        'default': '',
        'sortable': true,
        formatter: (row) => {
          const groups = row.user[0].groups
          if (groups.length > 2) {
            return (
              <div>
                {groups[0].name}
                <br />
                {groups[1].name}
                <br />
                <button
                  className="button is-small is-white"
                  onClick={() => {
                    this.setState({
                      showModal: true,
                      userName: row.user[0].name,
                      userGroup: groups
                    })
                  }}
                >
                  {groups.length - 2} &nbsp; <FormattedMessage
                    id="user.detailMore"
                    defaultMessage={`más`}
                  />
                </button>
              </div>
            )
          } else if (groups.length > 1) {
            return (
              <div>
                {groups[0].name}
                <br />
                {groups[1].name}
              </div>
            )
          } else if (groups.length > 0) {
            return (
              <div>
                {groups[0].name}
              </div>
            )
          }
        }
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
      }
    ]

    // Todos
    if (this.state.showCycles) {
      cols = [
        {
          'title': 'Ciclo',
          'property': 'cycleName',
          'default': 'N/A',
          'sortable': true
        },
        ...cols
      ]
    }

    return cols
  }

  getGroupColumns() {
    return [
      {
        'title': 'Grupo',
        'property': 'name',
        'default': 'N/A'
      }
    ]
  }

  userDetail(user) {
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
    const searchTerm = this.state.searchTerm.trim()

    if (searchTerm === '') {
      this.setState({
        filteredData: this.state.dataRows
      })
      return
    }

    const items = this.state.dataRows.filter(item => {
      const user = item.user[0] || {}
      const groups = (user.groups || []).map(group => group.name || '').join(' ')
      const searchStr = `${user.name} ${groups}`

      const regEx = new RegExp(validateRegText(searchTerm), 'gi')

      return regEx.test(searchStr)
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
          key === 'exercise' ||
          key === 'status' ||
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

  filterUsers(type) {
    const baseFilter = {
      filterReady: false,
      filterProgress: false,
      filterInactive: false
    }

    switch (type) {
      case '1':
        this.setState({
          ...baseFilter,
          filterReady: true
        })
      break

      case '2':
        this.setState({
          ...baseFilter,
          filterProgress: true
        })
      break

      case '3':
        this.setState({
          ...baseFilter,
          filterInactive: true
        })
      break

      default:
        this.setState({
          ...baseFilter
        })
      break
    }
  }

  async getAllDataRows() {
    try {
      this.setState({
        isLoading: ' is-loading',
        isFiltered: false,
        salesTable: [],
        noSalesData: ''
      })

      const cycles = [...this.state.filters.cycles]
      cycles.shift()

      const allData = await Promise.all(cycles.map(async cycleItem => {
        const data = await this.getDataRows(false, cycleItem.cycle)
        const dataRows = []
        for (let item of data) {
          dataRows.push({
            cycleName: cycleItem.viewName,
            ...item
          })
        }
        return dataRows
      }))

      let allDataRows = []
      for (let item of allData) {
        allDataRows = [...allDataRows, ...item]
      }

      this.setState({
        dataRows: allDataRows,
        isFiltered: true,
        isLoading: '',
        selectedCheckboxes: new Set(),
        showCycles: true
      })
      this.clearSearch()
    } catch (error) {
      console.log(error)
      this.setState({
        dataRows: [],
        isFiltered: true,
        isLoading: '',
        selectedCheckboxes: new Set()
      })
      this.notify('¡Algo salio mal al cargar los datos!', 5000, toast.TYPE.ERROR)
    }
  }

  async download() {
    try {
      const { dataRows, projectSelected, filters, formData } = this.state
      const cycle = filters.cycles.find(item => item.cycle === formData.cycle) || {}
      const csv = ['Usuario,Rol,Ajustes por periodo,Estatus,Grupos,Aprobado,Rechazado,Pendientes,Ciclo']

      for (let row of dataRows) {
        csv.push([
          row.user[0].name || '',
          row.user[0].organizations[0].role.name || '',
          row.total - (row.approved + row.created + row.rejected),
          row.status || 'Sin Ajustes',
          (row.user[0].groups || []).map(group => group.name || '').join(' '),
          row.approved || 0,
          row.rejected || 0,
          row.created|| 0,
          row.cycleName || cycle.viewName
        ].join(','))
      }

      // Download CSV file
      const project = projectSelected.name || ''
      this.downloadCSV(csv.join('\n'), `reporte-actividad-Proyecto (${project})-${cycle.viewName || ''}.csv`)
    } catch (error) {
      console.log(error)
      this.setState({
        isDownloading: false,
      })
      this.notify('¡No se pudo completar la descarga!', 5000, toast.TYPE.ERROR)
    }
  }

  downloadCSV(csv, filename) {
    // CSV file
    const csvFile = new Blob(['\ufeff', csv], {type: 'text/csv'})

    // Download link
    let downloadLink = document.createElement('a')

    // File name
    downloadLink.download = filename

    // Create a link to the file
    downloadLink.href = window.URL.createObjectURL(csvFile)

    // Hide download link
    downloadLink.style.display = 'none'

    // Add the link to DOM
    document.body.appendChild(downloadLink)

    // Click download link
    downloadLink.click()

    this.setState({
      isDownloading: false
    })
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
        <div className='section columns is-multiline is-padingless-top'>
          <div className='column'>
            <div className='section level selects is-clearfix'>
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
                      optionName='viewName'
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

                {this.state.filters.status.length > 0 &&
                  <div className='level-item'>
                    <Select
                      label={"Estatus"}
                      name='status'
                      value={this.state.formData.status}
                      optionValue='uuid'
                      optionName='name'
                      options={this.state.filters.status}
                      onChange={(name, value) => { this.filterUsers(value) }}
                      disabled={this.state.filtersLoading}
                    />
                  </div>
                }


                {this.state.filters &&
                  this.makeFilters()
                }

                <div className='level-item'>
                  <div className="field">
                    <div className="label">
                      <br />
                    </div>
                    <div className="control">
                      <button className='button is-primary'
                        disabled={!!this.state.isLoading}
                        onClick={() => this.getDataRows()}
                      >
                        <FormattedMessage
                          id='dashboard.searchText'
                          defaultMessage={`Buscar`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          <Timer />

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

            <div className='level-right'>
              <div className='level-item'>

                <div className='field'>
                  <label className='label'>
                    <br />
                  </label>
                  <div className='control'>
                    <button className='button is-primary'
                      disabled={!!this.state.isLoading}
                      onClick={() => this.download()}
                    >
                      <span className='icon' title='Descargar'>
                        <i className='fa fa-download' />
                      </span>
                    </button>
                  </div>

                </div>
              </div>
            </div>

          </div>

          {this.state.isLoading ? <Spinner />
            : this.state.filteredData
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
        {this.state.isDownloading && <BaseModal
            title={`Descargando`}
            className="is-active"
            hideModal={() => {}}
          >
            <div>
              <h4>Obteniendo datos para {this.state.downloadCycle}...</h4>
              <br />
              <Spinner />
            </div>
          </BaseModal>
        }
        {this.state.showModal && <BaseModal
            title={`Grupos de ${this.state.userName}`}
            className="is-active"
            hideModal={() => this.setState({ showModal: false })}
          >
            <div className='scroll-table'>
              <div className='scroll-table-container'>
                <BaseTable
                  className='dash-table is-fullwidth status-table'
                  data={this.state.userGroup}
                  columns={this.getGroupColumns()}
                />
              </div>
            </div>
          </BaseModal>
        }
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