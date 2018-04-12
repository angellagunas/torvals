import React, { Component } from 'react'
import FontAwesome from 'react-fontawesome'
import moment from 'moment'
import api from '~base/api'
import _ from 'lodash'
import { toast } from 'react-toastify'
import Loader from '~base/components/spinner'
import {
  BaseForm,
  SelectWidget
} from '~base/components/base-form'
import CreateAdjustmentRequest from '../../forecasts/create-adjustmentRequest'
import { BaseTable } from '~base/components/base-table'
import Checkbox from '~base/components/base-checkbox'
import Editable from '~base/components/base-editable'

import WeekTable from './week-table'
import ProductTable from './product-table'

moment.locale('es');

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
        semanasBimbo: 0,
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
      error: false,
      errorMessage: ''
    }

    this.interval = null
  }

  componentWillMount () {
    this.getFilters()
    this.getModifiedCount()
    this.interval = setInterval(() => { this.getModifiedCount() }, 10000)
    if (this.props.project.status === 'adjustment') this.setAlertMsg()
  }

  componentWillUnmount () {
    clearInterval(this.interval)
    this.props.setAlert('is-white', ' ')
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.project.status === 'adjustment' && this.props.project.status !== 'adjustment') {
      this.clearSearch()
      this.getFilters()
    }

    if (this.props.project.status == 'adjustment' && !this.interval) {
      this.interval = setInterval(() => { this.getModifiedCount() }, 10000)
    }
  }

  async getFilters () {
    if (this.props.project.activeDataset) {
      const url = '/admin/rows/filters/dataset/'
      try {
        let res = await api.get(url + this.props.project.activeDataset.uuid)

        if (res.dates.length === 0) {
          this.notify(
            'Error! No hay fechas disponibles. Favor de cargar las fechas de Abraxas.',
            5000,
            toast.TYPE.ERROR
          )

          this.setState({
            error: true,
            errorMessage: 'No hay fechas disponibles. Favor de cargar las fechas de Abraxas.'
          })
          return
        }

        if (res.dates.length < res.semanasBimbo.length) {
          this.notify(
            'Hay menos fechas que semanas bimbo! Es posible que no se pueda realizar ajustes' +
            ' correctamente. Favor de cargar las fechas de Abraxas.',
            5000,
            toast.TYPE.ERROR
          )
        }

        var dates = []
        var periods = []
        var adjustments = {
          '1': 10,
          '2': 20,
          '3': 30,
          '4': -1
        }

        var maxDate = res.dates[0]
        var maxDateEnd = res.dates.findIndex(item => {return item.month === maxDate.month-1})
        if (maxDateEnd === -1) maxDateEnd = res.dates.length
        var period4 = res.dates.slice(0, maxDateEnd)

        var lastMaxDateEnd = maxDateEnd
        maxDate = res.dates[maxDateEnd]
        maxDateEnd = res.dates.findIndex(item => {return item.month === maxDate.month-1})
        if (maxDateEnd === -1) maxDateEnd = res.dates.length
        var period3 = res.dates.slice(lastMaxDateEnd, maxDateEnd)

        lastMaxDateEnd = maxDateEnd
        maxDate = res.dates[maxDateEnd]
        maxDateEnd = res.dates.findIndex(item => {return item.month === maxDate.month-1})
        if (maxDateEnd === -1) maxDateEnd = res.dates.length
        var period2 = res.dates.slice(lastMaxDateEnd, maxDateEnd)

        lastMaxDateEnd = maxDateEnd
        maxDate = res.dates[maxDateEnd]
        maxDateEnd = res.dates.findIndex(item => {return item.month === maxDate.month-1})
        if (maxDateEnd === -1) maxDateEnd = res.dates.length
        var period1 = res.dates.slice(lastMaxDateEnd, maxDateEnd)


        if (this.props.project.businessRules && this.props.project.businessRules.adjustments) {
          adjustments = this.props.project.businessRules.adjustments
        }

        periods.push({
          number: period4[0].month,
          name: `Periodo ${moment(period4[0].month, 'M').format('MMMM')}`,
          adjustment: adjustments['4'],
          maxSemana: period4[0].week,
          minSemana: period4[period4.length - 1].week
        })

        periods.push({
          number: period3[0].month,
          name: `Periodo ${moment(period3[0].month, 'M').format('MMMM')}`,
          adjustment: adjustments['3']/100,
          maxSemana: period3[0].week,
          minSemana: period3[period4.length - 1].week
        })

        periods.push({
          number: period2[0].month,
          name: `Periodo ${moment(period2[0].month, 'M').format('MMMM')}`,
          adjustment: adjustments['2']/100,
          maxSemana: period2[0].week,
          minSemana: period2[period4.length - 1].week
        })

        periods.push({
          number: period1[0].month,
          name: `Periodo ${moment(period1[0].month, 'M').format('MMMM')}`,
          adjustment: adjustments['1']/100,
          maxSemana: period1[0].week,
          minSemana: period1[period4.length - 1].week
        })

        var filteredSemanasBimbo = Array.from(Array(4), (_,x) => period1[0].week - x).reverse()

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
          formData: {
            semanasBimbo: filteredSemanasBimbo[0],
            period: period1[0].month
          },
          filtersLoaded: true
        }, () => {
          this.getDataRows()
        })
      } catch (e) {
        this.setState({
          error: true,
          errorMessage: 'No se pudieron cargar los filtros!'
        })
        this.notify(
          'Ha habido un error al obtener los filtros!',
          5000,
          toast.TYPE.ERROR
        )
      }
    }
  }

  async getModifiedCount () {
    if (this.props.project.activeDataset) {
      const url = '/admin/rows/modified/dataset/'
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

  async filterChangeHandler (e) {
    if (e.formData.period !== this.state.formData.period) {

      var period = this.state.filters.periods.find(item => {
        return item.number === e.formData.period
      })
      let filters = this.state.filters

      filters.filteredSemanasBimbo = Array.from(Array(4), (_,x) => period.maxSemana - x).reverse()

      this.setState({
        filters: filters,
        formData: {
          semanasBimbo: filters.filteredSemanasBimbo[0],
          products: e.formData.products,
          channels: e.formData.channels,
          salesCenters: e.formData.salesCenters,
          categories: e.formData.categories,
          period: e.formData.period
        }
      })
      return
    }

    this.setState({
      formData: {
        semanasBimbo: e.formData.semanasBimbo,
        products: e.formData.products,
        channels: e.formData.channels,
        salesCenters: e.formData.salesCenters,
        categories: e.formData.categories,
        period: e.formData.period
      }
    })
  }

  async FilterErrorHandler (e) {

  }

  async getDataRows () {
    if (!this.state.formData.period) {
      this.notify('Se debe filtrar por periodo!', 5000, toast.TYPE.ERROR)
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

    const url = '/admin/rows/dataset/'
    let data = await api.get(url + this.props.project.activeDataset.uuid,
      {
        //semanaBimbo: this.state.formData.semanasBimbo,
        product: this.state.formData.products,
        channel: this.state.formData.channels,
        salesCenter: this.state.formData.salesCenters,
        category: this.state.formData.categories,
        period: this.state.formData.period
      })

    this.setState({
      dataRows: this.getEditedRows(data.data),
      isFiltered: true,
      isLoading: '',
      selectedCheckboxes: new Set()
    })
    this.clearSearch()
    this.setAlertMsg()
    this.getSalesTable()
  }

  getEditedRows (data) {
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
    row.localAdjustment = value
    const res = await this.handleChange(row)
    if (!res) {
      return false
    }
    return res
  }

  uncheckAll () {
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

  getModifyButtons () {
    return (
      <div className='columns'>
        <div className='column'>
          <div className='field is-grouped'>
            <div className='control'>
              <h4 className='subtitle'>Resultados: {this.state.dataRows.length} </h4>
            </div>
            <div className='control'>
              <div className='field has-addons'>
                <div className='control'>
                  <input
                    className='input'
                    type='text'
                    value={this.state.searchTerm}
                    onChange={this.searchOnChange} placeholder='Buscar' />
                </div>
                <div className='control'>
                  <a className='button is-light' onClick={this.clearSearch}>
                    Limpiar
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className='column'>
          <div className='field is-grouped is-grouped-right'>
            <div className='control'>
              <p style={{ paddingTop: 5 }}>Modificar porcentaje</p>
            </div>

            <div className='control'>
              <button
                className='button is-primary is-outlined'
                onClick={() => this.onClickButtonMinus()}
                disabled={this.state.disableButtons}
              >
                <span className='icon'>
                  <i className='fa fa-minus' />
                </span>
              </button>
            </div>
            <div className='control'>
              <button
                className='button is-primary is-outlined'
                onClick={() => this.onClickButtonPlus()}
                disabled={this.state.disableButtons}
              >
                <span className='icon'>
                  <i className='fa fa-plus' />
                </span>
                </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  async onClickButtonPlus () {
    for (const row of this.state.selectedCheckboxes) {
      let toAdd = row.prediction * 0.01
      if (Math.round(toAdd) === 0) {
        toAdd = 1
      }
      var localAdjustment = Math.round(row.localAdjustment)
      var newAdjustment = row.localAdjustment + toAdd
      row.lastLocalAdjustment = row.localAdjustment      
      row.localAdjustment = newAdjustment
      const res = await this.handleChange(row)
      if (!res) {
        row.localAdjustment = localAdjustment
      }
    }
  }

  async onClickButtonMinus () {
    for (const row of this.state.selectedCheckboxes) {
      let toAdd = row.prediction * 0.01
      if (Math.round(toAdd) === 0) {
        toAdd = 1
      }
      var localAdjustment = Math.round(row.localAdjustment)
      var newAdjustment = row.localAdjustment - toAdd
      row.lastLocalAdjustment = row.localAdjustment      
      row.localAdjustment = newAdjustment
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

  async handleChange (obj) {

    var maxAdjustment = Math.ceil(obj.prediction * (1 + this.state.generalAdjustment))
    var minAdjustment = Math.floor(obj.prediction * (1 - this.state.generalAdjustment))

    obj.localAdjustment = Math.round(obj.localAdjustment)

    if (this.state.generalAdjustment > 0) {
      obj.isLimit = (obj.localAdjustment > maxAdjustment || obj.localAdjustment < minAdjustment)
    }

    if (obj.isLimit && obj.adjustmentRequest && 
        (obj.adjustmentRequest.status === 'approved' ||
         obj.adjustmentRequest.status === 'created')){
      obj.adjustmentRequest.status = 'rejected'
    }

    var url = '/admin/rows/' + obj.uuid
    const res = await api.post(url, {...obj})

    obj.edited = true

    let index = this.state.dataRows.findIndex((item) => { return obj.uuid === item.uuid })
    let aux = this.state.dataRows

    aux.splice(index,1,obj)

    this.setState({
      dataRows: aux,
      isConciliating: ' is-loading'
    })

    await this.updateSalesTable(obj)
    
    this.notify('Ajuste guardado!', 5000, toast.TYPE.INFO)

    return true
  }

  notify (message = '', timeout = 5000, type = toast.TYPE.INFO) {
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
    obj.localAdjustment = '' + obj.localAdjustment
    this.setState({
      classNameAR: ' is-active',
      selectedAR: obj
    })
  }

  hideModalAdjustmentRequest () {
    this.setState({
      classNameAR: '',
      selectedAR: undefined      
    })
  }

  async finishUpAdjustmentRequest (res) {
    if (res && res.data === 'OK') {
      this.state.selectedAR.localAdjustment = parseInt(this.state.selectedAR.localAdjustment)
      this.state.selectedAR.adjustmentRequest = {status: 'created'}
    }
    
    this.setState({
      selectedAR: undefined
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
    }, () => this.searchDatarows() )
  }

  clearSearch = () => {
    this.uncheckAll()
    this.setState({
      searchTerm: ''
    },() => this.searchDatarows() )
  }

  async conciliateOnClick () {
    this.setState({
      isConciliating: ' is-loading'
    })
    var url = '/admin/datasets/' + this.props.project.activeDataset.uuid + '/set/conciliate'

    try {
      clearInterval(this.interval)
      await api.post(url)
      await this.props.load()
    } catch (e) {
      this.notify('Error ' + e.message, 5000, toast.TYPE.ERROR)
    }

    this.setState({
      isConciliating: '',
      modified: 0,
      dataRows: [],
      isFiltered: false
    })
  }

  setAlertMsg() {
    let ajuste = (this.state.generalAdjustment * 100)
    if (ajuste < 0) {
      this.props.setAlert('is-warning', 'Ajuste Ilimitado.')
    }
    else {
      this.props.setAlert('is-warning', 'Modo de Ajuste - Para este periodo se permite un ajuste máximo de ' + (this.state.generalAdjustment * 100) + '%  sobre el ajuste anterior.')
    }
  }

  async getSalesTable() {
    let url = '/admin/datasets/sales/' + this.props.project.activeDataset.uuid

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
      this.notify('Error ' + e.message, 5000, toast.TYPE.ERROR)      
      this.setState({
        noSalesData: e.message + ', intente más tarde'
      })
    }
  }

  async updateSalesTable (row) {
    if (!row.productPrice){
      row.productPrice = 10.00
    }

    let salesTable = this.state.salesTable

    for (let i = 0; i < salesTable.length; i++) {

      if (row.semanaBimbo === parseInt(salesTable[i].week)){
        let price = Math.abs((row.localAdjustment - row.lastLocalAdjustment) * row.productPrice)
        
        if(row.lastLocalAdjustment > row.localAdjustment){
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

  loadTable () {
    if (!this.state.noSalesData){
      return (
        <div className='section has-text-centered subtitle has-text-primary'>
          Cargando, un momento por favor
          <Loader />
        </div>
      )
    }
    else{
      return (
      <div className='section has-text-centered subtitle has-text-primary'>
       {this.state.noSalesData}
      </div>
      )
    }
  }

  async downloadReport () {
    if (!this.state.formData.salesCenters) {
      this.notify('Es necesario filtrar por centro de venta para obtener un reporte!', 5000, toast.TYPE.ERROR)

      return
    }

    this.setState({isDownloading: ' is-loading'})

    let min
    let max
    let url = '/admin/rows/download/' + this.props.project.uuid
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
      this.notify('Se ha generado el reporte correctamente!', 5000, toast.TYPE.SUCCESS)
    } catch (e) {
      console.log('error',e.message)
      
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

  render () {
    if (this.state.error) {
      return (
        <div className='section columns'>
          <div className='column'>
            <article className="message is-danger">
              <div className="message-header">
                <p>Error</p>
                <button className="delete" aria-label="delete"></button>
              </div>
              <div className="message-body">
                {this.state.errorMessage}
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


    var schema = {
      type: 'object',
      title: '',
      properties: {}
    }

    const uiSchema = {
      period: {'ui:widget': SelectWidget},
      semanasBimbo: {'ui:widget': SelectWidget, 'ui:placeholder': 'Todas las semanas'},
      channels: {'ui:widget': SelectWidget, 'ui:placeholder': 'Todos los canales'},
      salesCenters: { 'ui:widget': SelectWidget, 'ui:placeholder': 'Todos los centros de venta' },      
      products: {'ui:widget': SelectWidget, 'ui:placeholder': 'Todos los productos'},
      categories: {'ui:widget': SelectWidget, 'ui:placeholder': 'Todas las categorías'}
    }

    if (this.state.filters.periods.length > 0) {
      schema.properties.period = {
        type: 'number',
          title: 'Periodo',
          enum: []
      }
      
      schema.properties.period.enum = this.state.filters.periods.map(item => { return item.number })
      schema.properties.period.enumNames = this.state.filters.periods.map(item => { return item.name })
      schema.properties.period.default = true
    }
    if (this.state.filters.filteredSemanasBimbo.length > 0) {
      schema.properties.semanasBimbo = {
        type: 'number',
          title: 'Semana',
          enum: [],
          enumNames: []
      }
      schema.properties.semanasBimbo.enum = this.state.filters.filteredSemanasBimbo
      schema.properties.semanasBimbo.enumNames = this.state.filters.filteredSemanasBimbo.map(item => { return 'Semana ' + item })
    }
    if (this.state.filters.channels.length > 0) {
      schema.properties.channels = {
        type: 'string',
          title: 'Canales',
          enum: [],
          enumNames: []
      }
      schema.properties.channels.enum = this.state.filters.channels.map(item => { return item.uuid })
      schema.properties.channels.enumNames = this.state.filters.channels.map(item => { return 'Canal ' + item.name })
    }

    if (this.state.filters.products.length > 0) {
      schema.properties.products = {
        type: 'string',
          title: 'Productos',
          enum: [],
          enumNames: []
      }
      
      schema.properties.products.enum = this.state.filters.products.map(item => { return item.uuid })
      schema.properties.products.enumNames = this.state.filters.products.map(item => { return item.name })
    }
    if (this.state.filters.categories.length > 0) {
      schema.properties.categories = {
        type: 'string',
          title: 'Categorias de producto',
          enum: [],
          enumNames: []
      }
      schema.properties.categories.enum = this.state.filters.categories
      schema.properties.categories.enumNames = this.state.filters.categories
    }

    if (this.state.filters.salesCenters.length > 0) {
      schema.properties.salesCenters = {
        type: 'string',
          title: 'Centros de Venta',
          enum: [],
          enumNames: []
      }
      schema.properties.salesCenters.enum = this.state.filters.salesCenters.map(item => { return item.uuid })
      schema.properties.salesCenters.enumNames = this.state.filters.salesCenters.map(item => { return 'Centro de Venta ' + item.name })
    }

    return (
      <div>
        <div className='section'>
          <CreateAdjustmentRequest
            className={this.state.classNameAR}
            hideModal={(e) => this.hideModalAdjustmentRequest(e)}
            finishUp={(e) => this.finishUpAdjustmentRequest(e)}
            prediction={this.state.selectedAR}
            baseUrl={'/admin/rows/'}
          />
          <div className='columns'>
            <div className='column'>
              <BaseForm
                className='inline-form'
                schema={schema}
                uiSchema={uiSchema}
                formData={this.state.formData}
                onChange={(e) => { this.filterChangeHandler(e) }}
                onSubmit={(e) => { this.getDataRows(e) }}
                onError={(e) => { this.FilterErrorHandler(e) }}
              >
              <br/>
                <div className='field is-grouped'>
                  <div className='control'>
                    <button
                      className={'button is-primary' + this.state.isLoading}
                      type='submit'
                      disabled={!!this.state.isLoading}
                    >
                    <span className='icon'>
                    <i className='fa fa-filter' />
                    </span>
                    <span>
                      Filtrar
                    </span>  
                    </button>
                  </div>
                </div>
              </BaseForm>
            </div>
            
            <div className='column has-text-right'>
              <div className='card'>
                <div className='card-header'>
                  <h1 className='card-header-title'>Totales de Venta</h1>
                </div>
                <div className='card-content historical-container'>
                  {
                    this.state.salesTable.length > 0 ? 
                    <table className='table historical is-fullwidth'>
                    <thead>
                      <tr>
                        <th colSpan='2'>Predicción</th>
                        <th colSpan='2'>Predicción con Ajuste</th>
                      </tr>
                    </thead>
                    <tbody>
                      { this.state.salesTable.map((item, key) => {
                          return (
                      <tr key={key}>
                        <td>
                          Semana {item.week}
                        </td>
                        <td>
                          $ {item.prediction.toFixed(2).replace(/./g, (c, i, a) => {
                              return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
                          })}
                        </td>
                        <td>
                          Semana {item.week}
                        </td>
                        <td>
                          $ {item.adjustment.toFixed(2).replace(/./g, (c, i, a) => {
                              return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
                          })}
                        </td>
                      </tr>
                          )
                      })
                    }

                      <tr>
                        <th>
                          Total
                        </th>
                        <td>
                          $ {this.state.totalPrediction.toFixed(2).replace(/./g, (c, i, a) => {
                              return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
                          })}
                          </td>
                        <th>
                          Total
                        </th>
                        <td>
                          $ {this.state.totalAdjustment.toFixed(2).replace(/./g, (c, i, a) => {
                              return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
                          })}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  :
                  this.loadTable()
                  }
                </div>
              </div>
              <br />
              <div className='field is-grouped is-grouped-right'>
                <div className='control'>
                  <button
                    className={'button is-primary' + this.state.isDownloading}
                    disabled={!!this.state.isDownloading}
                    onClick={e => this.downloadReport()}
                  >
                    <span className='icon'>
                      <i className='fa fa-download' />
                    </span>
                    <span>Descargar Reporte</span>
                  </button>
                </div>
                <div className='control'>
                  <button
                    className={'button is-success' + this.state.isConciliating}
                    disabled={!!this.state.isConciliating}
                    type='button'
                    onClick={e => this.conciliateOnClick()}
                  >
                    Confirmar ajustes ({ this.state.modified })
                  </button>
                </div>
              </div>
            </div>
          
          </div>
          <section className='section'>
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
                  {this.getModifyButtons()}
                {
                  !this.state.byWeek ?
                    
                    <ProductTable
                      show={this.showByWeek}
                      data={this.state.filteredData}
                      checkAll={this.checkAll}
                      toggleCheckbox={this.toggleCheckbox}
                      changeAdjustment={this.changeAdjustment}
                      generalAdjustment={this.state.generalAdjustment}
                      showModalAdjustmentRequest={(row) => { this.showModalAdjustmentRequest(row) }} />
                    :

                    <WeekTable
                      show={this.showByProduct}
                      data={this.state.filteredData}
                      checkAll={this.checkAll}
                      toggleCheckbox={this.toggleCheckbox}
                      changeAdjustment={this.changeAdjustment}
                      generalAdjustment={this.state.generalAdjustment}
                      showModalAdjustmentRequest={(row) => {this.showModalAdjustmentRequest(row)}} />
                }
              </div>
            }
          </section>
        </div>
      </div>
    )
  }
}

export default TabAdjustment
