import React, { Component } from 'react'
import 'react-datepicker/dist/react-datepicker.css'
import Page from '~base/page'
import { loggedIn } from '~base/middlewares/'
import api from '~base/api'
import moment from 'moment'
import CalendarItem from './calendar-item'
import Loader from '~base/components/spinner'
import Carousel from './carousel'
import Checkbox from '~base/components/base-checkbox'
import Breadcrumb from '~base/components/base-breadcrumb'
import Select from './projects/detail-tabs/select'
import _ from 'lodash'
import Cal from './cal'

const colors = {
  1: {
    rangeClass: 'calendar-range-forecast',
    rangeClassStart: 'limit-forecast'
  },
  2: {
    rangeClass: 'calendar-range-sales',
    rangeClassStart: 'limit-sales'
  },
  3: {
    rangeClass: 'calendar-range-adjustments',
    rangeClassStart: 'limit-adjustments'
  },
  4: {
    rangeClass: 'calendar-range-approve',
    rangeClassStart: 'limit-approve'
  },
  5: {
    rangeClass: 'calendar-range-consolidate',
    rangeClassStart: 'limit-consolidate'
  }
}

class Calendar extends Component {
  constructor (props) {
    super(props)
    this.state = {
      startWeekDate: moment().utc(),
      highlightDates: [],
      showWeekNumbers: true,
      selectedYear: moment().utc().get('year'),
      selectedCycle: ''
    }
  }
  async getDates () {
    const map = new Map()
    this.state.data.map((date) => {
      if (date.year === this.state.selectedYear) {
        const key = date.month
        const collection = map.get(key)
        if (!collection) {
          map.set(key, [date])
        } else {
          collection.push(date)
        }
      }
    })

    var periods = []

    for (let i = 0; i < Array.from(map).length; i++) {
      const element = Array.from(map)[i]
      periods.push({
        name: `Periodo ${moment.utc(element[1][0].month, 'M').format('MMMM')}`,
        month: element[1][0].month,
        weeks: element[1]
      })
    }

    let currentMonth = 0
    let month = moment.utc().month()
    for (let i = 0; i < Array.from(map).length; i++) {
      const element = Array.from(map)[i]
      if (element[0] === month) {
        currentMonth = i
      }
    }

    periods = _.orderBy(periods, ['month'], ['asc'])

    this.setState({
      periods: periods,
      currentMonth: currentMonth
    })
  }

  async getYears () {
    let url = '/app/dates'
    let res = await api.get(url, {
      start: 0,
      limit: 0,
      sort: 'year'
    })
    let years = new Set()

    res.data.map((date) => {
      years.add(date.year)
    })

    this.setState({
      years: Array.from(years),
      data: res.data
    }, () => {
      this.getDates()
    })
  }

  componentWillMount () {
    this.getYears()
    this.getPeriods()
  }

  getCarouselItems () {
    let items = this.state.periods.map((item, key) => {
      let min = moment.utc(item.weeks[1].dateStart)
      return (
        <CalendarItem
          key={key}
          showWeekNumbers={this.state.showWeekNumbers}
          weeks={item.weeks}
          openToDate={min}
        />
      )
    })

    items.push(<div key={this.state.periods.length + 1} className='notification vertical'>No hay más información que mostrar</div>)

    return items
  }

  showWeeks () {
    this.setState({
      showWeekNumbers: !this.state.showWeekNumbers
    })
  }

  async filterChangeHandler (name, value) {
    if (name === 'year') {
      this.setState({
        selectedYear: value
      }, () => {
        this.getDates()
        this.getPeriods()
      })
    } else if (name === 'cycle') {
      this.setState({
        selectedCycle: value
      }/* , () => {
        this.getDates()
        this.getPeriods()
      } */)
    }
  }

  async getPeriods () {
    let org = '7828a985-7731-4ebb-83ff-2ce0e109fd8c'
    let url = '/app/periods/' + org

    let res = await api.get(url)

    if (res) {
      let cycles = _(res.data)
        .groupBy(x => x.cycle.cycle)
        .map((value, key) => ({ cycle: key, periods: value }))
        .value()
        .filter((item) => { return moment.utc(item.periods[0].dateEnd).get('year') === this.state.selectedYear })

      console.log(cycles)

      this.setState({
        cycles: cycles
      })
    }
  }

  makeStartDate (date) {
    let d = {}
    d[moment.utc(date).format('YYYY-MM-DD')] = {
      date: moment.utc(date),
      isRange: false,
      isRangeEnd: false,
      isRangeStart: false,
      isToday: true,
      isActive: false,
      isTooltip: true,
      tooltipText: 'Inicio del ciclo'
    }
    return d
  }

  makeEndDate (date) {
    let d = {}
    d[moment.utc(date).format('YYYY-MM-DD')] = {
      date: moment.utc(date),
      isRange: false,
      isRangeEnd: false,
      isRangeStart: false,
      isToday: true,
      isActive: false,
      isTooltip: true,
      tooltipText: 'Fin del ciclo'
    }
    return d
  }

  makeRange (start, end, key) {
    let s = moment.utc(start)
    let e = moment.utc(end)
    let range = {}
    range[s.format('YYYY-MM-DD')] = {
      date: s,
      isRange: true,
      isRangeEnd: false,
      isRangeStart: true,
      isToday: false,
      isActive: true,
      isTooltip: true,
      tooltipText: 'Inicio de periodo ' + key,
      rangeClass: colors[key].rangeClass,
      rangeClassStart: colors[key].rangeClassStart
    }

    while (s.format() !== e.format()) {
      s = s.add(1, 'day')
      range[s.format('YYYY-MM-DD')] = {
        date: s,
        isRange: true,
        isRangeEnd: false,
        isRangeStart: false,
        isToday: false,
        isActive: false,
        isTooltip: true,
        tooltipText: 'Periodo ' + key,
        rangeClass: colors[key].rangeClass
      }
    }

    range[e.format('YYYY-MM-DD')] = {
      date: s,
      isRange: true,
      isRangeEnd: true,
      isRangeStart: false,
      isToday: false,
      isActive: true,
      isTooltip: true,
      rangeClass: colors[key].rangeClass,
      rangeClassEnd: colors[key].rangeClassStart,
      tooltipText: 'Fin de periodo ' + key
    }
    return range
  }

