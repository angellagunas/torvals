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

class Calendar extends Component {
  constructor (props) {
    super(props)
    this.state = {
      startWeekDate: moment(),
      highlightDates: [],
      showWeekNumbers: true
    }
  }
  async getDates () {
    let url = '/app/dates'
    let res = await api.get(url, {
      start: 0,
      limit: 0,
      sort: 'year'
    })

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

    var periods = []

    for (let i = 0; i < Array.from(map).length; i++) {
      const element = Array.from(map)[i]
      periods.push({
        name: `Periodo ${moment(element[1][0].dateEnd).format('MMMM')}`,
        weeks: element[1]
      })
    }

    let currentMonth = 0
    let month = moment().month()
    for (let i = 0; i < Array.from(map).length; i++) {
      const element = Array.from(map)[i]
      if (element[0] === month) {
        currentMonth = i
      }
    }

    this.setState({
      periods: periods,
      currentMonth: currentMonth
    })
  }

  componentWillMount () {
    this.getDates()
  }

  getCarouselItems () {
    let items = this.state.periods.map((item, key) => {
      let min = moment(item.weeks[1].dateStart)
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

  render () {
    if (!this.state.periods) {
      return <Loader />
    }

    return (
      <div className='section is-paddingless-top pad-sides'>
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
        <h1 className='is-size-3 is-padding-top-small is-padding-bottom-small'>Calendario</h1>
        <div className='container is-margin-top'>
          <div className='columns is-padding-top-small'>
            <div className='column is-three-quarters-fullhd is-10-widescreen is-12-desktop calendar'>
              <Checkbox
                label='Mostrar número de semana'
                handleCheckboxChange={(e) => this.showWeeks()}
                key='showWeeks'
                checked={this.state.showWeekNumbers}
            />
              <br />
              <Carousel
                title=''
                initialPosition={this.state.currentMonth}
            >
                {this.getCarouselItems()}
              </Carousel>
            </div>
          </div>
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
