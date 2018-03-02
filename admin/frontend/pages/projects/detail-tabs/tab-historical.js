import React, {Component} from 'react'
import moment from 'moment'
import api from '~base/api'
import Loader from '~base/components/spinner'
import {
  BaseForm,
  SelectWidget
} from '~base/components/base-form'
import Graph from './graph'

const response = {
  'prediction': [
    {
      'x': '2018-05-10',
      'y': 89278,
      'text': '89,278',
      'group': 'Prediction'
    },
    {
      'x': '2018-05-17',
      'y': 125436,
      'text': '125,436',
      'group': 'Prediction'
    },
    {
      'x': '2018-05-24',
      'y': 81056,
      'text': '81,056',
      'group': 'Prediction'
    },
    {
      'x': '2018-05-31',
      'y': 97737,
      'text': '97,737',
      'group': 'Prediction'
    },
    {
      'x': '2018-06-07',
      'y': 97737,
      'text': '97,737',
      'group': 'Prediction'
    },
    {
      'x': '2018-06-14',
      'y': 97737,
      'text': '97,737',
      'group': 'Prediction'
    },
    {
      'x': '2018-06-21',
      'y': 97737,
      'text': '97,737',
      'group': 'Prediction'
    },
    {
      'x': '2018-06-28',
      'y': 16301,
      'text': '16,301',
      'group': 'Prediction'
    }
  ],
  'adjustment': [
    {
      'x': '2018-05-10',
      'y': 89278,
      'text': '89,278',
      'group': 'Adjustment'
    },
    {
      'x': '2018-05-17',
      'y': 125436,
      'text': '125,436',
      'group': 'Adjustment'
    },
    {
      'x': '2018-05-24',
      'y': 81056,
      'text': '81,056',
      'group': 'Adjustment'
    },
    {
      'x': '2018-05-31',
      'y': 97737,
      'text': '97,737',
      'group': 'Adjustment'
    },
    {
      'x': '2018-06-07',
      'y': 97737,
      'text': '97,737',
      'group': 'Adjustment'
    },
    {
      'x': '2018-06-14',
      'y': 97737,
      'text': '97,737',
      'group': 'Adjustment'
    },
    {
      'x': '2018-06-21',
      'y': 97737,
      'text': '97,737',
      'group': 'Adjustment'
    },
    {
      'x': '2018-06-28',
      'y': 16400,
      'text': '16,400',
      'group': 'Adjustment'
    }
  ],
  'sale': [
    {
      'x': '2018-05-10',
      'y': 0,
      'text': '0',
      'group': 'Sale'
    },
    {
      'x': '2018-05-17',
      'y': 0,
      'text': '0',
      'group': 'Sale'
    },
    {
      'x': '2018-05-24',
      'y': 0,
      'text': '0',
      'group': 'Sale'
    },
    {
      'x': '2018-05-31',
      'y': 0,
      'text': '0',
      'group': 'Sale'
    },
    {
      'x': '2018-06-07',
      'y': 0,
      'text': '0',
      'group': 'Sale'
    },
    {
      'x': '2018-06-14',
      'y': 0,
      'text': '0',
      'group': 'Sale'
    },
    {
      'x': '2018-06-21',
      'y': 0,
      'text': '0',
      'group': 'Sale'
    },
    {
      'x': '2018-06-28',
      'y': 0,
      'text': '0',
      'group': 'Sale'
    }
  ],
  'previous_sale': [
    {
      'x': '2017-05-10',
      'y': 70,
      'text': '70',
      'group': 'Previous sale'
    },
    {
      'x': '2017-05-17',
      'y': 41,
      'text': '41',
      'group': 'Previous sale'
    },
    {
      'x': '2017-05-24',
      'y': 314,
      'text': '314',
      'group': 'Previous sale'
    },
    {
      'x': '2017-05-31',
      'y': 269,
      'text': '269',
      'group': 'Previous sale'
    },
    {
      'x': '2017-06-07',
      'y': 146,
      'text': '146',
      'group': 'Previous sale'
    },
    {
      'x': '2017-06-14',
      'y': 26,
      'text': '26',
      'group': 'Previous sale'
    },
    {
      'x': '2017-06-21',
      'y': 202,
      'text': '202',
      'group': 'Previous sale'
    },
    {
      'x': '2017-06-28',
      'y': 128,
      'text': '128',
      'group': 'Previous sale'
    }
  ]
}

class TabHistorical extends Component {
  constructor (props) {
    super(props)
    this.state = {
      labels: new Set(),
      predictions: [],
      adjustments: [],
      sales: [],
      prevSales: [],
      isLoading: true,
      filters: {
        channels: [],
        products: [],
        salesCenters: [],
        categories: []
      },
      formData: {
        period: 1
      }
    }
  }

  getLabels () {
    for (let label of response.prediction) {
      if (!this.state.labels.has(label.x)) {
        this.state.labels.add(label.x)
      }
    }
  }

  getPredictions () {
    let aux = []
    for (let p of response.prediction) {
      aux.push(p.y)
    }

    this.setState({
      predictions: aux
    })
  }

