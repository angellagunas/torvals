import React, { Component } from 'react'
import FontAwesome from 'react-fontawesome'
import moment from 'moment'
import api from '~base/api'
import _ from 'lodash'
import tree from '~core/tree'
import { toast } from 'react-toastify'
import Loader from '~base/components/spinner'

import CreateAdjustmentRequest from '../../forecasts/create-adjustmentRequest'
import Checkbox from '~base/components/base-checkbox'
import Editable from '~base/components/base-editable'

import WeekTable from './week-table'
import ProductTable from './product-table'

import Select from './select'

import Graph from './graph'

var currentRole
moment.locale('es')

class TabAdjustment extends Component {
  constructor (props) {
    super(props)
    this.state = {
      dataRows: [],
      isFiltered: false,
      filtersLoaded: false,
      isLoading: '',
      modified: 0,
      pending: 0,
      filters: {
        channels: [],
        products: [],
        salesCenters: [],
        semanasBimbo: [],
        categories: [],
        filteredSemanasBimbo: []
      },
      formData: {
        period: 1
      },
      disableButtons: true,
      selectedCheckboxes: new Set(),
      searchTerm: '',
      isConciliating: '',
      isDownloading: '',
      generalAdjustment: 0.1,
      salesTable: [],
      noSalesData: '',
      byWeek: false,
      indicators: 'indicators-hide',
      quantity: 0,
      percentage: 0
    }

    currentRole = tree.get('user').currentRole.slug
    this.interval = null
  }

  componentWillMount () {
    this.getFilters()
    this.getModifiedCount()

    if (currentRole !== 'manager-level-3') {
      this.interval = setInterval(() => { this.getModifiedCount() }, 30000)
    }
  }

  componentWillUnmount () {
    clearInterval(this.interval)
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.project.status === 'adjustment' && this.props.project.status !== 'adjustment') {
      this.clearSearch()
      this.getFilters()
    }