  makeDates (cycle, periods) {
    let dates = {}

    periods.map((item, key) => {
      dates = {
        ...dates,
        ...this.makeRange(item.dateStart, item.dateEnd, key + 1)
      }
    })
    let start = this.makeStartDate(cycle.dateStart)
    dates[Object.keys(start)[0]] = Object.values(start)[0]
    let end = this.makeEndDate(cycle.dateEnd)
    dates[Object.keys(end)[0]] = Object.values(end)[0]
    return dates
  }

  async changePeriod (item, value, type) {
    let org = '7828a985-7731-4ebb-83ff-2ce0e109fd8c'
    let url = '/app/periods/' + org

    let res = await api.post(url, {
      startDate: type === 'start' ? moment.utc(value).format() : item.dateStart,
      endDate: type === 'start' ? item.dateEnd : moment.utc(value).format()
    })

    if (res) {
      console.log(res)
    }
  }

  changeCycle (item, value) {
    let cycles = this.state.cycles
    for (const c of cycles) {
      if (c.cycle === item.cycle) {
        console.log('find', value)
      }
    }
  }

  render () {
    if (!this.state.periods) {
      return <Loader />
    }

    return (

      <div className='calendar-view'>
        <div className='section-header'>
          <h2>Calendario</h2>
        </div>

        <Breadcrumb
          path={[
            {
              path: '/',
              label: 'Inicio',
              current: false
            },
            {
              path: '/calendario',
              label: 'Calendario',
              current: true
            }
          ]}
          align='left'
          />

        <div className='section level selects'>
          <div className='level-left'>
            <div className='level-item'>
              <Select
                label='Año'
                name='year'
                value={this.state.selectedYear}
                type='integer'
                placeholder='Seleccionar'
                options={this.state.years}
                onChange={(name, value) => { this.filterChangeHandler(name, value) }}
                />
            </div>
            <div className='level-item'>
              {this.state.cycles &&
              <Select
                label='Ciclo'
                name='cycle'
                value={this.state.selectedCycle}
                placeholder='Todos los ciclos'
                options={this.state.cycles.map(item => { return item.cycle })}
                onChange={(name, value) => { this.filterChangeHandler(name, value) }}
              />}
            </div>
            <div className='level-item'>
              <Checkbox
                label='Mostrar número de semana'
                handleCheckboxChange={(e) => this.showWeeks()}
                key='showWeeks'
                checked={this.state.showWeekNumbers}
                />
            </div>

          </div>
        </div>

        <div className='columns is-multiline is-centered'>

          {this.state.cycles && this.state.cycles.map((item, key) => {
            let cycle = item.periods[0].cycle
            let date = moment.utc(cycle.dateStart)
            if (this.state.selectedYear === date.get('year')) {
              if (!this.state.selectedCycle) {
                return (
                  <div key={key} className='column is-narrow'>
                    <Cal
                      showWeekNumber={this.state.showWeekNumbers}
                      date={date}
                      minDate={date}
                      maxDate={date}
                      dates={this.makeDates(cycle, item.periods)} />
                  </div>
                )
              } else if (item.cycle === this.state.selectedCycle) {
                let single = Object.create(item)
                return (
                  <div className='columns'>
                    <div className='column'>
                      <div className='field'>
                        <label className='label'>Inicio de ciclo</label>
                        <div className='control'>
                          <input className='input' type='date'
                            value={moment.utc(single.periods[0].cycle.dateStart).format('YYYY-MM-DD')} />
                        </div>
                      </div>
                      <div className='field'>
                        <label className='label'>Fin de ciclo</label>
                        <div className='control'>
                          <input className='input' type='date'
                            value={moment.utc(single.periods[0].cycle.dateEnd).format('YYYY-MM-DD')} />
                        </div>
                      </div>
                      <hr />
                      {single.periods.map((item, key) => {
                        return (
                          <div key={key} className='field'>
                            <label className='label'>Periodo {key + 1}</label>
                            <div className='control'>
                              <div className='field is-grouped'>
                                <div className='control'>
                                  <div className='field'>
                                    <label className='label'>Inicio</label>
                                    <div className='control'>
                                      <input className='input' type='date'
                                        value={moment.utc(item.dateStart).format('YYYY-MM-DD')}
                                        onChange={(e) => this.changePeriod(item, e.target.value, 'start')} />
                                    </div>
                                  </div>
                                </div>
                                <div class='control'>
                                  <div className='field'>
                                    <label className='label'>Fin</label>
                                    <div className='control'>
                                      <input className='input' type='date'
                                        value={moment.utc(item.dateEnd).format('YYYY-MM-DD')}
                                        onChange={(e) => this.changePeriod(item, e.target.value, 'end')} />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <div className='column is-narrow'>
                      <Cal
                        showWeekNumber={this.state.showWeekNumbers}
                        date={date}
                        minDate={date}
                        maxDate={date}
                        dates={this.makeDates(single.periods[0].cycle, single.periods)} />
                    </div>
                  </div>

                )
              }
            }
          })}
        </div>
      </div>
    )
  }
}

export default Page({
  path: '/calendario',
  exact: true,
  validate: loggedIn,
  component: Calendar,
  title: 'Calendario',
  icon: 'calendar'
})
