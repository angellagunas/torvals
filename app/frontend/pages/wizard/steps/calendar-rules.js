import React, { Component } from 'react'
import moment from 'moment'
import classNames from 'classnames'

class CalendarRules extends Component {
  constructor (props) {
    super(props)
    this.state = {
      date: this.props.date || moment(),
      minDate: this.props.minDate || undefined,
      maxDate: this.props.maxDate || undefined,
      weekDayHeader: this.weekHeader(),
      dateSelected: this.props.date || moment(),
      startDate: this.props.startDate || moment(),
      salesDate: this.props.salesDate || moment(),
      forecastDate: this.props.forecastDate || moment(),
      adjustmentDate: this.props.adjustmentDate || moment(),
      approveDate: this.props.approveDate || moment(),
      consolidationDate: this.props.consolidationDate || moment()
    }
    moment.locale(this.props.locale || 'es')
  }

  componentWillMount () {
    this.makeGrid()
  }

  changeMonth (num) {
    let date = this.state.date
    if (this.canChange(num)) {
      this.setState({
        date: date.add(num, 'month')
      }, () => {
        this.makeGrid()
      })
    }
  }

  canChange (num) {
    const clonedDate = moment(this.state.date)
    clonedDate.add(num, 'month')

    if (this.state.minDate && this.state.maxDate) {
      return clonedDate.isBetween(this.state.minDate, this.state.maxDate)
    } else if (this.state.minDate && !this.state.maxDate) {
      return clonedDate.isBefore(this.state.minDate)
    } else if (!this.state.minDate && this.state.maxDate) {
      return clonedDate.isAfter(this.state.maxDate)
    } else {
      return true
    }
  }

  weekHeader () {
    let weekDays = []
    for (let i = 0; i < 7; i++) {
      weekDays.push(moment().weekday(i).format('ddd'))
    }
    return weekDays
  }

  makeGrid () {
    let gridArr = []

    const firstDayDate = moment(this.state.date).startOf('month')
    const initialEmptyCells = firstDayDate.weekday()
    const lastDayDate = moment(this.state.date).endOf('month')
    const lastEmptyCells = 6 - lastDayDate.weekday()
    const daysInMonth = this.state.date.daysInMonth()
    const arrayLength = initialEmptyCells + lastEmptyCells + daysInMonth

    for (let i = 0; i < arrayLength; i++) {
      let obj = {}
      if (i < initialEmptyCells || i > initialEmptyCells + daysInMonth - 1) {
        obj.value = 0
        obj.available = false
      } else {
        obj.value = i - initialEmptyCells + 1
        obj.available = true // this.isAvailable(i - initialEmptyCells + 1)
      }
      gridArr.push(obj)
    }

    this.setState({
      calendarDays: gridArr
    })
  }

  isAvailable (num) {
    let dateToCheck = this.dateFromNum(num, this.navDate)
    if (dateToCheck.isBefore(moment(), 'day')) {
      return false
    } else {
      return true
    }
  }

  dateFromNum (num, referenceDate) {
    let returnDate = moment(referenceDate)
    return returnDate.date(num)
  }

  selectDay (day, id) {
    if (!this.props.disabled) {
      if (day.available) {
        this.setState({
          dateSelected: this.dateFromNum(day.value, this.state.date)
        })
      }
      if (this.props.onChange) {
        this.props.onChange(this.dateFromNum(day.value, this.state.date))
      }
    }
  }

  getTooltip (item) {
    if (!this.props.limits) {
      return
    }

    if (item === Number(this.props.limits.sales_upload)) {
      return 'Límite para subir ventas'
    } else if (item === Number(this.props.limits.forecast_creation)) {
      return 'Límite para crear y aprobar forecast'
    } else if (item === Number(this.props.limits.range_adjustment)) {
      return 'Límite para realizar ajustes'
    } else if (item === Number(this.props.limits.range_adjustmentRequest)) {
      return 'Límite para aprobar ajustes'
    } else if (item === Number(this.props.limits.consolidation)) {
      return 'Límite para conciliar'
    }
  }

