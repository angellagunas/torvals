import React, { Component } from 'react'
import api from '~base/api'
import tree from '~core/tree'
import moment from 'moment'
import { EditableTable } from '~base/components/base-editableTable'
import { toast } from 'react-toastify'
import FontAwesome from 'react-fontawesome'
import { BaseTable } from '~base/components/base-table'
import Checkbox from '~base/components/base-checkbox'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import CustomDate from './custom-date'

const generalAdjustment = 0.1
var currentRole

class TabApprove extends Component {
  constructor(props) {
    super(props)
    this.state = {
      dataRows: [],
      isLoading: '',
      selectedAll: false,
      disableButtons: true,
      selectedCheckboxes: new Set(),
      searchTerm: '',
      sortAscending: true,
      sortBy: 'statusLevel'
    }
    currentRole = tree.get('user').currentRole.slug
  }

  componentWillMount() {
    this.getAdjustmentRequests()
  }


  componentWillUnmount() {
    this.props.setAlert('is-white', ' ')
  }

  async getAdjustmentRequests() {
    if (this.props.project.activeDataset) {
      let url = '/app/adjustmentRequests/dataset/' + this.props.project.activeDataset.uuid
      try {
        let data = await api.get(url)
        this.setState({
          dataRows: data.data
        })
        this.getRemainingItems()
        this.clearSearch()
        this.handleSort(this.state.sortBy)
      } catch (e) {
        console.log(e)
      }
    }
  }