  getAdjustments () {
    let aux = []
    for (let a of response.adjustment) {
      aux.push(a.y)
    }

    this.setState({
      adjustments: aux
    })
  }

  getSales () {
    let aux = []
    for (let s of response.sale) {
      aux.push(s.y)
    }

    this.setState({
      sales: aux
    })
  }

  getPrevSales () {
    let aux = []
    for (let s of response.previous_sale) {
      aux.push(s.y)
    }

    this.setState({
      prevSales: aux
    })
  }

  getWeekTotals (dates) {
    const wtp = []
    const wta = []
    const wts = []
    let tp = 0
    let ta = 0
    let ts = 0

    for (const week of response.prediction) {
      for (let i = 0; i < dates.length; i++) {
        if (moment(week.x).isBetween(dates[i].dateStart, dates[i].dateEnd, 'days', '[]')) {
          wtp.push({ week: dates[i].week, total: week.y })
          tp += week.y
        }
      }
    }
    wtp.push({ week: '', total: tp })

    for (const week of response.adjustment) {
      for (let i = 0; i < dates.length; i++) {
        if (moment(week.x).isBetween(dates[i].dateStart, dates[i].dateEnd, 'days', '[]')) {
          wta.push({ week: dates[i].week, total: week.y })
          ta += week.y
        }
      }
    }
    wta.push({ week: '', total: ta })

    for (const week of response.sale) {
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

      var period4 = dates.slice(12, 16)
      var period3 = dates.slice(8, 12)
      var period2 = dates.slice(4, 8)
      var period1 = dates.slice(0, 4)

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
        adjustment: adjustments['3'] / 100,
        maxSemana: maxSemana,
        minSemana: maxSemana - 3
      })
      maxSemana = maxSemana - 4

      periods.push({
        number: 2,
        name: `Periodo ${period2[0].format('MMMM')}`,
        adjustment: adjustments['2'] / 100,
        maxSemana: maxSemana,
        minSemana: maxSemana - 3
      })
      maxSemana = maxSemana - 4

      periods.push({
        number: 1,
        name: `Periodo ${period1[0].format('MMMM')}`,
        adjustment: adjustments['1'] / 100,
        maxSemana: maxSemana,
        minSemana: maxSemana - 3
      })
      this.getWeekTotals(res.dates)
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
        isLoading: false
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
    // let url = '/admin/projects/historical/:uuid'
    console.log(e.formData)
  }

  componentDidMount () {
    this.getLabels()
    this.getPredictions()
    this.getAdjustments()
    this.getSales()
    this.getPrevSales()

    this.getFilters()
  }

  render () {
    if (this.state.isLoading ||
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
      properties: {
        period: {
          type: 'number',
          title: 'Periodo',
          enum: []
        },
        channels: {
          type: 'string',
          title: 'Canales',
          enum: [],
          enumNames: []
        },
        products: {
          type: 'string',
          title: 'Productos',
          enum: [],
          enumNames: []
        },
        categories: {
          type: 'string',
          title: 'Categorias de producto',
          enum: [],
          enumNames: []
        },
        salesCenters: {
          type: 'string',
          title: 'Centros de Venta',
          enum: [],
          enumNames: []
        }
      }
    }

    const uiSchema = {
      period: { 'ui:widget': SelectWidget },
      channels: { 'ui:widget': SelectWidget, 'ui:placeholder': 'Seleccione canal' },
      products: { 'ui:widget': SelectWidget, 'ui:placeholder': 'Seleccione producto' },
      categories: { 'ui:widget': SelectWidget, 'ui:placeholder': 'Seleccione categoria' },
      salesCenters: { 'ui:widget': SelectWidget, 'ui:placeholder': 'Seleccione Centro de Venta' }
    }

    schema.properties.period.enum = this.state.filters.periods.map(item => { return item.number })
    schema.properties.period.enumNames = this.state.filters.periods.map(item => { return item.name })
    schema.properties.period.default = true

    schema.properties.channels.enum = this.state.filters.channels.map(item => { return item.uuid })
    schema.properties.channels.enumNames = this.state.filters.channels.map(item => { return item.name })

    schema.properties.products.enum = this.state.filters.products.map(item => { return item.uuid })
    schema.properties.products.enumNames = this.state.filters.products.map(item => { return item.name })

    if (this.state.filters.categories.length > 0) {
      schema.properties.categories.enum = this.state.filters.categories
      schema.properties.categories.enumNames = this.state.filters.categories
    }
    schema.properties.salesCenters.enum = this.state.filters.salesCenters.map(item => { return item.uuid })
    schema.properties.salesCenters.enumNames = this.state.filters.salesCenters.map(item => { return item.name })

    return (<div className='card'>
      <div className='card-content'>
        <div className='columns'>
          <div className='column is-half'>
            <BaseForm
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
                    className={'button is-primary is-medium' + this.state.isLoading}
                    type='submit'
                    disabled={!!this.state.isLoading}
                  >
                    Filtrar
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
                <table className='table historical is-fullwidth'>
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
              </div>
            </div>
          </div>
        </div>
      </div>
      <Graph
        data={graphData}
        labels={Array.from(this.state.labels)}
        width={200}
        height={50}
      />
    </div>)
  }
}
export default TabHistorical