  render () {
    return (
      <div>
        <div className='calendar'>
          <div className='calendar-nav'>
            <div className='calendar-nav-previous-month'>
              <button className='button is-small is-primary'
                onClick={() => { this.changeMonth(-1) }}>
                <svg viewBox='0 0 50 80' space='preserve'>
                  <polyline fill='none' strokeWidth='.5em' strokeLinecap='round' strokeLinejoin='round' points='45.63,75.8 0.375,38.087 45.63,0.375 ' />
                </svg>
              </button>
            </div>
            <div className='calendar-month is-capitalized'>{this.state.date.format('MMMM YYYY') }</div>
            <div className='calendar-nav-next-month'>
              <button className='button is-small is-primary' onClick={() => { this.changeMonth(1) }}>
                <svg viewBox='0 0 50 80' space='preserve'>
                  <polyline fill='none' strokeWidth='.5em' strokeLinecap='round' strokeLinejoin='round' points='0.375,0.375 45.63,38.087 0.375,75.8 ' />
                </svg>
              </button>
            </div>
          </div>
          <div className='calendar-container'>
            <div className='calendar-header'>
              {this.state.weekDayHeader.map((item, key) => {
                return (
                  <div key={key} className='calendar-date'>{item}</div>
                )
              })}
            </div>
            <div className='calendar-body'>
              {
              this.state.calendarDays && this.state.calendarDays.map((item, key) => {
                if (item.value !== 0) {
                  if (this.props.limits) {
                    // console.log('date', this.dateFromNum(item.value, this.state.date).format('DD-MM-YYYY'))
                    // console.log('dates', this.props.limits)
                    // console.log(this.props.limits.startDates.indexOf(this.dateFromNum(item.value, this.state.date).format('DD-MM-YYYY')))
                    console.log(this.props.limits)
                  }
                  let date = this.dateFromNum(item.value, this.state.date).format('YYYY-MM-DD')
                  let isStart = this.props.limits &&
                  this.props.limits.startDates.indexOf(date) !== -1

                  let isEnd = this.props.limits &&
                    this.props.limits.endDates.indexOf(date) !== -1

                  let isSalesLimit = this.props.limits &&
                    this.props.limits.sales_upload.indexOf(date) !== -1

                  let isForecastLimit = this.props.limits &&
                    this.props.limits.forecast_creation.indexOf(date) !== -1

                  let isAdjustmentLimit = this.props.limits &&
                    this.props.limits.range_adjustment.indexOf(date) !== -1

                  let isApproveLimit = this.props.limits &&
                    this.props.limits.range_adjustmentRequest.indexOf(date) !== -1

                  let date2 = this.dateFromNum(item.value, this.state.date)
                  console.log(date)
                  return (
                    <div key={key} className={
                      classNames('calendar-date', {
                        'is-disabled': !item.available,

                        'calendar-range calendar-range-sales':
                          this.props.limits &&
                          date2
                          .isBetween(
                            this.props.limits.startDates[this.state.date.get('month')],
                            this.props.limits.sales_upload[this.state.date.get('month')],
                            'days', '()'),

                        'calendar-range calendar-range-sales calendar-range-end': isSalesLimit,

                        'calendar-range calendar-range-forecast':
                          this.props.limits &&
                          date2
                            .isBetween(
                            this.props.limits.sales_upload[this.state.date.get('month')],
                              this.props.limits.forecast_creation[this.state.date.get('month')],
                              'days', '()'),

                        'calendar-range calendar-range-forecast calendar-range-end': isForecastLimit,

                        'calendar-range calendar-range-adjustments':
                          this.props.limits &&
                          date2
                            .isBetween(
                            this.props.limits.forecast_creation[this.state.date.get('month')],
                              this.props.limits.range_adjustment[this.state.date.get('month')],
                              'days', '()'),

                        'calendar-range calendar-range-adjustments calendar-range-end': isAdjustmentLimit,

                        'calendar-range calendar-range-approve':
                          this.props.limits &&
                          date2
                            .isBetween(
                            this.props.limits.range_adjustment[this.state.date.get('month')],
                              this.props.limits.range_adjustmentRequest[this.state.date.get('month')],
                              'days', '()'),

                        'calendar-range calendar-range-approve calendar-range-end': isApproveLimit,

                        'calendar-range calendar-range-consolidate':
                          this.props.limits &&
                          date2
                            .isBetween(
                              this.props.limits.range_adjustmentRequest[this.state.date.get('month')],
                              this.props.limits.endDates[this.state.date.get('month')],
                              'days', '()'),

                        'calendar-range calendar-range-consolidate calendar-range-end': isEnd

                      })
                      }
                      >
                      <button onClick={() => { this.selectDay(item, 'inicio') }}
                        className={
                          classNames('date-item', {
                            'is-today tooltip': isStart,
                            'is-active limit-sales tooltip': isSalesLimit,
                            'is-active limit-forecast tooltip': isForecastLimit,
                            'is-active limit-adjustments tooltip': isAdjustmentLimit,
                            'is-active limit-approve tooltip': isApproveLimit,
                            'is-active limit-consolidate tooltip': isEnd
                          })
                          }
                        data-tooltip={classNames({
                          'Inicio de ciclo': isStart,
                          'Límite para subir ventas': isSalesLimit,
                          'Límite para crear y aprobar forecast': isForecastLimit,
                          'Límite para realizar ajustes': isAdjustmentLimit,
                          'Límite para aprobar ajustes': isApproveLimit,
                          'Fin de ciclo límite para conciliar': isEnd
                        })}
                          >{item.value}</button>
                    </div>
                  )
                } else {
                  return (
                    <div className='calendar-date'>
                      <button className='date-item calendar-not' />
                    </div>
                  )
                }
              })
            }
              {/* <div className='calendar-date'><button className='date-item'>1</button></div>
              <div className='calendar-date'><button className='date-item'>2</button></div>
              <div className='calendar-date'><button className='date-item'>3</button></div>
              <div className='calendar-date tooltip' data-tooltip='Today'><button className='date-item is-today'>4</button></div>
              <div className='calendar-date tooltip' data-tooltip='Not available' disabled=''><button className='date-item'>5</button></div>
              <div className='calendar-date'><button className='date-item'>6</button></div>
              <div className='calendar-date'><button className='date-item'>7</button></div>
              <div className='calendar-date tooltip' data-tooltip='You have appointments'><button className='date-item'>8</button></div>
              <div className='calendar-date'><button className='date-item'>9</button></div>
              <div className='calendar-date'><button className='date-item'>10</button></div>
              <div className='calendar-date'><button className='date-item'>11</button></div>
              <div className='calendar-date'><button className='date-item'>12</button></div>
              <div className='calendar-date'><button className='date-item'>13</button></div>
              <div className='calendar-date'><button className='date-item'>14</button></div>
              <div className='calendar-date'><button className='date-item'>15</button></div>
              <div className='calendar-date calendar-range calendar-range-start'><button className='date-item is-active'>16</button></div>
              <div className='calendar-date calendar-range'><button className='date-item'>17</button></div>
              <div className='calendar-date calendar-range'><button className='date-item'>18</button></div>
              <div className='calendar-date calendar-range'><button className='date-item'>19</button></div>
              <div className='calendar-date calendar-range calendar-range-end'><button className='date-item is-active'>20</button></div>
              <div className='calendar-date'><button className='date-item'>21</button></div>
              <div className='calendar-date'><button className='date-item'>22</button></div>
              <div className='calendar-date'><button className='date-item'>23</button></div>
              <div className='calendar-date'><button className='date-item'>24</button></div>
              <div className='calendar-date'><button className='date-item'>25</button></div>
              <div className='calendar-date'><button className='date-item'>26</button></div>
              <div className='calendar-date'><button className='date-item'>27</button></div>
              <div className='calendar-date'><button className='date-item'>28</button></div>
              <div className='calendar-date'><button className='date-item'>29</button></div>
              <div className='calendar-date'><button className='date-item'>30</button></div>
              <div className='calendar-date'><button className='date-item'>31</button></div>
              <div className='calendar-date is-disabled'><button className='date-item'>1</button></div> */}
            </div>
          </div>
        </div >

      </div>
    )
  }
}

export default CalendarRules
