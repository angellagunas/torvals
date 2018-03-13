import React, {Component} from 'react'
import moment from 'moment'
import api from '~base/api'
import { toast } from 'react-toastify'
import Loader from '~base/components/spinner'
import {
  BaseForm,
  SelectWidget
} from '~base/components/base-form'
import Graph from './graph'

class TabHistorical extends Component {
  constructor (props) {
    super(props)
    this.state = {
      labels: new Set(),
      predictions: [],
      adjustments: [],
      sales: [],
      prevSales: [],
      isLoading: '',
      isFiltered: false,
      filters: {
        channels: [],
        products: [],
        salesCenters: [],
        categories: []
      },
      formData: {
        period: 1
      },
      historicData: [],
      reloadGraph: false,
      noHistoricData: ''
    }
  }

  getLabels () {
    this.state.labels.clear()
    for (let label of this.state.historicData.prediction) {
      if (!this.state.labels.has(label.x)) {
        this.state.labels.add(label.x)
      }
    }
  }

  getPredictions () {
    let aux = []
    for (let p of this.state.historicData.prediction) {
      aux.push(p.y)
    }

    this.setState({
      predictions: aux
    })
  }

  getAdjustments () {
    let aux = []
    for (let a of this.state.historicData.adjustment) {
      aux.push(a.y)
    }

    this.setState({
      adjustments: aux
    })
  }

  getSales () {
    let aux = []
    for (let s of this.state.historicData.sale) {
      aux.push(s.y)
    }

    this.setState({
      sales: aux
    })
  }

  getPrevSales () {
    let aux = []
    for (let s of this.state.historicData.previous_sale) {
      aux.push(s.y)
    }

    this.setState({
      prevSales: aux
    })
  }

  async getWeekTotals (dates) {
    const wtp = []
    const wta = []
    const wts = []
    let tp = 0
    let ta = 0
    let ts = 0

    for (const week of this.state.historicData.prediction) {
      for (let i = 0; i < dates.length; i++) {
        if (moment(week.x).isBetween(dates[i].dateStart, dates[i].dateEnd, 'days', '[]')) {
          wtp.push({ week: dates[i].week, total: week.y })
          tp += week.y
        }
      }
    }
    wtp.push({ week: '', total: tp })

    for (const week of this.state.historicData.adjustment) {
      for (let i = 0; i < dates.length; i++) {
        if (moment(week.x).isBetween(dates[i].dateStart, dates[i].dateEnd, 'days', '[]')) {
          wta.push({ week: dates[i].week, total: week.y })
          ta += week.y
        }
      }
    }
    wta.push({ week: '', total: ta })

    for (const week of this.state.historicData.sale) {
      for (let i = 0; i < dates.length; i++) {
        if (moment(week.x).isBetween(dates[i].dateStart, dates[i].dateEnd, 'days', '[]')) {
          wts.push({ week: dates[i].week, total: week.y })
          ts += week.y
        }
      }
    }
    wts.push({ week: '', total: ts })

    this.setState({
      weekTotalsPredictions: wtp,
      weekTotalsAdjustments: wta,
      weekTotalsSales: wts
    })
  }

  async getFilters () {
    if (this.props.project.activeDataset) {
      const url = '/admin/rows/filters/dataset/'
      let res = await api.get(url + this.props.project.activeDataset.uuid)
      var periods = []

      const map = new Map()
      res.dates.map((date) => {
        const key = date.month
        const collection = map.get(key)
        if (!collection) {
          map.set(key, [date])
        } else {
          collection.push(date)
        }
      })

      for (let i = 0; i < Array.from(map).length; i++) {
        const element = Array.from(map)[i]
        periods.push({
          number: element[0],
          name: `Periodo ${moment(element[1][0].dateEnd).format('MMMM')}`,
          maxSemana: element[1][3].week,
          minSemana: element[1][0].week
        })
      }

      this.getProducts()
      this.getChannels()
      this.getSalesCent()

      this.setState({
        filters: {
          ...this.state.filters,
          dates: res.dates,
          periods: periods
        },
        formData: {
          period: 1
        },
        isFiltered: false
      }, () => {
        this.getData()
      })
    }
  }

  async getProducts () {
    const url = '/admin/products/'
    let res = await api.get(url, {
      start: 0,
      limit: 0,
      sort: 'name',
      organization: this.props.project.organization.uuid
    })
    this.setState({
      filters: {
        ...this.state.filters,
        products: res.data
      }
    }, () => {
      this.getCategory(res.data)
    })
  }

  async getChannels () {
    const url = '/admin/channels/'
    let res = await api.get(url, {
      start: 0,
      limit: 0,
      sort: 'name',
      organization: this.props.project.organization.uuid
    })

    this.setState({
      filters: {
        ...this.state.filters,
        channels: res.data
      }
    })
  }

  async getSalesCent () {
    const url = '/admin/salesCenters/'
    let res = await api.get(url, {
      start: 0,
      limit: 0,
      sort: 'name',
      organization: this.props.project.organization.uuid
    })

    this.setState({
      filters: {
        ...this.state.filters,
        salesCenters: res.data
      }
    })
  }

  getCategory (products) {
    const categories = new Set()
    products.map((item) => {
      if (item.category && !categories.has(item.category)) {
        categories.add(item.category)
      }
    })
    this.setState({
      filters: {
        ...this.state.filters,
        categories: Array.from(categories)
      }
    })
  }

