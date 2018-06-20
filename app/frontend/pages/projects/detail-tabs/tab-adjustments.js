import React, { Component } from 'react'
import FontAwesome from 'react-fontawesome'
import moment from 'moment'
import _ from 'lodash'
import tree from '~core/tree'
import { toast } from 'react-toastify'

import api from '~base/api'
import Loader from '~base/components/spinner'
import Editable from '~base/components/base-editable'
import Checkbox from '~base/components/base-checkbox'

import WeekTable from './week-table'
import ProductTable from './product-table'
import Select from './select'
import Graph from '~base/components/graph'


const FileSaver = require('file-saver')

var currentRole
moment.locale('es')

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
      errorMessage: ''
    }

    currentRole = tree.get('user').currentRole.slug
    this.rules = this.props.rules
    this.toastId = null
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

        let cycles = _.orderBy(res.cycles, 'cycle', 'asc')

        if (currentRole === 'manager-level-2') {
          cycles = cycles.map((item, key) => {
            return item = { ...item, adjustmentRange: this.rules.rangesLvl2[key], name: moment.utc(item.dateStart).format('MMMM') }
          })
        }
        else {
          cycles = cycles.map((item, key) => {
            return item = { ...item, adjustmentRange: this.rules.ranges[key], name: moment.utc(item.dateStart).format('MMMM') }
          })
        }
        let formData = this.state.formData
        formData.cycle = cycles[0].cycle

        if (res.salesCenters.length > 0) {
          formData.salesCenter = res.salesCenters[0].uuid
        }

        if (res.channels.length === 1) {
          formData.channel = res.channels[0].uuid
        }

        for (let fil of Object.keys(res)) {
          if (fil === 'cycles') continue

          res[fil] = _.orderBy(res[fil], 'name')
        }

        this.setState({
          filters: {
            ...this.state.filters,
            ...res,
            cycles: cycles,
            categories: this.getCategory(res.products),
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
    console.log(this.state.filters)
  }

  getCategory(products) {
    const categories = new Set()
    products.map((item) => {
      if (item.category && !categories.has(item.category)) {
        categories.add(item.category)
      }
    })
    return Array.from(categories)
  }

  async filterChangeHandler (name, value) {
    if(name === 'cycle'){
      var cycle = this.state.filters.cycles.find(item => {
        return item.number === value
      })

      this.setState({
        filters: {
          ...this.state.filters
        }
      })
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
      this.notify('¡Se debe filtrar por ciclo!', 5000, toast.TYPE.ERROR)
      return
    }

    var cycle = this.state.filters.cycles.find(item => {
      return item.cycle === this.state.formData.cycle
    })

    this.setState({
      isLoading: ' is-loading',
      isFiltered: false,
      generalAdjustment: this.getAdjustment(cycle.adjustmentRange),
      salesTable: [],
      noSalesData: ''
    })

    const url = '/app/rows/dataset/'
    try{
      let data = await api.get(
        url + this.props.project.activeDataset.uuid,
        {
          ...this.state.formData,
          cycle: cycle.uuid
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

  getModifyButtons () {
    return (
      <div className='columns'>

        <div className='column is-narrow'>
          <div className='field'>
            {currentRole !== 'consultor-level-3' ?
              <label className='label'>Búsqueda general</label>:
              null
            }
            <div className='control has-icons-right'>
              <input
                className='input input-search'
                type='text'
                value={this.state.searchTerm}
                onChange={this.searchOnChange} placeholder='Buscar' />

              <span className='icon is-small is-right'>
                <i className='fa fa-search fa-xs'></i>
              </span>
            </div>
          </div>
        </div>
        {currentRole !== 'consultor-level-3' ?
          <div className='column is-narrow'>
            <div className='modifier'>
              <div className='field'>
                <label className='label'>Modificar por cantidad</label>
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

        {currentRole !== 'consultor-level-3' ?
          <div className='column is-narrow'>
            <div className='modifier'>
              <div className='field'>
                <label className='label'>Modificar por porcentaje</label>
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
            Productos Seleccionados
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
      this.notify('No tienes productos seleccionados', 3000, toast.TYPE.INFO)
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
      this.notify('No tienes productos seleccionados', 3000, toast.TYPE.INFO)
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
      if (isLimited && currentRole === 'manager-level-1') {
        this.notify(
          (<p>
            <span className='icon'>
              <i className='fa fa-warning fa-lg' />
            </span>
            ¡Debes pedir una solicitud de ajuste haciendo clic sobre el ícono rojo o el botón finalizar!
          </p>),
          5000,
          toast.TYPE.WARNING
        )
      } else {
        if(currentRole === 'manager-level-2' && isLimited){
          this.notify('¡Ajustes fuera de rango guardados!', 5000, toast.TYPE.WARNING)
        }
        else{
          this.notify('¡Ajustes guardados!', 5000, toast.TYPE.INFO)
        }
      }
      this.props.pendingDataRows(pendingDataRows)

      await this.updateSalesTable(obj)

    } catch (e) {
      this.notify('Ocurrio un error ' + e.message, 5000, toast.TYPE.ERROR)

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

  async searchDatarows() {
    if (this.state.searchTerm === '') {
      this.setState({
        filteredData: this.state.dataRows
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

    await this.setState({
      filteredData: items
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
      return <span>Modo Ajuste Ilimitado</span>
    }

    if (currentRole === 'consultor-level-3' || ajuste === 0) {
      return <span>Modo Visualización</span>
    } else {
      return <span>Modo Ajuste {this.state.generalAdjustment * 100} % permitido</span>
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
        cycle: cycle.uuid
      })

      if (res.data) {
        let totalPrediction = 0
        let totalAdjustment = 0

        for (let i = 0; i < res.data.length; i++) {
          const element = res.data[i];
          totalAdjustment += element.adjustment
          totalPrediction += element.prediction
        }

        this.setState({
          salesTable: res.data,
          totalAdjustment: totalAdjustment,
          totalPrediction: totalPrediction
        })
      }
    } catch (e) {
      this.notify('Error ' + e.message, 5000, toast.TYPE.ERROR)
      this.setState({
        noSalesData: e.message + ', intente más tarde'
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

  async downloadReport () {
    if (!this.state.formData.salesCenter) {
      this.notify('¡Es necesario filtrar por centro de venta para obtener un reporte!', 5000, toast.TYPE.ERROR)

      return
    }

    this.setState({isDownloading: ' is-loading'})

    let min
    let max
    let url = '/app/rows/download/' + this.props.project.uuid
    var period = this.state.filters.periods.find(item => {
      return item.number === this.state.formData.period
    })

    this.state.filters.dates.map((date) => {
      if (period.maxSemana === date.week) {
        max = date.dateEnd
      }
      if (period.minSemana === date.week) {
        min = date.dateStart
      }
    })

    try {
      let res = await api.post(url, {
        start_date: moment(min).format('YYYY-MM-DD'),
        end_date:  moment(max).format('YYYY-MM-DD'),
        salesCenter: this.state.formData.salesCenter,
        channel: this.state.formData.channel,
        product: this.state.formData.product,
        category: this.state.formData.category
      })

      var blob = new Blob(res.split(''), {type: 'text/csv;charset=utf-8'});
      FileSaver.saveAs(blob, `Proyecto ${this.props.project.name}.csv`);
      this.setState({isDownloading: ''})
      this.notify('¡Se ha generado el reporte correctamente!', 5000, toast.TYPE.SUCCESS)
    } catch (e) {
      this.notify('Error ' + e.message, 5000, toast.TYPE.ERROR)

      this.setState({
        isLoading: '',
        noSalesData: e.message + ', intente más tarde',
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

  findName = (name) => {
    let find = ''
    this.rules.catalogs.map(item => {
      if(item.slug === name){
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
          key === 'products' ||
          key === 'producto') {
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
                <p>Información</p>
              </div>
              <div className="message-body">
                ¡Sus ajustes se han guardado con éxito!
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
          Debes terminar de configurar al menos un
          <strong> dataset </strong>
        </div>
    } else {
      adviseContent =
        <div>
          Se debe agregar al menos un
          <strong> dataset </strong> para poder generar ajustes.
        </div>
    }

    if (this.props.project.status === 'empty') {
      return (
        <div className='section columns'>
          <div className='column'>
            <article className='message is-warning'>
              <div className='message-header'>
                <p>Atención</p>
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
          Se están obteniendo las filas para ajuste, en un momento más las podrá consultar.
          <Loader />
        </div>
      )
    }

    if (this.props.project.status === 'cloning') {
      return (
        <div className='section has-text-centered subtitle has-text-primary'>
          Se esta procesando el clon, favor de esperar...
          <Loader />
        </div>
      )
    }

    if (this.props.project.status === 'conciliating') {
      return (
        <div className='section has-text-centered subtitle has-text-primary'>
          Se está conciliando el dataset, espere por favor.
          <Loader />
        </div>
      )
    }

    if (this.props.project.status === 'pendingRows') {
      return (
        <div className='section has-text-centered subtitle has-text-primary'>
          Se está preparando al proyecto para generar un dataset de ajuste, espere por favor.
          <Loader />
        </div>
      )
    }

    if (!this.state.filters.cycles.length > 0 && this.state.filtersLoaded) {
      return (
        <div className='section has-text-centered subtitle has-text-primary'>
          El proyecto no continene data rows
        </div>
      )
    }

    if (!this.state.filters.cycles.length > 0 && !this.state.filtersLoaded) {
      return (
        <div className='section has-text-centered subtitle has-text-primary'>
          Cargando, un momento por favor
          <Loader />
        </div>
      )
    }

    const graphData = [
      {
        label: 'Predicción',
        color: '#187FE6',
        data: this.state.salesTable.map((item, key) => { return item.prediction.toFixed(2) })
      },
      {
        label: 'Ajuste',
        color: '#30C6CC',
        data: this.state.salesTable.map((item, key) => { return item.adjustment.toFixed(2) })
      }
    ]

    return (
      <div>
        {banner}
        <div className='section level selects'>
          <div className='level-left'>
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
            
          {this.state.filters &&
            this.makeFilters()
          }
          </div>
        </div>

        <div className='level indicators deep-shadow'>
          <div className='level-item has-text-centered'>
            <div>
              <h1>Indicadores</h1>
            </div>
          </div>
          <div className={this.state.indicators === 'indicators-hide' ?
          'level-item has-text-centered has-text-info' :
          'level-item has-text-centered has-text-info disapear'}
          >
            <div>
              <p className='has-text-weight-semibold'>Predicción</p>
              <h1 className='num has-text-weight-bold'>
                {this.state.totalPrediction ?
                '$' + this.state.totalPrediction.toFixed(2).replace(/./g, (c, i, a) => {
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
              <p className='has-text-weight-semibold'>Ajuste</p>
              <h1 className='num has-text-weight-bold'>
                {this.state.totalAdjustment ?
                '$' + this.state.totalAdjustment.toFixed(2).replace(/./g, (c, i, a) => {
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
          <div className='columns'>
            <div className='column is-5-desktop is-4-widescreen is-4-fullhd is-offset-1-fullhd is-offset-1-desktop'>
              <div className='panel sales-table'>
                <div className='panel-heading'>
                  <h2 className='is-capitalized'>Totales {this.getCycleName()}</h2>
                </div>
                <div className='panel-block'>
                  {
                    currentRole !== 'consultor-level-3' &&
                      this.state.salesTable.length > 0 ?
                      <table className='table is-fullwidth is-hoverable'>
                        <thead>
                          <tr>
                            <th className='has-text-centered'>Periodo</th>
                            <th className='has-text-info has-text-centered'>Predicción</th>
                            <th className='has-text-teal has-text-centered'>Ajuste</th>
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
                                  $ {item.prediction.toFixed(2).replace(/./g, (c, i, a) => {
                                    return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
                                  })}
                                </td>
                                <td className='has-text-centered'>
                                  $ {item.adjustment.toFixed(2).replace(/./g, (c, i, a) => {
                                    return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
                                  })}
                                </td>
                              </tr>
                            )
                          })
                          }

                          <tr className='totals'>
                            <th className='has-text-centered'>
                              Total
                            </th>
                            <th className='has-text-info has-text-centered'>
                              $ {this.state.totalPrediction.toFixed(2).replace(/./g, (c, i, a) => {
                                return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
                              })}
                            </th>
                            <th className='has-text-teal has-text-centered'>
                              $ {this.state.totalAdjustment.toFixed(2).replace(/./g, (c, i, a) => {
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

            <div className='column is-5-desktop is-4-widescreen is-offset-1-widescreen is-narrow-fullhd is-offset-1-fullhd'>
              <div className='panel sales-graph'>
                <div className='panel-heading'>
                  <h2 className='is-capitalized'>Reporte {this.getCycleName()}</h2>
                </div>
                <div className='panel-block'>
                  {
                    currentRole !== 'consultor-level-3' &&
                      this.state.salesTable.length > 0 ?
                      <Graph
                        data={graphData}
                        maintainAspectRatio={false}
                        responsive={true}
                        labels={this.state.salesTable.map((item, key) => { return 'Periodo ' + item.period[0] })}
                        tooltips={{
                          mode: 'index',
                          intersect: true,
                          titleFontFamily: "'Roboto', sans-serif",
                          bodyFontFamily: "'Roboto', sans-serif",
                          bodyFontStyle: 'bold',
                          callbacks: {
                            label: function (tooltipItem, data) {
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
                                  callback: function (label, index, labels) {
                                    return '$' + label.toFixed(2).replace(/./g, (c, i, a) => {
                                      return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
                                    })
                                  },
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
                Cargando, un momento por favor
                <Loader />
              </div>
            : <div>
              { this.state.dataRows.length > 0 ?
                <div>
                  <section className='section'>
                  <h1 className='period-info'>
                    <span className='has-text-weight-semibold is-capitalized'>Ciclo {this.getCycleName()} - </span>
                    <span className='has-text-info has-text-weight-semibold'> {this.setAlertMsg()}</span>
                  </h1>
                  {this.getModifyButtons()}
                </section>
                {
                  !this.state.byWeek ?

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
                }
              </div>
              :
                <div className='section has-text-centered subtitle has-text-primary'>
                  No hay información
                </div>
              }
            </div>
          }
        </section>
      </div>
    )
  }
}

export default TabAdjustment
