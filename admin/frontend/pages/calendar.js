import React, { Component } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import Page from '~base/page'
import { loggedIn } from '~base/middlewares/'
import api from '~base/api'
import moment from 'moment'
import CalendarItem from './calendar-item'
import Loader from '~base/components/spinner'

class Calendar extends Component {
  constructor (props) {
    super(props)
    this.state = {
      startWeekDate: moment(),
      highlightDates: []
    }
  }
  async getDates () {
    let url = '/admin/dates'
    let res = await api.get(url, {
      start: 0,
      limit: 0,
      sort: 'year'
    })
    console.log(res.data)

    const map = new Map()
    res.data.map((date) => {
      const key = date.month
      const collection = map.get(key)
      if (!collection) {
        map.set(key, [date])
      } else {
        collection.push(date)
      }
    })

    console.log(Array.from(map))

    var periods = []

    for (let i = 0; i < Array.from(map).length; i++) {
      const element = Array.from(map)[i]
      periods.push({
        name: `Periodo ${moment(element[1][0].dateEnd).format('MMMM')}`,
        weeks: element[1]
      })
    }

    this.setState({
      periods: periods
    })
  }

  componentWillMount () {
    this.getDates()
  }

  render () {
    if (!this.state.periods) {
      return <Loader />
    }

    return (
      <div>
        {this.state.periods.map((item) => {
          let min = moment(item.weeks[1].dateStart)
          return (
            <CalendarItem
              weeks={item.weeks}
              openToDate={min}
            />
          )
        })}
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
