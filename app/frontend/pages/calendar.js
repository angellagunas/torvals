import React, { Component } from 'react'
import 'react-datepicker/dist/react-datepicker.css'
import Page from '~base/page'
import { loggedIn } from '~base/middlewares/'
import api from '~base/api'
import moment from 'moment'
import Loader from '~base/components/spinner'
import Checkbox from '~base/components/base-checkbox'
import Breadcrumb from '~base/components/base-breadcrumb'
import Select from './projects/detail-tabs/select'
import _ from 'lodash'
import Cal from './cal'
import tree from '~core/tree'

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
  },
  6: {
    rangeClass: 'calendar-range-lime',
    rangeClassStart: 'limit-lime'
  },
  7: {
    rangeClass: 'calendar-range-orange',
    rangeClassStart: 'limit-orange'
  },
  8: {
    rangeClass: 'calendar-range-teal',
    rangeClassStart: 'limit-teal'
  },
  9: {
    rangeClass: 'calendar-range-pink',
    rangeClassStart: 'limit-pink'
  },
  10: {
    rangeClass: 'calendar-range-grey',
    rangeClassStart: 'limit-grey'
  },
  11: {
    rangeClass: 'calendar-range-yellow',
    rangeClassStart: 'limit-yellow'
  },
  12: {
    rangeClass: 'calendar-range-cyan',
    rangeClassStart: 'limit-cyan'
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
    this.color = 0
  }

  componentWillMount () {
    this.getPeriods()
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
        this.getPeriods()
      })
    } else if (name === 'cycle') {
      this.setState({
        selectedCycle: value
      })
    }
  }

  async getPeriods () {
    let org = tree.get('user').currentOrganization
    let url = '/app/periods/' + org.uuid

    let res = await api.get(url)

    if (res) {
      let cycles = _(res.data)
        .groupBy(x => x.cycle.cycle)
        .map((value, key) => ({ cycle: key, periods: value }))
        .value()
        .filter((item) => { return moment.utc(item.periods[0].dateEnd).get('year') === this.state.selectedYear })

      this.setState({
        cycles: cycles,
        years: res.years
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

    if (this.color === 12) {
      this.color = 1
    } else {
      this.color++
    }

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
      rangeClass: colors[this.color].rangeClass,
      rangeClassStart: colors[this.color].rangeClassStart
    }

    while (s.format('YYYY-MM-DD') !== e.format('YYYY-MM-DD')) {
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
        rangeClass: colors[this.color].rangeClass
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
      rangeClass: colors[this.color].rangeClass,
      rangeClassEnd: colors[this.color].rangeClassStart,
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

  async changePeriod (item, value, type, key) {
    let url = '/app/periods/' + item.uuid

    let res = await api.post(url, {
      startDate: type === 'start' ? moment.utc(value).format() : item.dateStart,
      endDate: type === 'start' ? item.dateEnd : moment.utc(value).format()
    })

    if (res) {
      this.getPeriods()
    }
  }

  async changeCycle (item, value, type) {
    let cycle = item.periods[0].cycle

    let url = '/app/cycles/' + cycle.uuid

    let res = await api.post(url, {
      startDate: type === 'start' ? moment.utc(value).format() : cycle.dateStart,
      endDate: type === 'start' ? cycle.dateEnd : moment.utc(value).format()
    })

    if (res) {
      this.getPeriods()
    }
  }

  render () {
    if (!this.state.cycles) {
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
                optionValue='cycle'
                optionName='name'
                options={this.state.cycles.map(item => { return {cycle: item.cycle, name: moment.utc(item.periods[0].cycle.dateStart).format('MMMM')} })}
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
                      key={key}
                      showWeekNumber={this.state.showWeekNumbers}
                      date={date}
                      minDate={moment.utc(cycle.dateStart)}
                      maxDate={moment.utc(cycle.dateEnd)}
                      dates={this.makeDates(cycle, item.periods)} />
                  </div>
                )
              } else if (item.cycle === this.state.selectedCycle) {
                return (
                  <div key={key} className='columns'>
                    <div className='column'>
                      <div className='field'>
                        <label className='label'>Inicio de ciclo</label>
                        <div className='control'>
                          <input className='input' type='date'
                            value={moment.utc(cycle.dateStart).format('YYYY-MM-DD')}
                            onChange={(e) => this.changeCycle(item, e.target.value, 'start')} />
                        </div>
                      </div>
                      <div className='field'>
                        <label className='label'>Fin de ciclo</label>
                        <div className='control'>
                          <input className='input' type='date'
                            value={moment.utc(cycle.dateEnd).format('YYYY-MM-DD')}
                            onChange={(e) => this.changeCycle(item, e.target.value, 'end')} />
                        </div>
                      </div>
                      <hr />
                      {item.periods.map((item, key) => {
                        return (
                          <div key={moment.utc(item.dateStart).format('YYYY-MM-DD')} className='field'>
                            <label className='label'>Periodo {key + 1}</label>
                            <div className='control'>
                              <div className='field is-grouped'>
                                <div className='control'>
                                  <div className='field'>
                                    <label className='label'>Inicio</label>
                                    <div className='control'>
                                      <input className='input' type='date'
                                        value={moment.utc(item.dateStart).format('YYYY-MM-DD')}
                                        onChange={(e) => this.changePeriod(item, e.target.value, 'start', key)} />
                                    </div>
                                  </div>
                                </div>
                                <div className='control'>
                                  <div className='field'>
                                    <label className='label'>Fin</label>
                                    <div className='control'>
                                      <input className='input' type='date'
                                        value={moment.utc(item.dateEnd).format('YYYY-MM-DD')}
                                        onChange={(e) => this.changePeriod(item, e.target.value, 'end', key)} />
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
                        key={key}
                        showWeekNumber={this.state.showWeekNumbers}
                        date={date}
                        minDate={moment.utc(cycle.dateStart)}
                        maxDate={moment.utc(cycle.dateEnd)}
                        dates={this.makeDates(cycle, item.periods)} />
                    </div>
                  </div>

                )
              }
            }
          })}
        </div>
        <br />
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