  getColumns() {
    return [
      {
        'title': 'Seleccionar Todo',
        'abbreviate': true,
        'abbr': (() => {
          if (currentRole !== 'consultor-level-3' && currentRole !== 'consultor-level-2') {
            return (
              <div className={this.state.remainingItems > 0 ? '' : 'is-invisible'}>
                <Checkbox
                  label='checkAll'
                  handleCheckboxChange={(e) => this.checkAll(!this.state.selectedAll)}
                  key='checkAll'
                  checked={this.state.selectedAll}
                  hideLabel />
              </div>
            )
          }
        })(),
        'property': 'checkbox',
        'default': '',
        formatter: (row, state) => {
          if (currentRole !== 'consultor-level-3' && currentRole !== 'consultor-level-2') {
            if (row.status === 'created') {
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
        }
      },
      {
        'title': 'Id',
        'property': 'productId',
        'default': 'N/A',
        'sortable': true,
        formatter: (row) => {
          if (!row.selected) {
            row.selected = false
          }
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
        'title': 'Predicción',
        'property': 'datasetRow.data.prediction',
        'default': 0,
        'sortable': true,
        formatter: (row) => {
          return String(row.datasetRow.data.prediction)
        }
      },
      {
        'title': 'Ajuste',
        'property': 'newAdjustment',
        'default': 0,
        'type': 'number',
        'sortable': true,
        formatter: (row) => {
          if (!row.newAdjustment) {
            row.newAdjustment = 0
          }
          return row.newAdjustment
        }
      },
      {
        'title': 'Rango',
        'property': 'percentage',
        'default': 0,
        'type': 'number',
        'sortable': true,
        formatter: (row) => {
          let percentage = (
            ((row.newAdjustment - row.lastAdjustment) / row.lastAdjustment) * 100
          )
          row.percentage = percentage
          return Math.round(percentage) + ' %'
        }
      },
      {
        'title': 'Creado',
        'property': 'dateRequested',
        'sortable': true,
        formatter: (row) => {
          return (
            <span title={'Creado por ' + row.requestedBy.name}>
              {moment.utc(row.dateRequested).local().format('DD/MM/YYYY hh:mm a')}
            </span>
          )
        }
      },
      {
        'title': 'Aprobado / Rechazado',
        formatter: (row) => {
          if (row.dateRejected) {
            return (
              <span title={'Rechazado por ' + row.rejectedBy.name}>
                {moment.utc(row.dateRejected).local().format('DD/MM/YYYY hh:mm a')}
              </span>
            )
          }
          else if (row.dateApproved) {
            return (
              <span title={'Aprobado por ' + row.approvedBy.name}>
                {moment.utc(row.dateApproved).local().format('DD/MM/YYYY hh:mm a')}
              </span>
            )
          }
        }
      },
      {
        'title': 'Estado',
        'property': 'statusLevel',
        'default': '',
        'centered': true,
        'sortable': true,
        formatter: (row) => {
          if (row.status === 'created') {
            row.statusLevel = 0
            return (
              <span
                className='icon has-text-info'
                title={'Creado por ' + row.requestedBy.name}>
                <FontAwesome name='info-circle fa-lg' />
              </span>
            )
          }
          if (row.status === 'approved') {
            row.statusLevel = 1
            return (
              <span
                className='icon has-text-success'
                title={'Aprobado por ' + row.approvedBy.name}>
                <FontAwesome name='check-circle fa-lg' />
              </span>
            )
          }
          if (row.status === 'rejected') {
            row.statusLevel = 2
            return (
              <span
                className='icon has-text-danger'
                title={'Rechazado por ' + row.rejectedBy.name}>
                <FontAwesome name='times-circle fa-lg' />
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
    if (row.status === 'created') {
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
  }

  startDateChange = (date) => {

    this.setState({
      startDate: date
    }, () => this.filterbyDate())

  }

  endDateChange = (date) => {

    date = date.set({ 'hour': 23, 'minute': 59, 'second': 59 })

    this.setState({
      endDate: date
    }, () => this.filterbyDate())


  }

  filterbyDate() {
    if (this.state.startDate && this.state.endDate) {
      this.uncheckAll()

      if (this.state.startDate > this.state.endDate) {
        this.notify('Rango de fechas inválido', 5000, toast.TYPE.ERROR)
        return
      }

      this.setState({
        searchDate: true
      }, () => this.searchDatarows())
    }
  }

  getModifyButtons() {
    return (
      <div className='section level selects'>
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
                  <i className='fa fa-search fa-xs'></i>
                </span>
              </div>
            </div>
          </div>

          <div className='level-item'>
            <div className='field is-grouped'>
              <div className='field control'>
                <label className='label'>Filtrar por fecha</label>
                <div className='control'>
                  <DatePicker
                    selected={this.state.startDate}
                    selectsStart
                    startDate={this.state.startDate}
                    endDate={this.state.endDate}
                    onChange={this.startDateChange}
                    dateFormat="DD/MM/YYYY"
                    todayButton={"Hoy"}
                    placeholderText="Fecha inicio"
                    customInput={<CustomDate />}
                  />
                </div>
              </div>
              <div className='field control'>
                <label className='label'>&nbsp;</label>
                <div className='control'>
                  <DatePicker
                    selected={this.state.endDate}
                    selectsEnd
                    startDate={this.state.startDate}
                    endDate={this.state.endDate}
                    onChange={this.endDateChange}
                    dateFormat="DD/MM/YYYY"
                    todayButton={"Hoy"}
                    placeholderText="Fecha final"
                    customInput={<CustomDate />}
                  />
                </div>
              </div>
              <div className='control clear-btn'>
                <a className='button is-info'
                  onClick={() => {
                    this.clearSearch()
                    this.clearSearchDate()
                  }}>
                  Limpiar
                  </a>
              </div>
            </div>
          </div>
        </div>

        {currentRole !== 'consultor-level-3' && currentRole !== 'consultor-level-2' 
          ? <div className='level-right'>
            <div className='level-item'>
              <div className='saleCenter'>
                <span>Total: </span>
                <span className='has-text-weight-bold is-capitalized'>{this.state.dataRows.length}
                </span>
              </div>
            </div>

            <div className='level-item'>
              <div className='saleCenter'>
                <span>Pendientes: </span>
                <span className='has-text-weight-bold is-capitalized'>{this.state.remainingItems}
                </span>
              </div>
            </div>
            <div className='level-item is-margin-top-20'>
              <button
                className='button is-danger'
                onClick={this.reject}
                disabled={this.state.disableButtons}
              >
                <span>Rechazar</span>
              </button>
            </div>
            <div className='level-item is-margin-top-20'>
              <button
                className='button is-success'
                onClick={this.approve}
                disabled={this.state.disableButtons}
              >
                <span>Aprobar</span>
              </button>
            </div>
          </div>
          : null
        }
      </div>
    )
  }

  searchDatarows() {
    const items = this.state.dataRows.map((item) => {
      if (this.state.searchTerm === '' && !this.state.searchDate) {
        return item
      }
      else if (this.state.searchDate) {
        let d = moment(item.dateRequested)

        if (d >= this.state.startDate && d <= this.state.endDate) {

          if (this.state.searchTerm !== '') {
            const regEx = new RegExp(this.state.searchTerm, 'gi')

            if (regEx.test(item.product.name) ||
              regEx.test(item.product.externalId))
              return item
            else
              return null
          }

          else
            return item
        }

        else
          return null
      }
      else if (this.state.searchTerm !== '' && !this.state.searchDate) {
        const regEx = new RegExp(this.state.searchTerm, 'gi')

        if (regEx.test(item.product.name) ||
          regEx.test(item.product.externalId))
          return item
        else
          return null
      }
    })
      .filter(function (item) { return item != null });

    this.setState({
      filteredData: items
    })
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

  clearSearchDate = () => {
    this.uncheckAll()

    this.setState({
      searchDate: false,
      startDate: undefined,
      endDate: undefined
    }, () => this.searchDatarows())
  }

  approve = async () => {
    let url = '/app/adjustmentRequests/approve/'

    for (const row of this.state.selectedCheckboxes) {
      try {
        row.edited = true
        let res = await api.get(url + row.uuid)

        if (res) {
          row.status = res.data.status
          row.approvedBy = res.data.approvedBy
          row.dateApproved = res.data.dateApproved
          await this.handleChange(row)
        }
      } catch (e) {
        row.edited = false
        console.log(e)
      }
    }
  }

  reject = async () => {
    let url = '/app/adjustmentRequests/reject/'

    for (const row of this.state.selectedCheckboxes) {
      try {
        row.edited = true
        let res = await api.get(url + row.uuid)

        if (res) {
          row.status = res.data.status
          row.rejectedBy = res.data.rejectedBy
          row.dateRejected = res.data.dateRejected
          await this.handleChange(row)
        }
      } catch (e) {
        row.edited = false
        console.log(e)
      }
    }
  }

  toggleButtons() {
    let disable = true

    if (this.state.selectedCheckboxes.size > 0)
      disable = false

    this.setState({
      disableButtons: disable
    })
  }

  async handleChange(obj) {

    let index = this.state.dataRows.findIndex((item) => { return obj.uuid === item.uuid })
    let aux = this.state.dataRows
    obj.selected = false
    aux.splice(index, 1, obj)

    this.setState({
      dataRows: aux
    })

    if (obj.status === 'approved') {
      this.notify('Ajuste aprobado', 5000, toast.TYPE.SUCCESS)
    }
    else if (obj.status === 'rejected') {
      this.notify('Ajuste rechazado', 5000, toast.TYPE.ERROR)
    }

    this.state.selectedCheckboxes.delete(obj)
    this.getRemainingItems()

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

  getRemainingItems() {
    let cont = 0
    for (let row of this.state.dataRows) {
      if (row.status === 'created') {
        cont++
      }
    }
    this.setState({
      remainingItems: cont
    })
    this.toggleButtons()
  }

  handleSort(e) {
    let sorted = this.state.filteredData

    if (e === 'productId') {
      if (this.state.sortAscending) {
        sorted.sort((a, b) => { return parseFloat(a.product.externalId) - parseFloat(b.product.externalId) })
      }
      else {
        sorted.sort((a, b) => { return parseFloat(b.product.externalId) - parseFloat(a.product.externalId) })
      }
    }
    else {
      if (this.state.sortAscending) {
        sorted = _.orderBy(sorted, [e], ['asc'])

      }
      else {
        sorted = _.orderBy(sorted, [e], ['desc'])
      }
    }

    this.setState({
      filteredData: sorted,
      sortAscending: !this.state.sortAscending,
      sortBy: e
    })
  }

  render() {

    return (
      <div>
        <section>
          {this.getModifyButtons()}
          {this.state.dataRows.length === 0 ?
            <section className='section'>
              <center>
                <h2 className='has-text-info'>No hay ajustes por aprobar</h2></center>
            </section>
            :
            <BaseTable
              className='aprobe-table is-fullwidth'
              data={this.state.filteredData}
              columns={this.getColumns()}
              sortAscending={this.state.sortAscending}
              sortBy={this.state.sortBy}
              handleSort={(e) => this.handleSort(e)} />
          }
        </section>
      </div>
    )
  }
}

export default TabApprove
