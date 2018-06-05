import React, { Component } from 'react'
import moment from 'moment'
import classNames from 'classnames'

class Cal extends Component {
  constructor (props) {
    super(props)
    this.state = {
      date: this.props.date || moment.utc(),
      minDate: this.props.minDate || undefined,
      maxDate: this.props.maxDate || undefined,
      weekDayHeader: this.weekHeader(),
      dateSelected: this.props.date || moment.utc(),
      startDate: this.props.startDate || moment.utc(),
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
    const clonedDate = moment.utc(this.state.date)
    clonedDate.add(num, 'month')

    if (this.state.minDate && this.state.maxDate) {
      return clonedDate.isBetween(this.state.minDate, this.state.maxDate, 'days', '[]')
    } else if (!this.state.minDate && this.state.maxDate) {
      return clonedDate.isBefore(this.state.minDate)
    } else if (this.state.minDate && !this.state.maxDate) {
      return clonedDate.isAfter(this.state.maxDate)
    } else {
      return true
    }
  }

  weekHeader () {
    let weekDays = []
    for (let i = 0; i < 7; i++) {
      weekDays.push(moment.utc().weekday(i).format('ddd'))
    }
    return weekDays
  }

  makeGrid () {
    let gridArr = []

    const firstDayDate = moment.utc(this.state.date).startOf('month')
    const initialEmptyCells = firstDayDate.weekday()
    const lastDayDate = moment.utc(this.state.date).endOf('month')
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
        obj.available = true
      }
      gridArr.push(obj)
    }

    this.setState({
      calendarDays: gridArr
    })
  }

  isAvailable (num) {
    let dateToCheck = this.dateFromNum(num, this.navDate)
    if (dateToCheck.isBefore(moment.utc(), 'day')) {
      return false
    } else {
      return true
    }
  }

  dateFromNum (num) {
    let returnDate = moment.utc(this.state.date)
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

    if (this.state.dates !== next.dates) {
      this.setState({
        dates: next.dates
      }, () => {
        this.makeGrid()
      })
    }
  }

  makeWeekNumber () {
    let weeks = {}
    let numbers = []
    this.state.calendarDays.map((item, key) => {
      if (item.available && item.value !== 0) {
        if (item.value === 1 ||
          item.value === 8 ||
          item.value === 15 ||
          item.value === 22 ||
          item.value >= 28) {
          let w = this.dateFromNum(item.value).format('W')
          numbers.push(Number(w))
          weeks[w] =
            <div key={'week' + w} className='calendar-date'>
              <button className='date-item week-number tooltip'
                data-tooltip={'Semana ' + w}>
                {w}
              </button>
            </div>
        }
      }
    })

    if (numbers.find((element) => { return element > 50 }) !== undefined &&
      numbers.find((element) => { return element === 1 }) !== undefined &&
      numbers.find((element) => { return element === 49 }) === undefined) {
      let val = Object.values(weeks)
      val.unshift(val[val.length - 1])
      val.pop()
      return val
    } else if (numbers.find((element) => { return element > 50 }) !== undefined &&
      numbers.find((element) => { return element === 1 }) !== undefined &&
      numbers.find((element) => { return element === 49 }) !== undefined) {
      let val = Object.values(weeks)
      let item = val.shift()
      val.push(item)
      return val
    }

    return Object.values(weeks)
  }
  makeCalendar () {
    let calendar = []

    this.state.calendarDays.map((item, key) => {
      if (item.value !== 0) {
        let dayDate = this.dateFromNum(item.value).format('YYYY-MM-DD')

        let calDate = this.state.dates[dayDate]
        if (calDate) {
          calendar.push(
            <div key={dayDate} className={
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
          calendar.push(
            <div key={key} className={
              classNames('calendar-date', {
                'is-disabled': !item.available
              })
            }
            >
              <button onClick={() => { this.selectDay(item, 'inicio') }}
                className='date-item'
              >{item.value}</button>
            </div>
          )
        }
      } else {
        calendar.push(
          <div key={key} className='calendar-date'>
            <button className='date-item calendar-not' />
          </div>
        )
      }
    })
    return calendar
  }
  render () {
    return (
      <div>
        <div className='calendar'>
          <div className='calendar-nav'>
            <div className={this.canChange(-1) ? 'calendar-nav-previous-month' : 'is-invisible'}>
              <button className='button is-small is-primary'
                onClick={() => { this.changeMonth(-1) }}>
                <svg viewBox='0 0 50 80' space='preserve'>
                  <polyline fill='none' strokeWidth='.5em' strokeLinecap='round' strokeLinejoin='round' points='45.63,75.8 0.375,38.087 45.63,0.375 ' />
                </svg>
              </button>
            </div>
            <div className='calendar-month is-capitalized'>{this.state.date.format('MMMM YYYY')}</div>
            <div className={this.canChange(1) ? 'calendar-nav-next-month' : 'is-invisible'}>
              <button className='button is-small is-primary' onClick={() => { this.changeMonth(1) }}>
                <svg viewBox='0 0 50 80' space='preserve'>
                  <polyline fill='none' strokeWidth='.5em' strokeLinecap='round' strokeLinejoin='round' points='0.375,0.375 45.63,38.087 0.375,75.8 ' />
                </svg>
              </button>
            </div>
          </div>
          <div className='calendar-container'>

            <div className='columns is-gapless'>
              {this.props.showWeekNumber &&
              <div className='column is-narrow week-column'>
                <div className='calendar-header'>
                  <div className='calendar-date'>#</div>
                </div>
                {
                  this.state.calendarDays &&
                  this.makeWeekNumber()
                }
              </div>}
              <div className='column'>
                <div className='calendar-header'>
                  {this.state.weekDayHeader.map((item, key) => {
                    return (
                      <div key={item} className='calendar-date'>{item}</div>
                    )
                  })}
                </div>
                <div className='calendar-body'>

                  {
                    this.state.calendarDays &&
                    this.makeCalendar()
                  }
                </div>
              </div>

            </div>
          </div>
        </div >

      </div>
    )
  }
}

export default Cal
