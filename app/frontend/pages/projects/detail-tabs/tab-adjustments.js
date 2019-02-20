import React, { Component, Fragment } from 'react'
import { FormattedMessage, injectIntl } from 'react-intl'
import FontAwesome from 'react-fontawesome'
import moment from 'moment'
import _ from 'lodash'
import tree from '~core/tree'
import { toast } from 'react-toastify'
import { defaultCatalogs } from '~base/tools'

import api from '~base/api'
import { validateRegText } from '~base/tools'
import Loader from '~base/components/spinner'
import Editable from '~base/components/base-editable'
import Checkbox from '~base/components/base-checkbox'
import Spinner from '~base/components/spinner'

import WeekTable from './week-table'
import ProductTable from './product-table'
import Select from './select'
import Graph from '~base/components/graph'
import DatePicker from '~base/components/date-picker'
import { Timer } from '~base/components/timer'

const FileSaver = require('file-saver')

let currentRole
let Allchannels

class TabAdjustment extends Component {
  constructor (props) {
    super(props)
    this.state = {
      isUpdating: false,
      dataRows: [],
      pendingDataRows: {},
      isFiltered: false,
      filtersLoaded: false,
      filtersLoading: false,
      isLoading: '',
      loadingIndicators: false,
      isLoadingButtons: '',
      modified: 0,
      pending: 0,
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
      timeRemaining: {},
      disableButtons: true,
      selectedCheckboxes: new Set(),
      searchTerm: '',
      isDownloading: '',
      generalAdjustment: 0.1,
      salesTable: [],
      noSalesData: '',
      byWeek: true,
      indicators: 'indicators-hide',
      quantity: 100,
      percentage: 1,
      error: false,
      errorMessage: '',
      showAdjusted: true,
      showNotAdjusted: true,
      prices: false,
      totalPrevSale: 0,
      filteredData: [],
      prevData: []
    }

    moment.locale(this.formatTitle('dates.locale'))
  }

  componentWillMount () {
    this.getFilters()
  }

  componentWillReceiveProps(nextProps) {
    this.getFilters()
  }

  componentDidUpdate(prevProps) {
    if (this.props.project.status === 'adjustment' && prevProps.project.status !== 'adjustment') {
      this.clearSearch()
      this.getFilters()
    }
  }

  async getFilters() {
    this.getDataRows()
  }

  async filterChangeHandler(name, value) {
    if(name === 'cycle') {
      const cycle = this.state.filters.cycles.find(item => {
        return item.cycle === value
      })

      const minDate = moment.utc(cycle.dateStart)
      const maxDate = moment.utc(cycle.dateEnd)

      this.props.showFinishBtn(!cycle.isFinished)
      this.setState({
        minDate,
        startDate: minDate,
        maxDate,
        endDate: maxDate,
        filters: {
          ...this.state.filters
        }
      })
      tree.set('selectedCycle', cycle)
      tree.commit()
    }

    let aux = this.state.formData
    aux[name] = value

    this.setState({
      formData: aux
    }, () => {
      this.getDataRows()
    })
  }

  async getDataRows () {
    var cycle = this.state.filters.cycles.find(item => {
      return item.cycle === this.state.formData.cycle
    })

    let adjustment = -1

    this.setState({
      isLoading: ' is-loading',
      isFiltered: false,
      generalAdjustment: adjustment,
      salesTable: [],
      noSalesData: ''
    })

    const url = '/v2/datasetrows'
    try{
      // this.getSalesTable()
      let data = await api.get(url,
        {
          ...this.state.formData
        }
      )

      this.setState({
        dataRows: data.results,
        isFiltered: true,
        isLoading: '',
        selectedCheckboxes: new Set()
      })
      this.clearSearch()
    }catch(e){
      console.log(e)
      this.setState({
        dataRows: [],
        isFiltered: true,
        isLoading: '',
        selectedCheckboxes: new Set()
      })
    }
  }

  changeAdjustment = async (value, row) => {
    row.lastLocalAdjustment = row.adjustmentForDisplay
    row.newAdjustment = value
    const res = await this.handleChange(row)
    if (!res) {
      return false
    }
    return res
  }

