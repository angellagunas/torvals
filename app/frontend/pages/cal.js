import React, { Component } from 'react'
import moment from 'moment'
import classNames from 'classnames'

class Cal extends Component {
  constructor (props) {
    super(props)
    this.state = {
      date: this.props.date || moment(),
      minDate: this.props.minDate || undefined,
      maxDate: this.props.maxDate || undefined,
      weekDayHeader: this.weekHeader(),
      dateSelected: this.props.date || moment(),
      startDate: this.props.startDate || moment(),
      dates: this.props.dates || []
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

  dateFromNum (num) {
    let returnDate = moment(this.state.date)
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

  componentWillReceiveProps (next) {
    if (this.state.date !== next.date) {
      this.setState({
        date: next.date
      }, () => {
        this.makeGrid()
      })
    }
    if (this.props.limits !== next.limits) {
      this.makeGrid()
    }
  }

  render () {
    return (
      <div>
        <div className='calendar'>
          <div className='calendar-nav'>
            <div className={this.canChange(-1) ? 'calendar-nav-previous-month' : 'is-hidden'}>
              <button className='button is-small is-primary'
                onClick={() => { this.changeMonth(-1) }}>
                <svg viewBox='0 0 50 80' space='preserve'>
                  <polyline fill='none' strokeWidth='.5em' strokeLinecap='round' strokeLinejoin='round' points='45.63,75.8 0.375,38.087 45.63,0.375 ' />
                </svg>
              </button>
            </div>
            <div className='calendar-month is-capitalized'>{this.state.date.format('MMMM YYYY')}</div>
            <div className={this.canChange(1) ? 'calendar-nav-next-month' : 'is-hidden'}>
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
                    let dayDate = this.dateFromNum(item.value).format('YYYY-MM-DD')

                    let calDate = this.state.dates[dayDate]
                    if (calDate) {
                      return (
                        <div key={key} className={
                          classNames('calendar-date', {
                            'is-disabled': !item.available,
                            'calendar-range': calDate.isRange,
                            [`${calDate.rangeClass}`]: calDate.isRange,
                            'calendar-range-start': calDate.isRangeStart,
                            'calendar-range-end': calDate.isRangeEnd
                          })
                        }
                        >
                          <button onClick={() => { this.selectDay(item, 'inicio') }}
                            className={
                              classNames('date-item', {
                                'is-today': calDate.isToday,
                                'tooltip': calDate.isTooltip,
                                'is-active': calDate.isActive,
                                [`${calDate.rangeClassStart}`]: calDate.isRangeStart,
                                [`${calDate.rangeClassEnd}`]: calDate.isRangeEnd
                              })
                            }
                            data-tooltip={calDate.tooltipText}
                          >{item.value}</button>
                        </div>
                      )
                    } else if (!calDate) {
                      return (
                        <div key={key} className={
                          classNames('calendar-date', {
                            'is-disabled': !item.available
                          })
                        }
                        >
                          <button onClick={() => { this.selectDay(item, 'inicio') }}
                            className={
                              classNames('date-item')
                            }
                          /* data-tooltip={classNames({
                            'Inicio de ciclo': isStart,
                            'Límite para subir ventas': isSalesLimit,
                            'Límite para crear y aprobar forecast': isForecastLimit,
                            'Límite para realizar ajustes': isAdjustmentLimit,
                            'Límite para aprobar ajustes': isApproveLimit,
                            'Fin de ciclo límite para conciliar': isEnd
                          })} */
                          >{item.value}</button>
                        </div>
                      )
                    }
                  } else {
                    return (
                      <div className='calendar-date'>
                        <button className='date-item calendar-not' />
                      </div>
                    )
                  }
                })
              }
            </div>
          </div>
        </div >

      </div>
    )
  }
}

export default Cal