    if (currentRole !== 'manager-level-3' && this.props.project.status == 'adjustment' && !this.interval) {
      this.interval = setInterval(() => { this.getModifiedCount() }, 30000)
    }
  }

  async getFilters() {
    if (this.props.project.activeDataset) {
      const url = '/app/rows/filters/dataset/'
      let res = await api.get(url + this.props.project.activeDataset.uuid)

      var maxDate = moment.utc(this.props.project.activeDataset.dateMax)
      var maxSemana = res.semanasBimbo[res.semanasBimbo.length - 1]
      var dates = []
      var periods = []
      var adjustments = {
        '1': 10,
        '2': 20,
        '3': 30,
        '4': -1
      }

      if (this.props.project.businessRules && this.props.project.businessRules.adjustments) {
        adjustments = this.props.project.businessRules.adjustments
      }

      for (var i = 0; i < 16; i++) {
        dates.push(moment(maxDate.format()))
        maxDate.subtract(7, 'days')
      }

      dates.reverse()

      var period4 = dates.slice(12,16)
      var period3 = dates.slice(8,12)
      var period2 = dates.slice(4,8)
      var period1 = dates.slice(0,4)

      periods.push({
        number: 4,
        name: `Periodo ${period4[0].format('MMMM')}`,
        adjustment: adjustments['4'],
        maxSemana: maxSemana,
        minSemana: maxSemana - 3
      })
      maxSemana = maxSemana - 4

      periods.push({
        number: 3,
        name: `Periodo ${period3[0].format('MMMM')}`,
        adjustment: adjustments['3']/100,
        maxSemana: maxSemana,
        minSemana: maxSemana - 3
      })
      maxSemana = maxSemana - 4

      periods.push({
        number: 2,
        name: `Periodo ${period2[0].format('MMMM')}`,
        adjustment: adjustments['2']/100,
        maxSemana: maxSemana,
        minSemana: maxSemana - 3
      })
      maxSemana = maxSemana - 4

      periods.push({
        number: 1,
        name: `Periodo ${period1[0].format('MMMM')}`,
        adjustment: adjustments['1']/100,
        maxSemana: maxSemana,
        minSemana: maxSemana - 3
      })

      var filteredSemanasBimbo = Array.from(Array(4), (_,x) => maxSemana - x).reverse()

      var formData = this.state.formData

      if (res.salesCenters.length === 1) {
        formData.salesCenter = res.salesCenters[0].uuid
      }

      if (res.channels.length === 1) {
        formData.channel = res.channels[0].uuid
      } 

      this.setState({
        filters: {
          channels: res.channels,
          products: res.products,
          salesCenters: res.salesCenters,
          semanasBimbo: res.semanasBimbo,
          filteredSemanasBimbo: filteredSemanasBimbo,
          dates: res.dates,
          categories: this.getCategory(res.products),
          periods: periods
        },
        formData: formData,
        filtersLoaded: true
      }, () => {
        this.getDataRows()
      })

       
    }
  }

  async getModifiedCount () {
    if (this.props.project.activeDataset) {
      const url = '/app/rows/modified/dataset/'
      let res = await api.get(url + this.props.project.activeDataset.uuid)

      if (
          res.data.pending !== this.state.pending ||
          res.data.modified !== this.state.modified
      ) {
        if (res.data.pending > 0) {
          this.setState({
            modified: res.data.modified,
            pending: res.data.pending,
            isConciliating: ' is-loading'
          })
        } else {
          this.setState({
            modified: res.data.modified,
            pending: res.data.pending,
            isConciliating: ''
          })
        }
      }
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

  async filterChangeHandler (name, value) { 
    if(name === 'period'){
      var period = this.state.filters.periods.find(item => {
        return item.number === value
      })
      var filteredSemanasBimbo = Array.from(Array(4), (_, x) => period.maxSemana - x).reverse()
      this.setState({
        filters: {
          ...this.state.filters,
          filteredSemanasBimbo: filteredSemanasBimbo
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

  async getDataRows () {
    if (!this.state.formData.period) {
      this.notify('Se debe filtrar por periodo!', 3000, toast.TYPE.ERROR)
      return
    }

    var period = this.state.filters.periods.find(item => {
      return item.number === this.state.formData.period
    })

    this.setState({
      isLoading: ' is-loading',
      generalAdjustment: period.adjustment,
      salesTable: [],
      noSalesData: ''      
    })

    const url = '/app/rows/dataset/'
    let data = await api.get(url + this.props.project.activeDataset.uuid, this.state.formData)

    this.setState({
      dataRows: this.getEditedRows(data.data),
      isFiltered: true,
      isLoading: '',
      selectedCheckboxes: new Set()
    })
    this.clearSearch()
    this.getSalesTable()    
  }

  getEditedRows(data) {
    for (let row of data) {
      if (row.localAdjustment != row.adjustment) {
        row.wasEdited = true
        if (this.state.generalAdjustment > 0) {
          var maxAdjustment = Math.ceil(row.prediction * (1 + this.state.generalAdjustment))
          var minAdjustment = Math.floor(row.prediction * (1 - this.state.generalAdjustment))
          row.isLimit = (row.localAdjustment > maxAdjustment || row.localAdjustment < minAdjustment)
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
    row.lastLocalAdjustment = row.localAdjustment    
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
      quantity: 0,
      percentage: val
    })
  }

  onChangeQuantity = (e) => {
    let val = parseInt(e.target.value)
    if (isNaN(val)) {
      val = e.target.value
    }
    this.setState({
      quantity: val,
      percentage: 0
    })
  }

  getModifyButtons () {
    return (
      <div className='columns'>      
        <div className='column is-narrow'>
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
        {currentRole !== 'manager-level-3' ?
          <div className='column is-narrow'>
            <div className='modifier'>
              <div className='field'>
                <label className='label'>Modificar por cantidad</label>
                <div className='field is-grouped control'>

                  <div className='control'>
                    <button
                      className='button is-outlined'
                      onClick={() => this.onClickButtonMinus()}
                      disabled={this.state.disableButtons}>
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
                      className='button is-outlined'
                      onClick={() => this.onClickButtonPlus()}
                      disabled={this.state.disableButtons}>
                      <span className='icon'>
                        <i className='fa fa-plus' />
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
        </div> : null }

        {currentRole !== 'manager-level-3' ?
          <div className='column is-narrow'>
            <div className='modifier'>
              <div className='field'>
                <label className='label'>Modificar por porcentaje</label>
                <div className='field is-grouped control'>

                  <div className='control'>
                    <button
                      className='button is-outlined'
                      onClick={() => this.onClickButtonMinus()}
                      disabled={this.state.disableButtons}>
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
                      className='button is-outlined'
                      onClick={() => this.onClickButtonPlus()}
                      disabled={this.state.disableButtons}>
                      <span className='icon'>
                        <i className='fa fa-plus' />
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div> : null}

        {this.state.selectedCheckboxes.size > 0 &&
        <div className='column products-selected'>
          <p>
            <span>{this.state.selectedCheckboxes.size} </span>
             Productos Seleccionados
          </p>
        </div> 
        }

        <div className='column download-btn'>
          <button 
            className={'button is-info is-pulled-right' + this.state.isDownloading}
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

  async onClickButtonPlus () {
    for (const row of this.state.selectedCheckboxes) {
      let toAdd = 0
      if (parseInt(this.state.quantity) === 0 && 
          parseInt(this.state.percentage) !== 0 && 
          !isNaN(this.state.quantity) && 
          !isNaN(this.state.percentage)){
        toAdd = row.prediction * 0.01 * parseInt(this.state.percentage)
        toAdd = Math.round(toAdd)
      }
      else if (parseInt(this.state.quantity) !== 0 &&
        parseInt(this.state.percentage) === 0 &&
        !isNaN(this.state.quantity) &&
        !isNaN(this.state.percentage)){
        toAdd = parseInt(this.state.quantity)
      }
      else{
        return
      }
      let localAdjustment = Math.round(row.localAdjustment)
      let newAdjustment = localAdjustment + toAdd
      row.lastLocalAdjustment = row.localAdjustment

      row.newAdjustment = newAdjustment

      const res = await this.handleChange(row)
      if (!res) {
        row.localAdjustment = localAdjustment
      }
    }
  }

  async onClickButtonMinus () {
    for (const row of this.state.selectedCheckboxes) {
      let toAdd = 0
      if (parseInt(this.state.quantity) === 0 &&
        parseInt(this.state.percentage) !== 0 &&
        !isNaN(this.state.quantity) &&
        !isNaN(this.state.percentage)) {
        toAdd = row.prediction * 0.01 * parseInt(this.state.percentage)
        toAdd = Math.round(toAdd)
      }
      else if (parseInt(this.state.quantity) !== 0 &&
        parseInt(this.state.percentage) === 0 &&
        !isNaN(this.state.quantity) &&
        !isNaN(this.state.percentage)) {
        toAdd = parseInt(this.state.quantity)
      }
      else {
        return
      }
      let localAdjustment = Math.round(row.localAdjustment)
      let newAdjustment = localAdjustment - toAdd
      row.lastLocalAdjustment = row.localAdjustment

      row.newAdjustment = newAdjustment

      const res = await this.handleChange(row)
      if (!res) {
        row.localAdjustment = localAdjustment
      }
    }
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
    let adjusted = true
    let maxAdjustment = Math.ceil(obj.prediction * (1 + this.state.generalAdjustment))
    let minAdjustment = Math.floor(obj.prediction * (1 - this.state.generalAdjustment))

    obj.newAdjustment = Math.round(obj.newAdjustment)
    obj.localAdjustment = Math.round(obj.localAdjustment)

    if (this.state.generalAdjustment > 0) {
      obj.isLimit = (obj.newAdjustment > maxAdjustment || obj.newAdjustment < minAdjustment)
    }

    if (obj.isLimit && obj.adjustmentRequest &&
      (obj.adjustmentRequest.status === 'approved' ||
        obj.adjustmentRequest.status === 'created')) {
      obj.adjustmentRequest.status = 'rejected'
    }

    obj.localAdjustment = obj.newAdjustment

    try {

      var url = '/app/rows/' + obj.uuid
      const res = await api.post(url, { ...obj })
      
      obj.edited = true

      if (currentRole === 'manager-level-1' && obj.isLimit) {
        this.showModalAdjustmentRequest(obj)
        this.notify('No te puedes pasar de los límites establecidos!', 3000, toast.TYPE.WARNING)
      }

      else {
        this.notify('Ajuste guardado!', 3000, toast.TYPE.INFO)
      }


      let index = this.state.dataRows.findIndex((item) => { return obj.uuid === item.uuid })
      let aux = this.state.dataRows

      aux.splice(index, 1, obj)

      this.setState({
        dataRows: aux,
        isConciliating: ' is-loading'
      })

      await this.updateSalesTable(obj)

    } catch (e) {
      this.notify('Ocurrio un error ' + e.message, 3000, toast.TYPE.ERROR)
      return false
    }

    this.getCountEdited()
    return adjusted
  }

  getCountEdited = () => {
    let edited = 0
    let pending = 0
    for(let row of this.state.dataRows){
      if(row.edited){
        edited++
      }
      if(row.adjustmentRequest && row.adjustmentRequest.status === 'created'){
        pending++
      }
    }
    this.props.counters(edited, pending)
  }

  notify (message = '', timeout = 3000, type = toast.TYPE.INFO) {
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

  showModalAdjustmentRequest (obj) {
    if (currentRole !== 'manager-level-3') {
      obj.localAdjustment = '' + obj.localAdjustment
      this.setState({
        classNameAR: ' is-active',
        selectedAR: obj
      })
    }
  }

  hideModalAdjustmentRequest () {
    this.setState({
      classNameAR: '',
      selectedAR: undefined            
    })
  }

  async finishUpAdjustmentRequest (res) {
    if (res && res.data === 'OK') {
      //this.state.selectedAR.localAdjustment = parseInt(this.state.selectedAR.localAdjustment)
      this.state.selectedAR.adjustmentRequest = { status: 'created' }
    }
    let aux = this.state.dataRows
    this.setState({
      selectedAR: undefined,
      dataRows: aux
    })
  }

  async searchDatarows() {
    const items = this.state.dataRows.map((item) => {
      if (this.state.searchTerm === ''){
        return item
      }
      const regEx = new RegExp(this.state.searchTerm, 'gi')

      if (regEx.test(item.productName) || regEx.test(item.productId) || regEx.test(item.channel) || regEx.test(item.salesCenter))
        return item
      else
        return null
    })
    .filter(function(item){ return item != null });

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

    if (currentRole === 'manager-level-3') {
      return <span>Modo Visualización - No se permiten ajustes para tu tipo de usuario</span>
    }
    else {
      return <span>Modo Ajuste {this.state.generalAdjustment * 100} % permitido</span>
    }
  }

  async getSalesTable() {
    let url = '/app/datasets/sales/' + this.props.project.activeDataset.uuid

    try {
      let res = await api.post(url, {
        ...this.state.formData,
        semana_bimbo: this.state.filters.filteredSemanasBimbo
      })

      if (res.data._items) {
        let totalPrediction = 0
        let totalAdjustment = 0

        for (let i = 0; i < res.data._items.length; i++) {
          const element = res.data._items[i];
          totalAdjustment += element.adjustment
          totalPrediction += element.prediction
        }

        this.setState({
          salesTable: res.data._items,
          totalAdjustment: totalAdjustment,
          totalPrediction: totalPrediction
        })
      }
    } catch (e) {
      this.notify('Error ' + e.message, 3000, toast.TYPE.ERROR)
      this.setState({
        noSalesData: e.message + ', intente más tarde'
      })
    }
    this.getCountEdited()
    
  }

  async updateSalesTable(row) {
    if (!row.productPrice) {
      row.productPrice = 10.00
    }

    let salesTable = this.state.salesTable

    for (let i = 0; i < salesTable.length; i++) {

      if (row.semanaBimbo === parseInt(salesTable[i].week)) {
        let price = Math.abs((row.localAdjustment - row.lastLocalAdjustment) * row.productPrice)

        if (row.lastLocalAdjustment > row.localAdjustment) {
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
        <div className='section has-text-centered subtitle has-text-primary'>
          Cargando, un momento por favor
          <Loader />
        </div>
      )
    }
    else {
      return (
        <div className='section has-text-centered subtitle has-text-primary'>
          {this.state.noSalesData}
        </div>
      )
    }
  }

  async downloadReport () {
    if (!this.state.formData.salesCenter) {
      this.notify('Es necesario filtrar por centro de venta para obtener un reporte!', 3000, toast.TYPE.ERROR)

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
        salesCenter: this.state.formData.salesCenters,
        channel: this.state.formData.channels,
        product: this.state.formData.products,
        category: this.state.formData.categories
      })

      var FileSaver = require('file-saver');
      var blob = new Blob(res.split(''), {type: 'text/csv;charset=utf-8'});
      FileSaver.saveAs(blob, `Proyecto ${this.props.project.name}`);
      this.setState({isDownloading: ''})
      this.notify('Se ha generado el reporte correctamente!', 3000, toast.TYPE.SUCCESS)
    } catch (e) {
    
      this.notify('Error ' + e.message, 3000, toast.TYPE.ERROR)
    
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

  getPeriod() {
    var period = this.state.filters.periods.find(item => {
      return item.number === this.state.formData.period
    })
    return period.name
  }

  render () {
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

    if (this.props.project.status === 'pendingRows') {
      return (
        <div className='section has-text-centered subtitle has-text-primary'>
          Se está preparando al proyecto para generar un dataset de ajuste, espere por favor.
          <Loader />
        </div>
      )
    }

    if (!this.state.filters.semanasBimbo.length > 0 && this.state.filtersLoaded) {
      return (
        <div className='section has-text-centered subtitle has-text-primary'>
          El proyecto no continene data rows
        </div>
      )
    }

    if (!this.state.filters.semanasBimbo.length > 0 && !this.state.filtersLoaded) {
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
        color: '#01579B',
        data: this.state.salesTable.map((item, key) => { return item.prediction })
      },
      {
        label: 'Ajuste',
        color: '#FF9800',
        data: this.state.salesTable.map((item, key) => { return item.adjustment })
      }
    ]

    return (
      <div>
        <CreateAdjustmentRequest
          className={this.state.classNameAR}
          hideModal={(e) => this.hideModalAdjustmentRequest(e)}
          finishUp={(e) => this.finishUpAdjustmentRequest(e)}
          prediction={this.state.selectedAR}
          baseUrl={'/app/rows/'} />

        <div className='section level selects'>
          <div className='level-left'>
            <div className='level-item'>
              <Select
                label='Periodo'
                name='period'
                value={1}
                placeholder='Seleccionar'
                optionValue='number'
                optionName='name'
                type='integer'
                options={this.state.filters.periods}
                onChange={(name, value) => { this.filterChangeHandler(name, value) }}
              />
            </div>

            <div className='level-item'>
              <Select
                label='Categoria de Productos'
                name='category'
                value=''
                placeholder='Seleccionar'
                options={this.state.filters.categories}
                onChange={(name, value) => { this.filterChangeHandler(name, value) }}
              />
            </div>

            <div className='level-item'>
              {this.state.filters.channels.length === 1 ?
                <div className='channel'>
                  <span>Canal: </span>
                  <span className='has-text-weight-bold'>{this.state.filters.channels[0].name}
                  </span>
                </div>
                :
              <Select
                label='Canal'
                name='channel'
                value=''
                placeholder='Seleccionar'
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
                  <span className='has-text-weight-bold'>{this.state.filters.salesCenters[0].name}
                  </span>
                </div>  
            :
              <Select
                label='Centros de Venta'
                name='salesCenter'
                value=''
                placeholder='Seleccionar'
                optionValue='uuid'
                optionName='name'
                options={this.state.filters.salesCenters}
                onChange={(name, value) => { this.filterChangeHandler(name, value) }}
              />
            }
            </div>
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
              <p className='has-text-weight-semibold'>Prediccion</p>
              <h1 className='num has-text-weight-bold'>
                {this.state.totalPrediction && this.state.totalPrediction.toFixed(2).replace(/./g, (c, i, a) => {
                  return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
                })}
              </h1>
            </div>
          </div>
          <div className={this.state.indicators === 'indicators-hide' ? 
          'level-item has-text-centered has-text-teal' : 
          'level-item has-text-centered has-text-teal disapear'}>
            <div>
              <p className='has-text-weight-semibold'>Ajuste</p>
              <h1 className='num has-text-weight-bold'>
                {this.state.totalAdjustment && this.state.totalAdjustment.toFixed(2).replace(/./g, (c, i, a) => {
                  return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
                })}
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
                  <h2>Totales de Venta</h2>
                </div>
                <div className='panel-block'>
                  {
                    currentRole !== 'manager-level-3' &&
                      this.state.salesTable.length > 0 ?
                      <table className='table is-fullwidth is-hoverable'>
                        <thead>
                          <tr>
                            <th>Semana</th>
                            <th className='has-text-info has-text-centered'>Predicción</th>
                            <th className='has-text-teal has-text-centered'>Ajuste</th>
                          </tr>
                        </thead>
                        <tbody>
                          {this.state.salesTable.map((item, key) => {
                            return (
                              <tr key={key}>
                                <td>
                                  {item.week}
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
                            <th>
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
                  <h2>Reporte de periodo</h2>
                </div>
                <div className='panel-block'>
                  {
                    currentRole !== 'manager-level-3' &&
                      this.state.salesTable.length > 0 ?
                      <Graph
                        data={graphData}
                        labels={this.state.salesTable.map((item, key) => { return item.week })}
                        reloadGraph={this.state.reloadGraph}
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
                <section className='section'>
              <h1 className='period-info'>
                <span className='has-text-weight-semibold'>{this.getPeriod()} - </span> 
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
                      showModalAdjustmentRequest={(row) => { this.showModalAdjustmentRequest(row) }} />
                    :

                    <WeekTable
                      show={this.showByProduct}
                      currentRole={currentRole}                    
                      data={this.state.filteredData}
                      checkAll={this.checkAll}
                      toggleCheckbox={this.toggleCheckbox}
                      changeAdjustment={this.changeAdjustment}
                      generalAdjustment={this.state.generalAdjustment}
                      showModalAdjustmentRequest={(row) => { this.showModalAdjustmentRequest(row) }} />
                }
              </div>
            }
          </section>
        </div>
    )
  }
}

export default TabAdjustment