  onChangePercentage = (e) => {
    let val = parseInt(e.target.value)
    if (isNaN(val)) {
      val = e.target.value
    }
    this.setState({
      percentage: val
    })
  }

  onChangeQuantity = (e) => {
    let val = parseInt(e.target.value)
    if (isNaN(val)) {
      val = e.target.value
    }
    this.setState({
      quantity: val
    })
  }

  async handleChange(obj) {
    let rowAux = []
    let isLimited = false
    let limitedRows = []
    let pendingDataRows = {}
    if (obj instanceof Array) {
      rowAux = obj
    } else {
      rowAux.push(obj)
    }

    for (let row of rowAux) {
      let base
      if(row.lastAdjustment){
        base = row.lastAdjustment
      }else{
        base = row.prediction
      }

      let maxAdjustment = Math.ceil(base * (1 + this.state.generalAdjustment))
      let minAdjustment = Math.floor(base * (1 - this.state.generalAdjustment))

      row.newAdjustment = Math.round(row.newAdjustment)
      row.adjustmentForDisplay = Math.round(row.adjustmentForDisplay)
      row.adjustmentForDisplayAux = row.adjustmentForDisplay
      row.isLimitAux = row.isLimit

      if (this.state.generalAdjustment > 0) {
        row.isLimit = (row.newAdjustment > maxAdjustment || row.newAdjustment < minAdjustment)
      }

      if (row.isLimit && row.adjustmentRequest &&
        (row.adjustmentRequest.status === 'approved' ||
          row.adjustmentRequest.status === 'created')) {
        row.adjustmentRequest.status = 'rejected'
      }

      row.adjustmentForDisplay = row.newAdjustment

      row.edited = true
      row.wasEdited = true

      if (row.isLimit) {
        isLimited = true

        if (!pendingDataRows[row.uuid]) pendingDataRows[row.uuid] = row

        rowAux = rowAux.filter((item) => { return row.uuid !== item.uuid })
        limitedRows.push(row)
      }
    }

    try {
      var url = '/app/rows/'

      if (rowAux.length > 0) {
        const res = await api.post(url, rowAux)
      }
      if (isLimited && (currentRole === 'manager-level-1')) {
        this.notify(
          (<p>
            <span className='icon'>
              <i className='fa fa-warning fa-lg' />
            </span>
            <FormattedMessage
              id="projects.limitInfo"
              defaultMessage={`¡Debes pedir una solicitud de aprobación de ajuste haciendo click sobre el ícono rojo o el botón de finalizar!`}
            />
          </p>),
          5000,
          toast.TYPE.WARNING
        )
      } else {
        this.notify('¡' + this.formatTitle('adjustments.save')+'!', 5000, toast.TYPE.INFO)
      }
      this.props.pendingDataRows(pendingDataRows)

      await this.updateSalesTable(obj)

    } catch (e) {
      this.notify('Error ' + e.message, 5000, toast.TYPE.ERROR)

      for (let row of rowAux) {
        row.edited = false
        row.adjustmentForDisplay = row.adjustmentForDisplayAux
        if (row.isLimitAux !== row.isLimit) {
          row.isLimit = false
        }

        delete row.adjustmentForDisplayAux
        delete row.isLimitAux
      }

      for (let row of limitedRows) {
        row.edited = false
        row.adjustmentForDisplay = row.adjustmentForDisplayAux
        if (row.isLimitAux !== row.isLimit) {
          row.isLimit = false
        }

        delete row.adjustmentForDisplayAux
        delete row.isLimitAux
        delete pendingDataRows[row.uuid]
      }

      this.props.pendingDataRows(pendingDataRows)

      return false
    }

    this.props.loadCounters()

    if (currentRole !== 'manager-level-1' && limitedRows.length) {
      this.props.handleAdjustmentRequest(limitedRows)
    }

    return true
  }

