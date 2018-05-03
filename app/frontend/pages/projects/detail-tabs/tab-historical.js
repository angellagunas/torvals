import React, { Component } from 'react'
import moment from 'moment'
import api from '~base/api'
import { toast } from 'react-toastify'
import _ from 'lodash'
import Loader from '~base/components/spinner'
import Graph from '~base/components/graph'
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
      noHistoricData: '',
      weeks: []
    }
  }

  getLabels () {
    this.state.labels.clear()
    let weeks = {}
    let data = this.state.historicData

    for (let i = 0; i < data.prediction.length; i++) {
      this.state.labels.add(data.prediction[i].x)
      weeks[data.prediction[i].x] = {
        ...weeks[data.prediction[i].x],
        week: data.prediction[i].abraxasDate[0].week,
        prediction: data.prediction[i].y
      }
      if (data.adjustment[i]) {
        this.state.labels.add(data.adjustment[i].x)
        weeks[data.adjustment[i].x] = {
          ...weeks[data.adjustment[i].x],
          week: data.adjustment[i].abraxasDate[0].week,
          adjustment: data.adjustment[i].y
        }
      }

      if (data.sale[i]) {
        this.state.labels.add(data.sale[i].x)
        weeks[data.sale[i].x] = {
          ...weeks[data.sale[i].x],
          week: data.sale[i].abraxasDate[0].week,
          sale: data.sale[i].y
        }
      }

      if (data.previous_sale[i]) {
        this.state.labels.add(data.previous_sale[i].x)
        weeks[data.previous_sale[i].x] = {
          ...weeks[data.previous_sale[i].x],
          week: data.previous_sale[i].abraxasDate[0].week,
          prevSale: data.previous_sale[i].y
        }
      }
    }

    weeks = Object.keys(weeks).sort().reduce((r, k) => (r[k] = weeks[k], r), {})
    let formatedLabels = _.sortBy(Array.from(this.state.labels), function (date) {
      return moment(date)
    })

    this.setState({
      formatedLabels,
      weeks
    })
  }

  getPredictions () {
    let aux = []

    let labels = this.state.formatedLabels
    let data = this.state.historicData

    for (let i = 0; i < labels.length; i++) {
      let found = data.prediction.find(function (element) {
        return element.x === labels[i]
      })
      if (found && found.y !== 0) {
        aux.push(found.y)
      } else {
        aux.push(undefined)
      }
    }

    this.setState({
      predictions: aux
    })
  }

  getAdjustments () {
    let aux = []
    let labels = this.state.formatedLabels
    let data = this.state.historicData

    for (let i = 0; i < labels.length; i++) {
      let found = data.adjustment.find(function (element) {
        return element.x === labels[i]
      })
      if (found && found.y !== 0) {
        aux.push(found.y)
      } else {
        aux.push(undefined)
      }
    }

    this.setState({
      adjustments: aux
    })
  }

  getSales () {
    let aux = []
    let labels = this.state.formatedLabels
    let data = this.state.historicData

    for (let i = 0; i < labels.length; i++) {
      let found = data.sale.find(function (element) {
        return element.x === labels[i]
      })
      if (found && found.y !== 0) {
        aux.push(found.y)
      } else {
        aux.push(undefined)
      }
    }

    this.setState({
      sales: aux
    })
  }

  getPrevSales () {
    let aux = []
    let labels = this.state.formatedLabels
    let data = this.state.historicData

    for (let i = 0; i < labels.length; i++) {
      let found = data.previous_sale.find(function (element) {
        return element.x === labels[i]
      })
      if (found && found.y !== 0) {
        aux.push(found.y)
      } else {
        aux.push(undefined)
      }
    }

    this.setState({
      prevSales: aux
    })
  }

  async getWeekTotals (dates) {
    let tp = 0
    let ta = 0
    let ts = 0
    let tl = 0

    let weeks = Object.values(this.state.weeks)

    for (let i = 0; i < weeks.length; i++) {
      if (weeks[i].prediction) { tp += Number(weeks[i].prediction) }
      if (weeks[i].adjustment) { ta += Number(weeks[i].adjustment) }
      if (weeks[i].sale) { ts += Number(weeks[i].sale) }
      if (weeks[i].prevSale) { tl += Number(weeks[i].prevSale) }
    }

    this.setState({
      weekTotalsPredictions: tp,
      weekTotalsAdjustments: ta,
      weekTotalsSales: ts,
      weekTotalsLastSales: tl
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
      // noHistoricData: '',
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
        await this.getLabels()

        await this.getWeekTotals(this.state.filters.dates)
        await this.getPredictions()
        await this.getAdjustments()
        await this.getSales()
        await this.getPrevSales()
        this.setState({
          reloadGraph: false,
          noHistoricData: ''
        })
      })

      if (res.data.prediction.length === 0) {
        this.setState({
          isLoading: '',
          noHistoricData: 'No hay datos que mostrar'
        })
      }
    } catch (e) {
      this.notify('Error ' + e.message, 5000, toast.TYPE.ERROR)
      this.setState({
        isLoading: '',
        noHistoricData: 'No hay datos disponibles, intente más tarde'
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
        {this.state.noHistoricData === ''
          ? <div>
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
                          this.state.historicData.prediction.length > 0
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
                                {Object.values(this.state.weeks).map((item, key) => {
                                  if (item !== '') {
                                    return (
                                      <tr className='has-text-centered' key={key}>
                                        <td>
                                          {item.week}
                                        </td>
                                        <td>
                                          $ {item.prediction
                                            ? item.prediction.toFixed(2).replace(/./g, (c, i, a) => {
                                              return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
                                            })
                                            : '0.00'
                                          }
                                        </td>
                                        <td>
                                          $ {item.adjustment
                                          ? item.adjustment.toFixed(2).replace(/./g, (c, i, a) => {
                                            return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
                                          })
                                        : '0.00'
                                        }
                                        </td>
                                        <td>
                                          $ {item.sale
                                          ? item.sale.toFixed(2).replace(/./g, (c, i, a) => {
                                            return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
                                          })
                                        : '0.00'
                                        }
                                        </td>
                                        <td>
                                          $ {item.prevSale
                                            ? item.prevSale.toFixed(2).replace(/./g, (c, i, a) => {
                                              return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
                                            })
                                          : '0.00'
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
                                    $ {this.state.weekTotalsPredictions
                                      .toFixed(2).replace(/./g, (c, i, a) => {
                                        return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
                                      })}
                                  </th>
                                  <th className='has-text-teal'>
                                    $ {this.state.weekTotalsAdjustments
                                      .toFixed(2).replace(/./g, (c, i, a) => {
                                        return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
                                      })}
                                  </th>
                                  <th className='has-text-success'>
                                    $ {this.state.weekTotalsSales
                                      .toFixed(2).replace(/./g, (c, i, a) => {
                                        return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
                                      })}
                                  </th>
                                  <th className='has-text-danger'>
                                    $ {this.state.weekTotalsLastSales
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
                      labels={this.state.formatedLabels}
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

          }

        </div>

        : <div className='section columns'>
          <div className='column'>
            <article className='message is-danger'>
              <div className='message-header'>
                <p>Error</p>
                <button className='delete' aria-label='delete' />
              </div>
              <div className='message-body'>
                {this.state.noHistoricData}
              </div>
            </article>
          </div>
        </div>
        }
      </div>
    )
  }
}
export default TabHistorical
