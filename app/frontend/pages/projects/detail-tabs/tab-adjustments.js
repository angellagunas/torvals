import React, { Component } from 'react'
import FontAwesome from 'react-fontawesome'
import moment from 'moment'
import _ from 'lodash'
import tree from '~core/tree'
import { toast } from 'react-toastify'
import {FileSaver} from 'file-saver'

import api from '~base/api'
import Loader from '~base/components/spinner'
import Editable from '~base/components/base-editable'
import Checkbox from '~base/components/base-checkbox'

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
      isUpdating: false,
      dataRows: [],
      pendingDataRows: {},
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
        filteredSemanasBimbo: [],
        periods: []
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
      byWeek: true,
      indicators: 'indicators-hide',
      quantity: 100,
      percentage: 1,
      error: false,
      errorMessage: ''
    }

    currentRole = tree.get('user').currentRole.slug
    this.interval = null
    this.toastId = null
  }

  shouldComponentUpdate(nextProps, nextState) {
    // if (nextState.isUpdating) {
    //   return false
    // }

    return true
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
      try {
        let res = await api.get(url + this.props.project.activeDataset.uuid)

        if (res.dates.length === 0) {
          this.notify(
            'Error! No hay fechas disponibles. Por favor contacta a un administrador.',
            5000,
            toast.TYPE.ERROR
          )

          this.setState({
            error: true,
            errorMessage: 'No hay fechas disponibles. Por favor contacta a un administrador.'
          })
          return
        }

        if (res.dates.length < res.semanasBimbo.length) {
          this.notify(
            'Hay menos fechas que semanas bimbo! Es posible que no se pueda realizar ajustes' +
            ' correctamente. Por favor contacta a un administrador.',
            5000,
            toast.TYPE.ERROR
          )
        }

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
          name: `${_.capitalize(moment(period4[0].month, 'M').format('MMMM'))}`,
          adjustment: adjustments['4'],
          maxSemana: period4[0].week,
          minSemana: period4[period4.length - 1].week
        })

        periods.push({
          number: period3[0].month,
          name: `${_.capitalize(moment(period3[0].month, 'M').format('MMMM'))}`,
          adjustment: adjustments['3']/100,
          maxSemana: period3[0].week,
          minSemana: period3[period3.length - 1].week
        })

        periods.push({
          number: period2[0].month,
          name: `${_.capitalize(moment(period2[0].month, 'M').format('MMMM'))}`,
          adjustment: adjustments['2']/100,
          maxSemana: period2[0].week,
          minSemana: period2[period2.length - 1].week
        })

        periods.push({
          number: period1[0].month,
          name: `${_.capitalize(moment(period1[0].month, 'M').format('MMMM'))}`,
          adjustment: adjustments['1']/100,
          maxSemana: period1[0].week,
          minSemana: period1[period1.length - 1].week
        })

        var formData = this.state.formData
        formData.period = period1[0].month

        if (res.salesCenters.length === 1) {
          formData.salesCenter = res.salesCenters[0].uuid
        }

        if (res.channels.length === 1) {
          formData.channel = res.channels[0].uuid
        }

        var days = period1[0].week - period1[period1.length - 1].week
        var filteredSemanasBimbo = Array.from(Array(days+1), (_,x) => period1[0].week - x).reverse()

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
      } catch (e) {
        this.setState({
          error: true,
          errorMessage: 'No se pudieron cargar los filtros!'
        })

        this.notify(
          'Ha habido un error al obtener los filtros! ' + e.message,
          5000,
          toast.TYPE.ERROR
        )
      }            
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

      var days = period.maxSemana - period.minSemana
      var filteredSemanasBimbo = Array.from(Array(days+1), (_,x) => period.maxSemana - x).reverse()
      
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

    const url = '/app/rows/dataset/'
    let data = await api.get(
      url + this.props.project.activeDataset.uuid,
      this.state.formData
    )

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
      row.adjustmentForDisplay = row.localAdjustment
      if (row.adjustmentRequest) {
        row.adjustmentForDisplay = row.adjustmentRequest.newAdjustment
      }

      if (row.localAdjustment != row.adjustment || row.adjustmentRequest) {
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
                      onClick={() => this.onClickButtonMinus('quantity')}
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
                      onClick={() => this.onClickButtonPlus('quantity')}
                      disabled={this.state.disableButtons}>
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

        {currentRole !== 'manager-level-3' ?
          <div className='column is-narrow'>
            <div className='modifier'>
              <div className='field'>
                <label className='label'>Modificar por porcentaje</label>
                <div className='field is-grouped control'>
                  <div className='control'>
                    <button
                      className='button is-outlined'
                      onClick={() => this.onClickButtonMinus('percent')}
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
                      onClick={() => this.onClickButtonPlus('percent')}
                      disabled={this.state.disableButtons}>
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

        {this.state.selectedCheckboxes.size > 0 &&
          <div className='column products-selected'>
            <p>
              <span>{this.state.byWeek ? this.state.selectedCheckboxes.size / this.state.filters.filteredSemanasBimbo.length : this.state.selectedCheckboxes.size} </span>
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

  async onClickButtonPlus (type) {
    for (const row of this.state.selectedCheckboxes) {
      let toAdd = 0
      
      if (
        type === 'percent' && 
        !isNaN(this.state.percentage) &&
        parseInt(this.state.percentage) !== 0 
      ){
        toAdd = row.prediction * 0.01 * parseInt(this.state.percentage)
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

      const res = await this.handleChange(row)
      
      if (!res) {
        row.adjustmentForDisplay = adjustmentForDisplayAux
      }
    }
  }

  async onClickButtonMinus (type) {
    this.setState({isUpdating: true})
    for (const row of this.state.selectedCheckboxes) {
      let toAdd = 0
      
      if (
        type === 'percent' && 
        parseInt(this.state.percentage) !== 0 && 
        !isNaN(this.state.percentage)
      ) {
        toAdd = row.prediction * 0.01 * parseInt(this.state.percentage)
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

      const res = await this.handleChange(row)
      
      if (!res) {
        row.adjustmentForDisplay = adjustmentForDisplayAux
      }
    }
    this.setState({isUpdating: false})
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
    obj.adjustmentForDisplay = Math.round(obj.adjustmentForDisplay)

    if (this.state.generalAdjustment > 0) {
      obj.isLimit = (obj.newAdjustment > maxAdjustment || obj.newAdjustment < minAdjustment)
    }

    if (obj.isLimit && obj.adjustmentRequest &&
      (obj.adjustmentRequest.status === 'approved' ||
        obj.adjustmentRequest.status === 'created')) {
      obj.adjustmentRequest.status = 'rejected'
    }

    obj.adjustmentForDisplay = obj.newAdjustment

    try { 
      obj.edited = true
      let { pendingDataRows } = this.state

      if (currentRole === 'manager-level-1' && obj.isLimit) {
        this.notify(
          'No te puedes pasar de los límites establecidos! Debes pedir una solicitud de ajuste '+
          'haciendo click sobre el ícono rojo.',
          5000,
          toast.TYPE.WARNING
        )

        if (!pendingDataRows[obj.uuid]) pendingDataRows[obj.uuid] = obj
      } else {
        var url = '/app/rows/' + obj.uuid
        const res = await api.post(url, { ...obj })
        this.notify('Ajuste guardado!', 5000, toast.TYPE.INFO)
      }
      
      let index = this.state.dataRows.findIndex((item) => { return obj.uuid === item.uuid })
      let aux = this.state.dataRows

      aux.splice(index, 1, obj)

      this.setState({
        dataRows: aux,
        pendingDataRows: pendingDataRows,
        isConciliating: ' is-loading'
      })

      await this.updateSalesTable(obj)

    } catch (e) {
      this.notify('Ocurrio un error ' + e.message, 5000, toast.TYPE.ERROR)
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

  async handleAdjustmentRequest (obj) {
    let { pendingDataRows } = this.state
    let productAux = []
    if (currentRole === 'manager-level-3') {
      return
    }

    if (obj instanceof Array) {
      productAux = obj
    } else {
      productAux.push(obj)
    }

    for (var product of productAux) {
      let res = await api.post(
        `/app/rows/${product.uuid}/request`,
        {
          newAdjustment: product.adjustmentForDisplay
        }
      )
      
      product.adjustmentRequest = res.data
      delete pendingDataRows[product.uuid]
    }

    this.setState({
      pendingDataRows: pendingDataRows
    })
  }

  async handleAllAdjustmentRequest (obj) {
    let { pendingDataRows } = this.state
    let pendingDataRowsArray = Object.values(pendingDataRows)

    await this.handleAdjustmentRequest(pendingDataRowsArray)
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
      this.notify('Error ' + e.message, 5000, toast.TYPE.ERROR)
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
        <div className='section has-text-centered subtitle has-text-primary'>
          {this.state.noSalesData}
        </div>
      )
    }
  }

  async downloadReport () {
    if (!this.state.formData.salesCenter) {
      this.notify('Es necesario filtrar por centro de venta para obtener un reporte!', 5000, toast.TYPE.ERROR)

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

      
      var blob = new Blob(res.split(''), {type: 'text/csv;charset=utf-8'});
      FileSaver.saveAs(blob, `Proyecto ${this.props.project.name}`);
      this.setState({isDownloading: ''})
      this.notify('Se ha generado el reporte correctamente!', 5000, toast.TYPE.SUCCESS)
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

  getPeriod() {
    var period = this.state.filters.periods.find(item => {
      return item.number === this.state.formData.period
    })
    return period.name
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

    if (!this.state.filters.periods.length > 0 && this.state.filtersLoaded) {
      return (
        <div className='section has-text-centered subtitle has-text-primary'>
          El proyecto no continene data rows
        </div>
      )
    }

    if (!this.state.filters.periods.length > 0 && !this.state.filtersLoaded) {
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
        <div className='section level selects'>
          <div className='level-left'>
            <div className='level-item'>
              <Select
                label='Periodo'
                name='period'
                value={this.state.formData.period}
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
                label='Categoría'
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
                  <span className='has-text-weight-bold is-capitalized'>{this.state.filters.channels[0].name}
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
                  <span className='has-text-weight-bold is-capitalized'>{this.state.filters.salesCenters[0].name}
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
                  <h2 className='is-capitalized'>Totales {this.getPeriod()}</h2>
                </div>
                <div className='panel-block'>
                  {
                    currentRole !== 'manager-level-3' &&
                      this.state.salesTable.length > 0 ?
                      <table className='table is-fullwidth is-hoverable'>
                        <thead>
                          <tr>
                            <th className='has-text-centered'>Semana</th>
                            <th className='has-text-info has-text-centered'>Predicción</th>
                            <th className='has-text-teal has-text-centered'>Ajuste</th>
                          </tr>
                        </thead>
                        <tbody>
                          {this.state.salesTable.map((item, key) => {
                            return (
                              <tr key={key}>
                                <td className='has-text-centered'>
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
                  <h2 className='is-capitalized'>Reporte {this.getPeriod()}</h2>
                </div>
                <div className='panel-block'>
                  {
                    currentRole !== 'manager-level-3' &&
                      this.state.salesTable.length > 0 ?
                      <Graph
                        data={graphData}
                        labels={this.state.salesTable.map((item, key) => { return 'Semana ' + item.week })}
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
                    <span className='has-text-weight-semibold is-capitalized'>Periodo {this.getPeriod()} - </span> 
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
                      handleAdjustmentRequest={(row) => { this.handleAdjustmentRequest(row) }} 
                      handleAllAdjustmentRequest={() => { this.handleAllAdjustmentRequest() }} 
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
                      handleAdjustmentRequest={(row) => { this.handleAdjustmentRequest(row) }}
                      handleAllAdjustmentRequest={() => { this.handleAllAdjustmentRequest() }} 
                    />
                }
              </div>
          }
        </section>
      </div>
    )
  }
}

export default TabAdjustment