  notify (message = '', timeout = 5000, type = toast.TYPE.INFO) {
    let className = ''
    if(type === toast.TYPE.WARNING){
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

  clearSearch = () => {
    this.setState({
      searchTerm: ''
    })
  }

  setAlertMsg() {
    return <span>
      <FormattedMessage
        id="projects.unlimitedAdjustmentMode"
        defaultMessage={'Modo Ajuste Ilimitado'}
      />
    </span>
  }

  async updateSalesTable(row) {
    if (!row.productPrice) {
      row.productPrice = 10.00
    }

    let salesTable = this.state.salesTable

    for (let i = 0; i < salesTable.length; i++) {

      if (row.semanaBimbo === parseInt(salesTable[i].week)) {
        let price = Math.abs((row.adjustmentForDisplay - row.lastLocalAdjustment) * row.productPrice)

        if (row.lastLocalAdjustment > row.adjustmentForDisplay) {
          price *= -1
        }

        salesTable[i].adjustment += price

        let totalPrediction = 0
        let totalAdjustment = 0

        for (let i = 0; i < salesTable.length; i++) {
          const element = salesTable[i];
          totalAdjustment += element.adjustment
          totalPrediction += element.prediction
        }

        this.setState({
          salesTable: salesTable,
          totalAdjustment: totalAdjustment,
          totalPrediction: totalPrediction
        })
      }
    }
  }

  loadTable() {
    if (this.state.noSalesData === '') {
      return (
        <div className='is-fullwidth has-text-centered subtitle has-text-primary'>
          <FormattedMessage
            id="projects.loading"
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

  showByWeek = () => {
    this.setState({
      byWeek: true
    })
  }

  showByProduct = () => {
    this.setState({
      byWeek: false
    })
  }

  toggleIndicators = () =>{
    this.setState({
      indicators: this.state.indicators === 'indicators-show' ? 'indicators-hide' : 'indicators-show'
    })
  }

  getCycleName() {
    let cycle = this.state.filters.cycles.find(item => {
      return item.cycle === this.state.formData.cycle
    })
    return moment.utc(cycle.dateStart).format('MMMM')
  }

  findName = (slug) => {
    const find = this.rules.catalogs.find(item => {
      return item.slug === slug
    })

    let title = find.name
    if (this.findInCatalogs(find.slug)) {
      title = this.formatTitle('catalogs.' + find.slug)
    }
    return title
  }

  showBy(prices) {
    this.setState({
      prices
    }, () => {
    })
  }

  getCallback() {
    if (this.state.prices) {
      return function (label, index, labels) {
        return '$' + label.toFixed(0).replace(/./g, (c, i, a) => {
          return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
        })
      }
    }
    else {
      return function (label, index, labels) {
        return label.toFixed(0).replace(/./g, (c, i, a) => {
          return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
        })
      }
    }
  }

  getTooltipCallback() {
    if (this.state.prices) {
      return function (tooltipItem, data) {
        let label = ' '
        label += data.datasets[tooltipItem.datasetIndex].label || ''

        if (label) {
          label += ': '
        }
        let yVal = '$' + tooltipItem.yLabel.toFixed(0).replace(/./g, (c, i, a) => {
          return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
        })
        return label + yVal
      }
    }
    else {
      return function (tooltipItem, data) {
        let label = ' '
        label += data.datasets[tooltipItem.datasetIndex].label || ''

        if (label) {
          label += ': '
        }
        let yVal = tooltipItem.yLabel.toFixed(0).replace(/./g, (c, i, a) => {
          return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
        })
        return label + yVal
      }
    }
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

  onDatesChange = ({ startDate, endDate }) => {
    this.setState({
      startDate,
      endDate
    })
  }

  render () {
    let banner =  (
      <div className='section columns'>
        <div className='column'>
          <article className="message is-primary">
            <div className="message-header">
              <p>
                <FormattedMessage
                  id="projects.info"
                  defaultMessage={`Información`}
                />
              </p>
            </div>
            <div className="message-body">
              <FormattedMessage
                id="projects.adjustmentSaved"
                defaultMessage={`¡Sus ajustes se han guardado con éxito!`}
              />
            </div>
          </article>
        </div>
      </div>
    )

    if (!this.state.filtersLoaded) {
      return (
        <div className='section has-text-centered subtitle has-text-primary'>
          <FormattedMessage
            id="projects.loading"
            defaultMessage={`Cargando, un momento por favor`}
          />
          <Loader />
        </div>
      )
    }

    const graphData = [
      {
        label: this.formatTitle('tables.colForecast'),
        color: '#187FE6',
        data: this.state.salesTable.map((item, key) => { return item.prediction.toFixed(0) })
      },
      {
        label: this.formatTitle('tables.colAdjustment'),
        color: '#30C6CC',
        data: this.state.salesTable.map((item, key) => { return item.adjustment.toFixed(0) })
      },
      {
        label: this.formatTitle('tables.colLast'),
        color: '#EF6950',
        data: this.state.prevData.map(item => item.sale)
      }
    ]

    let labelCallback = this.getCallback()
    let tooltipCallback = this.getTooltipCallback()


    return (
      <div>
        {banner}
        <div className='section level selects'>
          <div className='columns is-multiline is-mobile'>
            <div className='column is-narrow'>
              <Select
                label={this.formatTitle('adjustments.cycle')}
                name='cycle'
                value={this.state.formData.cycle}
                optionValue='cycle'
                optionName='viewName'
                type='integer'
                options={this.state.filters.cycles}
                onChange={(name, value) => { this.filterChangeHandler(name, value) }}
              />
            </div>
          </div>
        </div>

        <section>
          {!this.state.isFiltered || this.state.isLoading !== ''
            ? <div className='section has-text-centered subtitle has-text-primary'>
                <FormattedMessage
                id="dashboard.tableLoading"
                  defaultMessage={`Cargando, un momento por favor`}
                />
                <Loader />
              </div>
            : <div>
              { this.state.dataRows.length > 0 ?
                <div>
                  <section className='section'>
                  <h1 className='period-info'>
                    <span className='has-text-weight-semibold is-capitalized'>{this.formatTitle('adjustments.cycle')} {this.getCycleName()} - </span>
                    <span className='has-text-info has-text-weight-semibold'> {this.setAlertMsg()}</span>
                  </h1>
                </section>
                  {
                    !this.state.byWeek ?

                      this.state.filteredData && this.state.filteredData.length > 0 ?

                        <ProductTable
                          show={this.showByWeek}
                          currentRole={currentRole}
                          data={this.state.filteredData}
                          changeAdjustment={this.changeAdjustment}
                          generalAdjustment={this.state.generalAdjustment}
                          adjustmentRequestCount={Object.keys(this.state.pendingDataRows).length}
                          handleAdjustmentRequest={(row) => { this.props.handleAdjustmentRequest(row) }}
                          handleAllAdjustmentRequest={() => { this.props.handleAllAdjustmentRequest() }}
                          rules={this.rules}
                        />
                        :
                        <div className='section has-text-centered subtitle has-text-primary'>
                          {this.formatTitle('dashboard.productEmptyMsg')}
                        </div>
                      :

                      this.state.filteredData && this.state.filteredData.length > 0 ?
                        <WeekTable
                          show={this.showByProduct}
                          currentRole={currentRole}
                          data={this.state.filteredData}
                          checkAll={this.checkAll}
                          changeAdjustment={this.changeAdjustment}
                          generalAdjustment={this.state.generalAdjustment}
                          adjustmentRequestCount={Object.keys(this.state.pendingDataRows).length}
                          handleAdjustmentRequest={(row) => { this.props.handleAdjustmentRequest(row) }}
                          handleAllAdjustmentRequest={() => { this.props.handleAllAdjustmentRequest() }}
                        />
                        :
                        <div className='section has-text-centered subtitle has-text-primary'>
                          {this.formatTitle('dashboard.productEmptyMsg')}
                        </div>
                  }
                </div>
                :
                <div className='section has-text-centered subtitle has-text-primary'>
                  {this.formatTitle('dashboard.productEmptyMsg')}
                </div>
              }
            </div>
          }
        </section>
      </div>
    )
  }
}

export default injectIntl(TabAdjustment)
