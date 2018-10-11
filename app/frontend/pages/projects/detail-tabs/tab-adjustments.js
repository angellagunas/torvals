import React, { Component } from 'react'
import { FormattedMessage, injectIntl } from 'react-intl'
import FontAwesome from 'react-fontawesome'
import moment from 'moment'
import _ from 'lodash'
import tree from '~core/tree'
import { toast } from 'react-toastify'
import { defaultCatalogs } from '~base/tools'

import api from '~base/api'
import Loader from '~base/components/spinner'
import Editable from '~base/components/base-editable'
import Checkbox from '~base/components/base-checkbox'

import WeekTable from './week-table'
import ProductTable from './product-table'
import Select from './select'
import Graph from '~base/components/graph'
import DatePicker from '~base/components/date-picker'

const FileSaver = require('file-saver')

var currentRole

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

    currentRole = tree.get('user').currentRole.slug
    this.rules = this.props.rules
    this.toastId = null

    moment.locale(this.formatTitle('dates.locale'))

  }

  componentWillMount () {
    if(this.props.selectedTab === 'ajustes'){
      this.getFilters()
    }
  }

  componentWillReceiveProps(nextProps){
    if (this.props.project.uuid && nextProps.project.uuid !== this.props.project.uuid) return

    if (nextProps.selectedTab === 'ajustes' && !this.state.filtersLoaded && !this.state.filtersLoading) {
      this.getFilters()
    }

  }

  componentDidUpdate(prevProps) {
    if (this.props.project.status === 'adjustment' && prevProps.project.status !== 'adjustment') {
      this.clearSearch()
      this.getFilters()
    }
  }

  async getFilters() {
    if (this.props.project.activeDataset && this.props.project.status === 'adjustment') {
      this.setState({ filtersLoading:true })

      const url = '/app/rows/filters/dataset/'

      try {
        let res = await api.get(url + this.props.project.activeDataset.uuid)

        let cycles = _.orderBy(res.cycles, 'dateStart', 'asc')

        if (currentRole !== 'manager-level-1') {
          cycles = cycles.map((item, key) => {
            return item = {
              ...item,
              adjustmentRange: this.rules.rangesLvl2[key],
              name: moment.utc(item.dateStart).format('MMMM D') + ' - ' + moment.utc(item.dateEnd).format('MMMM D'),
              viewName: `Ciclo ${item.cycle} (Periodo ${item.periodStart} - Periodo ${item.periodEnd})`
            }
          })
        }
        else {
          cycles = cycles.map((item, key) => {
            return item = {
              ...item,
              adjustmentRange: this.rules.ranges[key],
              name: moment.utc(item.dateStart).format('MMMM D') + ' - ' + moment.utc(item.dateEnd).format('MMMM D'),
              viewName: `Ciclo ${item.cycle} (Periodo ${item.periodStart} - Periodo ${item.periodEnd})`
            }
          })
        }
        cycles = cycles.filter(cycle => cycle.adjustmentRange !== 0)

        let formData = this.state.formData
        formData.cycle = cycles[0].cycle
        tree.set('selectedCycle', cycles[0])
        tree.commit()

        for (let fil of Object.keys(res)) {
          if (fil === 'cycles') continue

          res[fil] = _.orderBy(res[fil], 'name')
          if(res[fil][0])
            formData[fil] = res[fil][0].uuid
        }

        const minDate = moment.utc(cycles[0].dateStart)
        const maxDate = moment.utc(cycles[0].dateEnd)

        this.setState({
          minDate,
          startDate: minDate,
          maxDate,
          endDate: maxDate,
          filters: {
            ...this.state.filters,
            ...res,
            cycles: cycles,
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
          errorMessage: '¡'+ this.formatTitle('adjustments.noFilters') +'!'
        })

        this.notify(
          '¡' + this.formatTitle('adjustments.noFilters') + '!' + e.message,
          5000,
          toast.TYPE.ERROR
        )
      }
    }
  }

  async filterChangeHandler (name, value) {
    if(name === 'cycle'){
      var cycle = this.state.filters.cycles.find(item => {
        return item.cycle === value
      })

      const minDate = moment.utc(cycle.dateStart)
      const maxDate = moment.utc(cycle.dateEnd)

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

  getAdjustment(adjustment){
    if(adjustment === null){
      return -1
    }
    else if(adjustment !== undefined){
      return Number(adjustment) / 100
    }
    else{
      return 0
    }
  }

  async getDataRows () {
    if (!this.state.formData.cycle) {
      //TODO: translate
      this.notify('¡Se debe filtrar por ciclo!', 5000, toast.TYPE.ERROR)
      return
    }

    var cycle = this.state.filters.cycles.find(item => {
      return item.cycle === this.state.formData.cycle
    })

    let adjustment = this.getAdjustment(cycle.adjustmentRange)

    if (this.props.project.cycleStatus !== 'rangeAdjustment')
      adjustment = 0

    this.setState({
      isLoading: ' is-loading',
      isFiltered: false,
      generalAdjustment: adjustment,
      salesTable: [],
      noSalesData: ''
    })

    const url = '/app/rows/dataset/'
    try{
      let data = await api.get(
        url + this.props.project.activeDataset.uuid,
        {
          ...this.state.formData,
          cycle: cycle.uuid,
          date_start: this.state.startDate.toDate(),
          date_end: this.state.maxDate.toDate(),
        }
      )
      this.setState({
        dataRows: this.getEditedRows(data.data),
        isFiltered: true,
        isLoading: '',
        selectedCheckboxes: new Set()
      })
      this.clearSearch()
      this.getSalesTable()
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

  getEditedRows(data) {
    for (let row of data) {
      row.adjustmentForDisplay = row.adjustment

      if (!row.lastAdjustment) row.lastAdjustment = row.prediction

      if (row.adjustmentRequest && row.adjustmentRequest.status !== 'rejected') {
        row.adjustmentForDisplay = row.adjustmentRequest.newAdjustment
      }

      if (row.adjustment !== row.lastAdjustment || row.adjustmentRequest) {
        row.wasEdited = true
        if (this.state.generalAdjustment > 0) {
          var maxAdjustment = Math.ceil(row.prediction * (1 + this.state.generalAdjustment))
          var minAdjustment = Math.floor(row.prediction * (1 - this.state.generalAdjustment))

          row.isLimit = (
            row.adjustmentForDisplay > maxAdjustment || row.adjustmentForDisplay < minAdjustment
          )
        }
      }

    }

    return data
  }

  checkAll = (checked) => {
    this.setState({
      selectedCheckboxes: checked
    },
      function () {
        this.toggleButtons()
      })
  }

  toggleCheckbox = (row) => {
    if (this.state.selectedCheckboxes.has(row)) {
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
    row.lastLocalAdjustment = row.adjustmentForDisplay
    row.newAdjustment = value
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

  showRows(type, value){
    if(type === 'showAdjusted'){
      this.setState({
        showAdjusted: value
      }, () => { this.searchDatarows() })
    }
    else {
      this.setState({
        showNotAdjusted: value
      }, () => { this.searchDatarows() })
    }
  }

  getModifyButtons () {
    return (
      <div className='columns'>

        <div className='column is-narrow'>
          <div className='field'>
            {currentRole !== 'consultor-level-3' && currentRole !== 'consultor-level-2' ?
              <label className='label'>
                <FormattedMessage
                  id="dashboard.searchText"
                  defaultMessage={`Búsqueda general`}
                />
              </label>:
              null
            }
            <div className='control has-icons-right'>
              <input
                className='input input-search'
                type='text'
                value={this.state.searchTerm}
                onChange={this.searchOnChange} placeholder={this.formatTitle('dashboard.searchText')} />

              <span className='icon is-small is-right'>
                <i className='fa fa-search fa-xs'></i>
              </span>
            </div>
          </div>
        </div>
        {currentRole !== 'consultor-level-3' && currentRole !== 'consultor-level-2' ?
          <div className='column is-narrow'>
            <div className='modifier'>
              <div className='field'>
                <label className='label'>
                  <FormattedMessage
                    id="adjustments.modifyQuantity"
                    defaultMessage={`Modificar por cantidad`}
                  />
                </label>
                <div className='field is-grouped control'>

                  <div className='control'>
                    <button
                      className={this.state.disableButtons ? 'button is-outlined disabled-btn' : 'button is-outlined'}
                      onClick={() => this.onClickButtonMinus('quantity')}
                      >
                      <span className='icon'>
                        <i className='fa fa-minus' />
                      </span>
                    </button>
                  </div>
                  <div className='control'>
                    <input
                      className='input input-cant has-text-centered'
                      type='text'
                      placeholder='0'
                      value={this.state.quantity}
                      onChange={this.onChangeQuantity} />
                  </div>

                  <div className='control'>
                    <button
                      className={this.state.disableButtons ? 'button is-outlined disabled-btn' : 'button is-outlined'}
                      onClick={() => this.onClickButtonPlus('quantity')}
                      >
                      <span className='icon'>
                        <i className='fa fa-plus' />
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div> : null
        }

        {currentRole !== 'consultor-level-3' && currentRole !== 'consultor-level-2' ?
          <div className='column is-narrow'>
            <div className='modifier'>
              <div className='field'>
                <label className='label'>
                  <FormattedMessage
                    id="adjustments.modifyPercentage"
                    defaultMessage={`Modificar por porcentaje`}
                  />
                </label>
                <div className='field is-grouped control'>
                  <div className='control'>
                    <button
                      className={this.state.disableButtons ? 'button is-outlined disabled-btn' : 'button is-outlined'}
                      onClick={() => this.onClickButtonMinus('percent')}
                      >
                      <span className='icon'>
                        <i className='fa fa-minus' />
                      </span>
                    </button>
                  </div>
                  <div className='control'>
                    <input
                      className='input input-cant has-text-centered'
                      type='text'
                      placeholder='0%'
                      value={this.state.percentage}
                      onChange={this.onChangePercentage} />
                  </div>

                  <div className='control'>
                    <button
                      className={this.state.disableButtons ? 'button is-outlined disabled-btn' : 'button is-outlined'}
                      onClick={() => this.onClickButtonPlus('percent')}
                      >
                      <span className='icon'>
                        <i className='fa fa-plus' />
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div> : null
        }

        <div className='column is-narrow show-rows'>
          <Checkbox
            label={<span title='Ajustados'>
              <FormattedMessage
                id="adjustments.adjusted"
                defaultMessage={`Ajustados`}
              />
            </span>}
            handleCheckboxChange={(e, value) => this.showRows('showAdjusted', value)}
            checked={this.state.showAdjusted}
            disabled={this.state.waitingData}
          />
          <Checkbox
            label={<span title='No Ajustados'>
              <FormattedMessage
                id="adjustments.notAdjusted"
                defaultMessage={`No Ajustados`}
              />
            </span>}
            handleCheckboxChange={(e, value) => this.showRows('showNotAdjusted', value)}
            checked={this.state.showNotAdjusted}
            disabled={this.state.waitingData}
          />
        </div>
        <div className='column is-narrow'>
          <p style={{color: 'grey', paddingTop: '1.7rem', width: '.8rem'}}>
          {
            this.state.isLoadingButtons &&
            <span><FontAwesome className='fa-spin' name='spinner' /></span>
          }
          </p>
        </div>

        {this.state.selectedCheckboxes.size > 0 &&
          <div className='column products-selected'>
            <p>
            <span>{this.state.byWeek ? this.getProductsSelected() : this.state.selectedCheckboxes.size} </span>

              <FormattedMessage
                id="projects.selectedProducts"
                defaultMessage={`Productos Seleccionados`}
              />
            </p>
          </div>
        }

        <div className='column download-btn'>
          <button
            className={'button is-info ' + this.state.isDownloading}
            disabled={!!this.state.isDownloading}
            onClick={e => this.downloadReport()}>
            <span className='icon' title='Descargar'>
              <i className='fa fa-download' />
            </span>
          </button>
        </div>

      </div>
    )
  }

  getProductsSelected () {
    let p = _.groupBy(Array.from(this.state.selectedCheckboxes), 'productId')
    return _.size(p)
  }

  async onClickButtonPlus (type) {
    if(this.state.selectedCheckboxes.size === 0){
      this.notify(this.formatTitle('adjustments.noProducts'), 3000, toast.TYPE.INFO)
      return
    }

    this.setState({isLoadingButtons: ' is-loading'})
    let { selectedCheckboxes } = this.state
    selectedCheckboxes = Array.from(selectedCheckboxes)

    for (const row of selectedCheckboxes) {
      let toAdd = 0

      if (
        type === 'percent' &&
        !isNaN(this.state.percentage) &&
        parseInt(this.state.percentage) !== 0
      ){
        toAdd = row.lastAdjustment * 0.01 * parseInt(this.state.percentage)
        toAdd = Math.round(toAdd)
      } else if (
        type === 'quantity' &&
        !isNaN(this.state.quantity) &&
        parseInt(this.state.quantity) !== 0
      ) {
        toAdd = parseInt(this.state.quantity)
      } else {
        return
      }

      let adjustmentForDisplayAux = Math.round(row.adjustmentForDisplay)
      let newAdjustment = adjustmentForDisplayAux + toAdd

      row.lastLocalAdjustment = row.adjustmentForDisplay
      row.newAdjustment = newAdjustment
    }

    await this.handleChange(selectedCheckboxes)
    this.setState({isLoadingButtons: ''})
  }

  async onClickButtonMinus (type) {
    if (this.state.selectedCheckboxes.size === 0) {
      this.notify(this.formatTitle('adjustments.noProducts'), 3000, toast.TYPE.INFO)
      return
    }

    this.setState({isLoadingButtons: ' is-loading'})
    let { selectedCheckboxes } = this.state
    selectedCheckboxes = Array.from(selectedCheckboxes)

    for (const row of selectedCheckboxes) {
      let toAdd = 0

      if (
        type === 'percent' &&
        parseInt(this.state.percentage) !== 0 &&
        !isNaN(this.state.percentage)
      ) {
        toAdd = row.lastAdjustment * 0.01 * parseInt(this.state.percentage)
        toAdd = Math.round(toAdd)
      } else if (
        type === 'quantity' &&
        parseInt(this.state.quantity) !== 0 &&
        !isNaN(this.state.quantity)
      ) {
        toAdd = parseInt(this.state.quantity)
      } else {
        return
      }

      let adjustmentForDisplayAux = Math.round(row.adjustmentForDisplay)
      let newAdjustment = adjustmentForDisplayAux - toAdd
      row.lastLocalAdjustment = row.adjustmentForDisplay
      row.newAdjustment = newAdjustment
    }

    await this.handleChange(selectedCheckboxes)
    this.setState({isLoadingButtons: ''})
  }

  toggleButtons () {
    let disable = true

    if (this.state.selectedCheckboxes.size > 0)
      disable = false

    this.setState({
      disableButtons: disable
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
      if (isLimited && (currentRole === 'manager-level-1' || currentRole === 'manager-level-2')) {
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

    if (currentRole !== 'manager-level-1' && currentRole !== 'manager-level-2' && limitedRows.length) {
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

  async searchDatarows() {
    if (this.state.searchTerm === '') {
      let data = []

      if(this.state.showAdjusted){
        data = [
          ...data,
          ...this.state.dataRows.filter(item => {
            if (item.wasEdited) {
              return true
            }
            return false
          })
        ]
      }

      if (this.state.showNotAdjusted) {
        data = [
          ...data,
          ...this.state.dataRows.filter(item => {
            if (!item.wasEdited) {
              return true
            }
            return false
          })
        ]
      }

      this.setState({
        filteredData: data.length > 0 ? data : this.state.dataRows
      })
      return
    }

    const items = this.state.dataRows.filter((item) => {
      const regEx = new RegExp(this.state.searchTerm, 'gi')
      const searchStr = `${item.productName} ${item.productId} ${item.channel} ${item.salesCenter}`

      if (regEx.test(searchStr))
        return true

      return false
    })
    // .filter(function(item){ return item != null });
    let data = []

    if (this.state.showAdjusted) {
      data = [
        ...data,
        ...items.filter(item => {
          if (item.wasEdited) {
            return true
          }
          return false
        })
      ]
    }

    if (this.state.showNotAdjusted) {
      data = [
        ...data,
        ...items.filter(item => {
          if (!item.wasEdited) {
            return true
          }
          return false
        })
      ]
    }
    await this.setState({
      filteredData: data.length > 0 ? data : items
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

  setAlertMsg() {
    let ajuste = (this.state.generalAdjustment * 100)
    if (ajuste < 0){
      return <span>
        <FormattedMessage
          id="projects.unlimitedAdjustmentMode"
          defaultMessage={`Modo Ajuste Ilimitado`}
        />
      </span>
    }

    if (currentRole === 'consultor-level-3' || ajuste === 0) {
      return <span>
        <FormattedMessage
          id="adjustments.vizMode"
          defaultMessage={`Modo Visualización`}
        />
      </span>
    } else {
      return <span>
        <FormattedMessage
          id="projects.adjustmentMode"
          defaultMessage={`Modo Ajuste`}
        /> {this.state.generalAdjustment * 100} % <FormattedMessage
          id="projects.permitted"
          defaultMessage={`permitido`}
        />
      </span>
    }
  }

  async getSalesTable() {
    let url = '/app/datasets/sales/' + this.props.project.activeDataset.uuid
    let cycle = this.state.filters.cycles.find(item => {
      return item.cycle === this.state.formData.cycle
    })

    try {
      let res = await api.post(url, {
        ...this.state.formData,
        cycle: cycle.uuid,
        prices: this.state.prices
      })

      if (res.data) {
        const prevData = (res.previous || [])
        let totalPrediction = 0
        let totalAdjustment = 0
        let totalPrevSale = 0

        for (let i = 0; i < res.data.length; i++) {
          const element = res.data[i];
          totalAdjustment += element.adjustment
          totalPrediction += element.prediction
        }

        prevData.forEach(item => {
          totalPrevSale += item.sale
        })

        this.setState({
          prevData,
          totalPrevSale,
          salesTable: res.data,
          totalAdjustment: totalAdjustment,
          totalPrediction: totalPrediction,
          reloadGraph: true,
          noSalesData: res.data.length === 0 ? this.formatTitle('dashboard.productEmptyMsg') : ''
        }, () => {
            this.setState({
              reloadGraph: false
            })
        })
      }
    } catch (e) {
      this.notify('Error ' + e.message, 5000, toast.TYPE.ERROR)
      this.setState({
        noSalesData: e.message + ', ' + this.formatTitle('dashboard.try')
      })
    }
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

  async downloadReport () {
    this.setState({isDownloading: ' is-loading'})

    let min
    let max
    let url = '/app/rows/download/' + this.props.project.uuid

    let cycle = this.state.filters.cycles.find(item => {
      return item.cycle === this.state.formData.cycle
    })

    min = cycle.dateStart
    max = cycle.dateEnd

    try {
      let formFilters = Object.assign({}, this.state.formData)
      delete formFilters.cycle

      let res = await api.post(url, {
        start_date: moment(min).format('YYYY-MM-DD'),
        end_date:  moment(max).format('YYYY-MM-DD'),
        showAdjusted: this.state.showAdjusted,
        showNotAdjusted: this.state.showNotAdjusted,
        searchTerm: this.state.searchTerm,
        ...formFilters
      })

      var blob = new Blob(res.split(''), {type: 'text/csv;charset=utf-8'});
      FileSaver.saveAs(blob, `Proyecto ${this.props.project.name}.csv`);
      this.setState({isDownloading: ''})
      this.notify('¡' + this.formatTitle('adjustments.reportSuccess') + '!', 5000, toast.TYPE.SUCCESS)
    } catch (e) {
      this.notify('Error ' + e.message, 5000, toast.TYPE.ERROR)

      this.setState({
        isLoading: '',
        noSalesData: e.message + ', ' + this.formatTitle('dashboard.try'),
        isDownloading: ''
      })
    }
  }

  showByWeek = () => {
    this.uncheckAll()
    this.setState({
      byWeek: true
    })
  }

  showByProduct = () => {
    this.uncheckAll()
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

  makeFilters() {
    let filters = []
    let zeroFilters = 0
    let numfilters = 0
    const unwantedList = [
      'cycles',
      'channels',
      'salesCenters',
      'categories',
      'products',
      'producto',
      'precio'
    ]
    for (const key in this.state.filters) {
      if (this.state.filters.hasOwnProperty(key)) {
        const element = this.state.filters[key];

        if (unwantedList.includes(key)) {
          continue
        }

        numfilters++

        if(element.length === 1){
          filters.push(
            <div key={key} className='channel'>
              <span className='is-capitalized'>{this.findName(key)}: </span>
              <span className='has-text-weight-bold is-capitalized'>{element[0].name}
              </span>
            </div>
          )
        }
        else if(element.length > 1){
        filters.push(
          <div key={key} className='column is-narrow'>
            <Select
              label={this.findName(key)}
              name={key}
              value={this.state.formData[key]}
              optionValue='uuid'
              optionName='name'
              options={element}
              onChange={(name, value) => { this.filterChangeHandler(name, value) }}
            />
          </div>
        )
        }
        else if (element.length === 0){
          zeroFilters++
        }
      }
    }

    if(zeroFilters === numfilters){
      let msg = this.formatTitle('adjustments.noInfo')

      if (currentRole === 'manager-level-1' || currentRole === 'manager-level-2'){
        msg = this.formatTitle('adjustments.nofilters')
      }

      this.setState({
        error: true,
        filtersLoading: false,
        errorMessage: msg
      })
    }

    return filters
  }

  showBy(prices) {
    this.setState({ prices },
      () => {
        this.getSalesTable()
      })
  }

  getCallback() {
    if (this.state.prices) {
      return function (label, index, labels) {
        return '$' + label.toFixed(2).replace(/./g, (c, i, a) => {
          return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
        })
      }
    }
    else {
      return function (label, index, labels) {
        return label.toFixed(2).replace(/./g, (c, i, a) => {
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
        let yVal = '$' + tooltipItem.yLabel.toFixed(2).replace(/./g, (c, i, a) => {
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
        let yVal = tooltipItem.yLabel.toFixed(2).replace(/./g, (c, i, a) => {
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
    let banner
    if (this.state.error) {
      return (
        <div className='section columns'>
          <div className='column'>
            <article className="message is-danger">
              <div className="message-header">
                <p>Error</p>
              </div>
              <div className="message-body">
                {this.state.errorMessage}
              </div>
            </article>
          </div>
        </div>
      )
    }

    if (this.props.adjustmentML1){
      banner =  (
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
    }

    const dataSetsNumber = this.props.project.datasets.length
    let adviseContent = null
    if (dataSetsNumber) {
      adviseContent =
        <div>
          <FormattedMessage
            id="projects.datasetConfigMsg1"
            defaultMessage={`Debes terminar de configurar al menos un dataset`}
          />
        </div>
    } else {
      adviseContent =
        <div>
          <FormattedMessage
            id="projects.adjustmentInfo"
            defaultMessage={`Se debe agregar al menos un dataset para poder generar ajustes.`}
          />
        </div>
    }

    if (this.props.project.status === 'empty') {
      return (
        <div className='section columns'>
          <div className='column'>
            <article className='message is-warning'>
              <div className='message-header'>
                <p>
                  <FormattedMessage
                    id="projects.alertMsg"
                    defaultMessage={`Atención`}
                  />
                </p>
              </div>
              <div className='message-body has-text-centered is-size-5'>
                {adviseContent}
              </div>
            </article>
          </div>
        </div>
      )
    }

    if (this.props.project.status === 'processing') {
      return (
        <div className='section has-text-centered subtitle has-text-primary'>
          <FormattedMessage
            id="projects.processingMsg"
            defaultMessage={`Se están obteniendo las filas para ajuste, en un momento más las podrá consultar.`}
          />
          <Loader />
        </div>
      )
    }

    if (this.props.project.status === 'cloning') {
      return (
        <div className='section has-text-centered subtitle has-text-primary'>
          <FormattedMessage
            id="projects.cloningMsg"
            defaultMessage={`Se esta procesando el clon, favor de esperar...`}
          />
          <Loader />
        </div>
      )
    }

    if (this.props.project.status === 'conciliating') {
      return (
        <div className='section has-text-centered subtitle has-text-primary'>
          <FormattedMessage
            id="projects.cloningMsg"
            defaultMessage={`Se está conciliando el dataset, espere por favor.`}
          />
          <Loader />
        </div>
      )
    }

    if (this.props.project.status === 'pendingRows') {
      return (
        <div className='section has-text-centered subtitle has-text-primary'>
          <FormattedMessage
            id="projects.pendingRowsMsg"
            defaultMessage={`Se está conciliando el dataset, espere por favor.`}
          />
          <Loader />
        </div>
      )
    }

    if (!this.state.filters.cycles.length > 0 && this.state.filtersLoaded) {
      return (
        <div className='section has-text-centered subtitle has-text-primary'>
          <FormattedMessage
            id="projects.emptyDataRows"
            defaultMessage={`El proyecto no continene data rows`}
          />
        </div>
      )
    }

    if (!this.state.filters.cycles.length > 0 && !this.state.filtersLoaded) {
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
        data: this.state.salesTable.map((item, key) => { return item.prediction.toFixed(2) })
      },
      {
        label: this.formatTitle('tables.colAdjustment'),
        color: '#30C6CC',
        data: this.state.salesTable.map((item, key) => { return item.adjustment.toFixed(2) })
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
            {this.state.filters &&
              this.makeFilters()
            }

            <div className='level-right'>
              <div className='level-item'>
                <div className='field'>

                  <div className="is-clearfix">
                    <label className='label is-pulled-left'>
                      <FormattedMessage
                        id="dashboard.initialMonth"
                        defaultMessage={`Mes inicial`}
                      />
                    </label>
                    <label className='label is-pulled-right'>
                      <FormattedMessage
                        id="dashboard.lastMonth"
                        defaultMessage={`Mes final`}
                      />
                    </label>
                  </div>

                  <div className='field is-grouped control'>
                    <DatePicker
                      minDate={this.state.minDate}
                      maxDate={this.state.maxDate}
                      initialStartDate={this.state.startDate}
                      initialEndDate={this.state.endDate}
                      onChange={({ startDate, endDate }) => this.onDatesChange({ startDate, endDate })}
                    />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>


        <div className='level indicators deep-shadow'>
          <div className='level-item has-text-centered'>
            <div>
              <h1>
                <FormattedMessage
                  id="adjustments.indicators"
                  defaultMessage={`Indicadores`}
                />
              </h1>
            </div>
          </div>
          <div className={this.state.indicators === 'indicators-hide' ?
          'level-item has-text-centered has-text-info' :
          'level-item has-text-centered has-text-info disapear'}
          >
            <div>
              <p className='has-text-weight-semibold'>
                <FormattedMessage
                  id="tables.colForecast"
                  defaultMessage={`Predicción`}
                />
              </p>
              <h1 className='num has-text-weight-bold'>
                {this.state.totalPrediction ?
                  this.state.prices ?
                    '$' + this.state.totalPrediction.toFixed(2).replace(/./g, (c, i, a) => {
                      return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
                    })
                    :
                    this.state.totalPrediction.toFixed(2).replace(/./g, (c, i, a) => {
                      return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
                    })
                  : null
                }
              </h1>
            </div>
          </div>

          <div className={this.state.indicators === 'indicators-hide' ?
          'level-item has-text-centered has-text-teal' :
          'level-item has-text-centered has-text-teal disapear'}>
            <div>
              <p className='has-text-weight-semibold'>
                <FormattedMessage
                  id="tables.colAdjustment"
                  defaultMessage={`Ajuste`}
                />
              </p>
              <h1 className='num has-text-weight-bold'>
                {this.state.totalAdjustment ?
                  this.state.prices ?
                    '$' + this.state.totalAdjustment.toFixed(2).replace(/./g, (c, i, a) => {
                      return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
                    })
                    :
                    this.state.totalAdjustment.toFixed(2).replace(/./g, (c, i, a) => {
                      return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
                    })
                  : null
                }
              </h1>
            </div>
          </div>

          <div className={
            this.state.indicators === 'indicators-hide' ?
            'level-item has-text-centered has-text-danger'
            : 'level-item has-text-centered has-text-danger disapear'
            }
          >
            <div>
              <p className='has-text-weight-semibold'>
                <FormattedMessage
                  id="tables.colLast"
                  defaultMessage={`Venta año anterior`}
                />
              </p>
              <h1 className='num has-text-weight-bold'>
                {this.state.totalPrevSale ?
                  this.state.prices ?
                    '$' + this.state.totalPrevSale.toFixed(2).replace(/./g, (c, i, a) => {
                      return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
                    })
                    :
                    this.state.totalPrevSale.toFixed(2).replace(/./g, (c, i, a) => {
                      return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
                    })
                  : null
                }
              </h1>
            </div>
          </div>

          <div className={this.state.indicators === 'indicators-hide' ?
            'level-item has-text-centered' : ' level-item has-text-centered no-border'}>
            <div>
              <img src='/app/public/img/grafica.png'
              className={this.state.indicators === 'indicators-hide' ?
              '' : 'disapear'}/>
              <a className='collapse-btn' onClick={this.toggleIndicators}>
                <span className='icon is-large'>
                  <i className={this.state.indicators === 'indicators-show' ? 'fa fa-2x fa-caret-up' : 'fa fa-2x fa-caret-down'}></i>
                </span>
              </a>
            </div>
          </div>
        </div>


        <div className={'indicators-collapse ' + this.state.indicators}>
          <div className='section level'>
              <div className='level-item'>
                <div className="field">
                  <label className='label'>
                    <FormattedMessage
                      id="dashboard.showBy"
                      defaultMessage={`Mostrar por: `}
                    />:
                  </label>
                  <div className='control'>

                    <div className="field is-grouped">
                      <div className='control'>

                        <input
                          className="is-checkradio is-info is-small"
                          id='showByquantityAd'
                          type="radio"
                          name='showByAd'
                          checked={!this.state.prices}
                          disabled={this.state.waitingData}
                          onChange={() => this.showBy(false)} />
                        <label htmlFor='showByquantityAd'>
                          <span title='Cantidad'>
                            <FormattedMessage
                              id="dashboard.units"
                              defaultMessage={`Cantidad`}
                            />
                          </span>
                        </label>
                      </div>

                      <div className='control'>
                        <input
                          className="is-checkradio is-info is-small"
                          id='showBypriceAd'
                          type="radio"
                          name='showByAd'
                          checked={this.state.prices}
                          disabled={this.state.waitingData}
                          onChange={() => this.showBy(true)} />
                        <label htmlFor='showBypriceAd'>
                          <span title='Precio'>
                            <FormattedMessage
                              id="dashboard.price"
                              defaultMessage={`Precio`}
                            />
                          </span>
                        </label>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
          </div>
          <div className='columns'>
            <div className='column is-6-desktop is-4-widescreen is-5-fullhd is-offset-1-fullhd is-offset-1-desktop'>
              <div className='panel sales-table'>
                <div className='panel-heading'>
                  <h2 className='is-capitalized'>
                    <FormattedMessage
                      id="adjustments.total"
                      defaultMessage={`Totales`}
                    /> {this.getCycleName()}
                  </h2>
                </div>
                <div className='panel-block'>
                  {
                    currentRole !== 'consultor-level-3' &&
                      this.state.salesTable.length > 0 ?
                      <table className='table is-fullwidth is-hoverable'>
                        <thead>
                          <tr>
                            <th className='has-text-centered'>
                              <FormattedMessage
                                id="adjustments.period"
                                defaultMessage={`Periodo`}
                              />
                            </th>
                            <th className='has-text-info has-text-centered'>
                              <FormattedMessage
                                id="tables.colForecast"
                                defaultMessage={`Predicción`}
                              />
                            </th>
                            <th className='has-text-teal has-text-centered'>
                              <FormattedMessage
                                id="tables.colAdjustment"
                                defaultMessage={`Ajustes`}
                              />
                            </th>
                            <th className='has-text-danger has-text-centered'>
                              <FormattedMessage
                                id="tables.colLast"
                                defaultMessage={`Venta año anterior`}
                              />
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {this.state.salesTable.map((item, key) => {
                            return (
                              <tr key={key}>
                                <td className='has-text-centered'>
                                  {item.period[0]}
                                </td>
                                <td className='has-text-centered'>
                                  {this.state.prices && '$'} {item.prediction.toFixed(2).replace(/./g, (c, i, a) => {
                                    return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
                                  })}
                                </td>
                                <td className='has-text-centered'>
                                  {this.state.prices && '$'} {item.adjustment.toFixed(2).replace(/./g, (c, i, a) => {
                                    return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
                                  })}
                                </td>
                                <td className='has-text-centered'>
                                  {this.state.prices && '$'} {((this.state.prevData[key] || {}).sale || 0).toFixed(2).replace(/./g, (c, i, a) => {
                                    return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
                                  })}
                                </td>
                              </tr>
                            )
                          })
                          }

                          <tr className='totals'>
                            <th className='has-text-centered'>
                              <FormattedMessage
                                id="adjustments.total"
                                defaultMessage={`Total`}
                              />
                            </th>
                            <th className='has-text-info has-text-centered'>
                              {this.state.prices && '$'} {this.state.totalPrediction.toFixed(2).replace(/./g, (c, i, a) => {
                                return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
                              })}
                            </th>
                            <th className='has-text-teal has-text-centered'>
                              {this.state.prices && '$'} {this.state.totalAdjustment.toFixed(2).replace(/./g, (c, i, a) => {
                                return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
                              })}
                            </th>
                            <th className='has-text-danger has-text-centered'>
                              {this.state.prices && '$'} {this.state.totalPrevSale.toFixed(2).replace(/./g, (c, i, a) => {
                                return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
                              })}
                            </th>
                          </tr>
                        </tbody>
                      </table>
                      :
                      this.loadTable()
                  }
                </div>
              </div>
            </div>

            <div className='column is-5-tablet is-5-desktop is-4-widescreen is-offset-1-widescreen is-narrow-fullhd is-offset-1-fullhd'>
              <div className='panel sales-graph'>
                <div className='panel-heading'>
                  <h2 className='is-capitalized'>
                    <FormattedMessage
                      id="adjustments.report"
                      defaultMessage={`Reporte`}
                    /> {this.getCycleName()}
                  </h2>
                </div>
                <div className='panel-block'>
                  {
                    currentRole !== 'consultor-level-3' &&
                      this.state.salesTable.length > 0 ?
                      <Graph
                        data={graphData}
                        maintainAspectRatio={false}
                        responsive={true}
                        reloadGraph={this.state.reloadGraph}
                        labels={this.state.salesTable.map((item, key) => { return this.formatTitle('adjustments.period') + ' ' + item.period[0] })}
                        tooltips={{
                          mode: 'index',
                          intersect: true,
                          titleFontFamily: "'Roboto', sans-serif",
                          bodyFontFamily: "'Roboto', sans-serif",
                          bodyFontStyle: 'bold',
                          callbacks: {
                            label: tooltipCallback
                          }
                        }}
                        scales={
                          {
                            xAxes:[{
                              gridLines: {
                                display: false
                              }
                            }],
                            yAxes: [
                              {
                                gridLines: {
                                  display: false
                                },
                                ticks: {
                                  callback: labelCallback,
                                  fontSize: 11
                                },
                                display: true
                              }
                            ]
                          }
                        }
                      />
                      :
                      this.loadTable()
                  }
                </div>
              </div>
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
                  {this.getModifyButtons()}
                </section>
                  {
                    !this.state.byWeek ?

                      this.state.filteredData && this.state.filteredData.length > 0 ?

                        <ProductTable
                          show={this.showByWeek}
                          currentRole={currentRole}
                          data={this.state.filteredData}
                          checkAll={this.checkAll}
                          toggleCheckbox={this.toggleCheckbox}
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
                          toggleCheckbox={this.toggleCheckbox}
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