  async filterChangeHandler (e) {
    if (e.formData.period !== this.state.formData.period) {
      this.setState({
        filters: {
          ...this.state.filters
        },
        formData: {
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

  async getData (e) {
    this.setState({
      isLoading: ' is-loading',
      noHistoricData: '',
      historicData: []
    })

    let min
    let max
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
    let url = '/admin/projects/historical/' + this.props.project.uuid
    try {
      let res = await api.post(url, {
        start_date: moment(min).format('YYYY-MM-DD'),
        end_date: moment(max).format('YYYY-MM-DD'),
        salesCenter: this.state.formData.salesCenters,
        channel: this.state.formData.channels,
        product: this.state.formData.products,
        category: this.state.formData.categories
      })
      this.setState({
        historicData: res.data,
        isLoading: '',
        reloadGraph: true
      }, async () => {
        await this.getWeekTotals(this.state.filters.dates)
        await this.getLabels()
        await this.getPredictions()
        await this.getAdjustments()
        await this.getSales()
        await this.getPrevSales()
        this.setState({
          reloadGraph: false
        })
      })
    } catch (e) {
      this.notify('Error ' + e.message, 3000, toast.TYPE.ERROR)
      this.setState({
        isLoading: '',
        noHistoricData: e.message + ', intente más tarde'
      })
    }
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

  componentDidMount () {
    this.getFilters()
  }

  loadTable () {
    if (!this.state.noHistoricData) {
      return (
        <div className='section has-text-centered subtitle has-text-primary'>
          Cargando, un momento por favor
          <Loader />
        </div>
      )
    } else {
      return (
        <div className='section has-text-centered subtitle has-text-primary'>
          {this.state.noHistoricData}
        </div>
      )
    }
  }

  render () {
    if (this.state.isFiltered ||
      this.state.filters.products.length === 0 ||
      this.state.filters.channels.length === 0 ||
      this.state.filters.salesCenters.length === 0
    ) {
      return <Loader />
    }

    const graphData = [
      {
        label: 'Predicción',
        color: '#01579B',
        data: this.state.predictions
      },
      {
        label: 'Ajuste',
        color: '#FF9800',
        data: this.state.adjustments
      },
      {
        label: 'Venta Registrada',
        color: '#8BC34A',
        data: this.state.sales
      },
      {
        label: 'Venta Anterior',
        color: 'red',
        data: this.state.prevSales
      }
    ]

    var schema = {
      type: 'object',
      title: '',
      properties: {}
    }

    const uiSchema = {
      period: { 'ui:widget': SelectWidget },
      channels: { 'ui:widget': SelectWidget, 'ui:placeholder': 'Todos los canales' },
      salesCenters: { 'ui:widget': SelectWidget, 'ui:placeholder': 'Todos los centros de venta' },
      products: { 'ui:widget': SelectWidget, 'ui:placeholder': 'Todos los productos' },
      categories: { 'ui:widget': SelectWidget, 'ui:placeholder': 'Todas las categorías' }
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
          <div className='columns'>
            <div className='column is-narrow'>
              <BaseForm
                className='inline-form'
                schema={schema}
                uiSchema={uiSchema}
                formData={this.state.formData}
                onChange={(e) => { this.filterChangeHandler(e) }}
                onSubmit={(e) => { this.getData(e) }}
                onError={(e) => { this.FilterErrorHandler(e) }}
              >
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

            <div className='column'>
              <div className='card'>
                <div className='card-header'>
                  <h1 className='card-header-title'>Totales de Venta</h1>
                </div>
                <div className='card-content historical-container'>
                  {
                    this.state.historicData.prediction &&
                    this.state.weekTotalsPredictions
                  ? <table className='table historical is-fullwidth'>
                    <thead>
                      <tr>
                        <th className='font-blue' colSpan='2'>Predicción</th>
                        <th className='font-orange' colSpan='2'>Ajuste</th>
                        <th className='font-green' colSpan='2'>Venta Registrada</th>
                      </tr>
                    </thead>
                    <tbody>
                      {this.state.weekTotalsPredictions.map((item, key) => {
                        if (item.week !== '') {
                          return (
                            <tr key={key}>
                              <td className='font-blue'>
                              Semana {item.week}
                              </td>
                              <td className='font-blue'>
                              $ {item.total}
                              </td>
                              <td className='font-orange'>
                              Semana {this.state.weekTotalsAdjustments[key].week}
                              </td>
                              <td className='font-orange'>
                                $ {this.state.weekTotalsAdjustments[key].total}
                              </td>
                              <td className='font-green'>
                                Semana {this.state.weekTotalsSales[key].week}
                              </td>
                              <td className='font-green'>
                                $ {this.state.weekTotalsSales[key].total}
                              </td>
                            </tr>)
                        }
                      })}

                      <tr>
                        <th className='font-blue'>
                          Total
                        </th>
                        <td className='font-blue'>
                          $ {this.state.weekTotalsPredictions[this.state.weekTotalsPredictions.length - 1].total}
                        </td>
                        <th className='font-orange'>
                          Total
                        </th>
                        <td className='font-orange'>
                          $ {this.state.weekTotalsAdjustments[this.state.weekTotalsAdjustments.length - 1].total}
                        </td>
                        <th className='font-green'>
                          Total
                        </th>
                        <td className='font-green'>
                          $ {this.state.weekTotalsSales[this.state.weekTotalsSales.length - 1].total}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  : this.loadTable()
                  }

                </div>
              </div>
            </div>

          </div>
          <br />
          {this.state.historicData.prediction && this.state.weekTotalsPredictions &&
            <Graph
              data={graphData}
              labels={Array.from(this.state.labels)}
              width={200}
              height={50}
              reloadGraph={this.state.reloadGraph}
            />
          }
        </div>
      </div>
    )
  }
}
export default TabHistorical
