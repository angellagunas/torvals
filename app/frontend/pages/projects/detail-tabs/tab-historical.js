import React, { Component } from 'react'
import moment from 'moment'
import api from '~base/api'
import { toast } from 'react-toastify'
import _ from 'lodash'
import Loader from '~base/components/spinner'
import Graph from './graph'
import Select from './select'

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
    const wtl = []
    let tp = 0
    let ta = 0
    let ts = 0
    let tl = 0

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

    for (const week of this.state.historicData.previous_sale) {
      for (let i = 0; i < dates.length; i++) {
        if (moment(week.x).isBetween(dates[i].dateStart, dates[i].dateEnd, 'days', '[]')) {
          wtl.push({ week: dates[i].week, total: week.y })
          tl += week.y
        }
      }
    }
    wtl.push({ week: '', total: tl })
    this.setState({
      weekTotalsPredictions: wtp,
      weekTotalsAdjustments: wta,
      weekTotalsSales: wts,
      weekTotalsLastSales: wtl
    })
  }

  getPeriods (data, year) {
    let periods = []
    const map = new Map()
    data.map((date) => {
      if (date.year === year) {
        const key = date.month
        const collection = map.get(key)
        if (!collection) {
          map.set(key, [date])
        } else {
          collection.push(date)
        }
      }
    })

    for (let i = 0; i < Array.from(map).length; i++) {
      const element = Array.from(map)[i]
      periods.push({
        number: element[0],
        name: `${moment(element[1][0].month, 'M').format('MMMM')}`,
        maxSemana: element[1][0].week,
        minSemana: element[1][element[1].length - 1].week
      })
    }

    return periods.reverse()
  }

  async getFilters () {
    if (this.props.project.activeDataset) {
      const url = '/app/dates/'

      try {
        let res = await api.get(url)
        var periods = []
        let years = new Set()

        res.data.map((date) => {
          years.add(date.year)
        })

        periods = this.getPeriods(res.data, Array.from(years)[0])

        this.getProducts()
        this.getChannels()
        this.getSalesCent()

        this.setState({
          filters: {
            ...this.state.filters,
            dates: res.data,
            periods: periods,
            years: Array.from(years)
          },
          formData: {
            period: periods[0].number,
            year: Array.from(years)[0]
          },
          isFiltered: false
        }, () => {
          this.getData()
        })
      } catch (e) {
        console.log(e)
      }
    }
  }

  async getProducts () {
    const url = '/app/products/'
    try {
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
    } catch (e) {
      console.log(e)
    }
  }

  async getChannels () {
    const url = '/app/channels/'
    try {
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
    } catch (e) {
      console.log(e)
    }
  }

  async getSalesCent () {
    const url = '/app/salesCenters/'
    try {
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

      if (res.data.length === 1) {
        this.setState({
          formData: {
            ...this.state.formData,
            salesCenters: res.data[0].uuid
          }
        })
      }
    } catch (e) {
      console.log(e)
    }
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

  async filterChangeHandler (name, value) {
    if (name === 'year') {
      this.setState({
        filters: {
          ...this.state.filters,
          periods: this.getPeriods(this.state.filters.dates, value)
        }
      })
    }

    let aux = this.state.formData
    aux[name] = value
    this.setState({
      formData: aux
    }, () => {
      this.getData()
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
      if (period) {
        if (period.maxSemana === date.week && this.state.formData.year === date.year) {
          max = date.dateEnd
        }
        if (period.minSemana === date.week && this.state.formData.year === date.year) {
          min = date.dateStart
        }
      } else {
        max = moment(this.state.formData.year, 'Y').endOf('year')
        min = moment(this.state.formData.year, 'Y').startOf('year')
      }
    })
    let url = '/app/projects/historical/' + this.props.project.uuid

    try {
      let res = await api.post(url, {
        start_date: moment(min).format('YYYY-MM-DD'),
        end_date: moment(max).format('YYYY-MM-DD'),
        salesCenter: this.state.formData.salesCenter,
        channel: this.state.formData.channel,
        product: this.state.formData.product,
        category: this.state.formData.category
      })

      let historic = res.data

      historic.prediction = _.orderBy(historic.prediction,
        (e) => {
          return e.x
        }
        , ['asc'])

      historic.adjustment = _.orderBy(historic.adjustment,
        (e) => {
          return e.x
        }
        , ['asc'])

      historic.prediction = _.orderBy(historic.prediction,
        (e) => {
          return e.x
        }
        , ['asc'])

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
      this.notify('Error ' + e.message, 5000, toast.TYPE.ERROR)
      this.setState({
        isLoading: '',
        noHistoricData: e.message + ', intente más tarde'
      })
    }
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

  loadTable () {
    if (!this.state.noHistoricData) {
      return (
        <div className='is-fullwidth has-text-centered subtitle has-text-primary'>
          Cargando, un momento por favor
          <Loader />
        </div>
      )
    } else {
      return (
        <div className='is-fullwidth has-text-centered subtitle has-text-primary'>
          {this.state.noHistoricData}
        </div>
      )
    }
  }

  componentDidMount () {
    this.getFilters()
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
        color: '#187FE6',
        data: this.state.predictions
      },
      {
        label: 'Ajuste',
        color: '#30C6CC',
        data: this.state.adjustments
      },
      {
        label: 'Venta Registrada',
        color: '#0CB900',
        data: this.state.sales
      },
      {
        label: 'Venta Anterior',
        color: '#EF6950',
        data: this.state.prevSales
      }
    ]

    return (
      <div>
        <div className='section level selects'>
          <div className='level-left'>
            <div className='level-item'>
              <Select
                label='Año'
                name='year'
                value={this.state.formData.year}
                placeholder='Seleccionar'
                type='integer'
                options={this.state.filters.years}
                onChange={(name, value) => { this.filterChangeHandler(name, value) }}
              />
            </div>
            <div className='level-item'>
              <Select
                label='Periodo'
                name='period'
                value={this.state.formData.period}
                placeholder='Todos'
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
              {this.state.filters.channels.length === 1
                ? <div className='channel'>
                  <span>Canal: </span>
                  <span className='has-text-weight-bold is-capitalized'>{this.state.filters.channels[0].name}
                  </span>
                </div>
                : <Select
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
              {this.state.filters.salesCenters.length === 1
                ? <div className='saleCenter'>
                  <span>Centro de Venta: </span>
                  <span className='has-text-weight-bold is-capitalized'>{this.state.filters.salesCenters[0].name}
                  </span>
                </div>
                : <Select
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
        <div className='section'>
          <div className='columns'>

            <div className='column'>
              <div className='panel historic-table'>
                <div className='panel-heading'>
                  <h2 className='is-capitalized'>Totales de Venta</h2>
                </div>
                <div className='panel-block'>
                  {
                    this.state.historicData.prediction &&
                      this.state.weekTotalsPredictions

                    ? <div className='is-fullwidth'>
                      {
                          this.state.historicData.prediction.length > 0 &&
                            this.state.weekTotalsPredictions.length > 0
                            ? <table className='table historical is-fullwidth'>
                              <thead>
                                <tr>
                                  <th className='has-text-centered'>Semana</th>
                                  <th className='has-text-info has-text-centered'>Predicción</th>
                                  <th className='has-text-teal has-text-centered'>Ajuste</th>
                                  <th className='has-text-success has-text-centered'>Venta Registrada</th>
                                  <th className='has-text-danger has-text-centered'>Venta Anterior</th>
                                </tr>
                              </thead>
                              <tbody>
                                {this.state.weekTotalsPredictions.map((item, key) => {
                                  if (item.week !== '') {
                                    return (
                                      <tr className='has-text-centered' key={key}>
                                        <td>
                                          {item.week}
                                        </td>
                                        <td>
                                          $ {item.total.toFixed(2).replace(/./g, (c, i, a) => {
                                            return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
                                          })}
                                        </td>
                                        <td>
                                          $ {this.state.weekTotalsAdjustments[key].total.toFixed(2).replace(/./g, (c, i, a) => {
                                            return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
                                          })}
                                        </td>
                                        <td>
                                          $ {this.state.weekTotalsSales[key].total.toFixed(2).replace(/./g, (c, i, a) => {
                                            return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
                                          })}
                                        </td>
                                        <td>
                                          $ {this.state.weekTotalsLastSales[key]
                                            ? this.state.weekTotalsLastSales[key].total.toFixed(2).replace(/./g, (c, i, a) => {
                                              return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
                                            }) : '0.00'
                                          }
                                        </td>
                                      </tr>)
                                  }
                                })}

                                <tr className='totals'>
                                  <th>
                                    Total
                          </th>
                                  <th className='has-text-info'>
                                    $ {this.state.weekTotalsPredictions[this.state.weekTotalsPredictions.length - 1].total
                                      .toFixed(2).replace(/./g, (c, i, a) => {
                                        return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
                                      })}
                                  </th>
                                  <th className='has-text-teal'>
                                    $ {this.state.weekTotalsAdjustments[this.state.weekTotalsAdjustments.length - 1].total
                                      .toFixed(2).replace(/./g, (c, i, a) => {
                                        return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
                                      })}
                                  </th>
                                  <th className='has-text-success'>
                                    $ {this.state.weekTotalsSales[this.state.weekTotalsSales.length - 1].total
                                      .toFixed(2).replace(/./g, (c, i, a) => {
                                        return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
                                      })}
                                  </th>
                                  <th className='has-text-danger'>
                                    $ {this.state.weekTotalsLastSales[this.state.weekTotalsLastSales.length - 1].total
                                      .toFixed(2).replace(/./g, (c, i, a) => {
                                        return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
                                      })}
                                  </th>
                                </tr>
                              </tbody>
                            </table>

                            : <div className='is-fullwidth has-text-centered subtitle has-text-primary'>
                              No hay datos que mostrar
                      </div>
                        }
                    </div>
                      : this.loadTable()
                  }
                </div>
              </div>
            </div>
          </div>

          <div className='columns'>

            <div className='column'>
              <div className='panel historic-graph'>
                <div className='panel-heading'>
                  <h2 className='is-capitalized'>Totales de Venta</h2>
                </div>
                <div className='panel-block'>
                  {
                    this.state.historicData.prediction &&
                    this.state.weekTotalsPredictions
                  ? this.state.historicData.prediction && this.state.weekTotalsPredictions &&
                    this.state.predictions.length > 0 &&
                    this.state.adjustments.length > 0

                  ? <Graph
                    data={graphData}
                    labels={Array.from(this.state.labels)}
                    height={50}
                    reloadGraph={this.state.reloadGraph}
                  />
                  : <div className='is-fullwidth has-text-centered subtitle has-text-primary'>
                        No hay datos que mostrar
                      </div>
                  : this.loadTable()
                }
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    )
  }
}
export default TabHistorical
