import React, { Component } from 'react'
import FontAwesome from 'react-fontawesome'
import moment from 'moment'
import api from '~base/api'
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

moment.locale('es');

class TabAdjustment extends Component {
  constructor (props) {
    super(props)
    this.state = {
      dataRows: [],
      isFiltered: false,
      filtersLoaded: false,
      isLoading: '',
      selectedAll: false,
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
      noSalesData: ''            
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
          period: 1
        },
        filtersLoaded: true
      }, () => {
        this.getDataRows()
      })
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

      var filteredSemanasBimbo = Array.from(Array(4), (_,x) => period.maxSemana - x).reverse()

      this.setState({
        filters: {
          ...this.state.filters,
          filteredSemanasBimbo: filteredSemanasBimbo
        },
        formData: {
          semanasBimbo: filteredSemanasBimbo[0],
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
    if (!this.state.formData.period || !this.state.formData.semanasBimbo) {
      this.notify('Se debe filtrar por semana!', 3000, toast.TYPE.ERROR)
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
        semanaBimbo: this.state.formData.semanasBimbo,
        product: this.state.formData.products,
        channel: this.state.formData.channels,
        salesCenter: this.state.formData.salesCenters,
        category: this.state.formData.categories
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
          row.isLimit = (row.localAdjustment >= maxAdjustment || row.localAdjustment <= minAdjustment)
        }
      }
    }
    return data
  }

  getColumns () {
    return [
      {
        'title': 'Product Id',
        'abbreviate': true,
        'abbr': 'P. Id',
        'property': 'productId',
        'default': 'N/A',
        formatter: (row) => {
          return String(row.productId)
        }
      },
      {
        'title': 'Product Name',
        'abbreviate': true,
        'abbr': 'P. Name',
        'property': 'productNamed',
        'default': 'N/A',
        formatter: (row) => {
          return String(row.productName)
        }
      },
      {
        'title': 'Centro de venta',
        'abbreviate': true,
        'abbr': 'C. Venta',
        'property': 'salesCenter',
        'default': 'N/A',
        formatter: (row) => {
          return String(row.salesCenter)
        }
      },
      {
        'title': 'Canal',
        'abbreviate': true,
        'abbr': 'Canal',
        'property': 'channel',
        'default': 'N/A',
        formatter: (row) => {
          return String(row.channel)
        }
      },
      {
        'title': 'Semana',
        'property': 'semanaBimbo',
        'default': 'N/A',
        formatter: (row) => {
          return String(row.semanaBimbo)
        }
      },
      {
        'title': 'Predicción',
        'property': 'prediction',
        'default': 0,
        formatter: (row) => {
          return String(row.prediction)
        }
      },
     /*  {
        'title': 'Ajuste Anterior',
        'property': 'lastAdjustment',
        'default': 0,
        formatter: (row) => {
          if (row.lastAdjustment) {
            return row.lastAdjustment
          }
        }
      }, */
      {
        'title': 'Ajuste',
        'property': 'localAdjustment',
        'default': 0,
        'type': 'number',
        'className': 'keep-cell',
        formatter: (row) => {
          if (!row.localAdjustment) {
            row.localAdjustment = 0
          }

          return (
            <Editable
              value={row.localAdjustment}
              handleChange={this.changeAdjustment}
              type='number'
              obj={row}
              width={100}
            />
          )
        }
      },
      {
        'title': 'Rango',
        'property': 'percentage',
        'default': 0,
        'type': 'number',
        'className': 'keep-cell',        
        formatter: (row) => {
          if (this.state.generalAdjustment < 0) return ' - '
          return `${(this.state.generalAdjustment * 100).toFixed(2)} %`
        }
      },
      {
        'title': 'Seleccionar Todo',
        'abbreviate': true,
        'abbr': (() => {
          return (
            <Checkbox
              label='checkAll'
              handleCheckboxChange={(e) => this.checkAll(!this.state.selectedAll)}
              key='checkAll'
              checked={this.state.selectedAll}
              hideLabel />
          )
        })(),
        'property': 'checkbox',
        'default': '',
        formatter: (row) => {
          if(!row.selected){
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
      },
      {
        'title': '',
        'abbreviate': true,
        'abbr': (() => {
          return (
            <div className='is-invisible'>
              <span
                className='icon'
                title='límite'
              >
                <FontAwesome name='warning fa-lg' />
              </span>
            </div>
          )
        })(),
        'property': 'isLimit',
        'default': '',
        formatter: (row) => {
          if (row.isLimit && !row.adjustmentRequest) {
            return (
              <span
                className='icon has-text-danger'
                title='No es posible ajustar más allá al límite!'
                onClick={() => {
                  this.showModalAdjustmentRequest(row)
                }}
              >
                <FontAwesome name='warning fa-lg' />
              </span>
            )
          }

          if (row.isLimit && row.adjustmentRequest) {
            return (
              <span
                className='icon has-text-warning'
                title='Ya se ha pedido un cambio a esta predicción!'
                onClick={() => {
                  this.showModalAdjustmentRequest(row)
                }}
              >
                <FontAwesome name='info-circle fa-lg' />
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
      obj.isLimit = (obj.localAdjustment >= maxAdjustment || obj.localAdjustment <= minAdjustment)
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
    
    this.notify('Ajuste guardado!', 3000, toast.TYPE.INFO)

    return true
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
      this.state.selectedAR.adjustmentRequest = true
    }
    
    this.setState({
      selectedAR: undefined
    })
  }

  searchDatarows() {
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

    this.setState({
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
      this.notify('Error ' + e.message, 3000, toast.TYPE.ERROR)
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
      this.notify('Error ' + e.message, 3000, toast.TYPE.ERROR)      
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
      this.notify('Es necesario filtrar por centro de venta para obtener un reporte!', 3000, toast.TYPE.ERROR)

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
      var blob = new Blob(res.split(''), {type: "text/csv;charset=utf-8"});
      FileSaver.saveAs(blob, `Proyecto ${this.props.project.name}`);
      this.setState({isDownloading: ''})
      this.notify('Se ha generado el reporte correctamente!', 3000, toast.TYPE.SUCCESS)
    } catch (e) {
      console.log('error',e.message)
      
      this.notify('Error ' + e.message, 3000, toast.TYPE.ERROR)
      
      this.setState({
        isLoading: '',
        noSalesData: e.message + ', intente más tarde',
        isDownloading: ''
      })
    }
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
                          })}}
                          </td>
                        <th>
                          Total
                        </th>
                        <td>
                          $ {this.state.totalAdjustment.toFixed(2).replace(/./g, (c, i, a) => {
                              return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
                          })}}
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
                <div className='scroll-table'>
                  <div className='scroll-table-container'>
                    <BaseTable
                      data={this.state.filteredData}
                      columns={this.getColumns()}
                      sortAscending
                      sortBy={'name'}
                    />
                  </div>
                </div>
              </div>
            }
          </section>
        </div>
      </div>
    )
  }
}

export default TabAdjustment
