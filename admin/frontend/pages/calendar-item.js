import React, { Component } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import moment from 'moment'

class CalendarItem extends Component {
  constructor(props) {
    super(props)
    this.state = {
      highlightDates: [],
      weekNumbers: []
    }
    this.weekNumber = 0
  }

  componentWillMount() {
    this.weekHightlight()
  }

  formatWeek = (a) => {
    
    /* console.log(this.weekNumber)
    console.log(a.week()) */
    let index = this.state.weekNumbers.indexOf(a.get('week'))
    if( index !== -1){
      this.weekNumber++
      return (<div className={'week' + (index + 1)}>{a.week()}</div>)
    }
    else{
      this.weekNumber = 0
      return (<div>{a.week()}</div>)
    }
    
  }

  

  isWeekDay(date) {
    if (date.format('dddd') !== 'domingo') {
      return true
    }
  }

  getRangeOfDates(start, end, key, arr = [start.startOf(key)]) {
    if (start.isAfter(end))
      throw new Error('start must precede end')

    let next = moment(start).add(1, key).startOf(key);
    if (!this.isWeekDay(next)){
      console.log("DOMINGO")
      next = moment(start).add(2, key).startOf(key);
    }
    
    if (next.isAfter(end, key))
      return arr;

    return this.getRangeOfDates(next, end, key, arr.concat(next));
  }

  weekHightlight(date) {
    let monthWeeks = [
      {
        'monthWeek1': []
      },
      {
        'monthWeek2': []
      },
      {
        'monthWeek3': []
      },
      {
        'monthWeek4': []
      },
      {
        'monthWeek5': []
      }
    ]

    const weeks = this.props.weeks
    let w = []

    for (let i = 0; i < weeks.length; i += 5) {

      console.log('*******************************')
      console.log(weeks[i].dateStart)
      console.log(weeks[i].dateEnd)
      console.log(weeks[i].week)

      w = []
      w.push(weeks[i].week)
      monthWeeks[0].monthWeek1 =
        this.getRangeOfDates(
          moment(weeks[i].dateStart),
          moment(weeks[i].dateEnd),
          'days'
        )
      if (weeks[i + 1]) {
        monthWeeks[1].monthWeek2 =
          this.getRangeOfDates(
            moment(weeks[i + 1].dateStart),
            moment(weeks[i + 1].dateEnd),
            'days'
          )
        w.push(weeks[i+1].week)
          
      }
      if (weeks[i + 2]) {

        monthWeeks[2].monthWeek3 =
          this.getRangeOfDates(
            moment(weeks[i + 2].dateStart),
            moment(weeks[i + 2].dateEnd),
            'days'
          )

        w.push(weeks[i+2].week)
          
      }
      if (weeks[i + 3]) {

        monthWeeks[3].monthWeek4 =
          this.getRangeOfDates(
            moment(weeks[i + 3].dateStart),
            moment(weeks[i + 3].dateEnd),
            'days'
          )

        w.push(weeks[i+3].week)
          
      }
      if (weeks[i + 4]) {

        monthWeeks[4].monthWeek5 =
          this.getRangeOfDates(
            moment(weeks[i + 4].dateStart),
            moment(weeks[i + 4].dateEnd),
            'days'
          )
        w.push(weeks[i+4].week)

      }
      console.log(monthWeeks)
      
    }


    this.setState({
      highlightDates: monthWeeks,
      weekNumbers: w
    })

  }
  render() {
    return (
      <DatePicker
        dateFormat='DD/MM/YYYY'
        inline
        showWeekNumbers
        formatWeekNumber={this.formatWeek}
        highlightDates={this.state.highlightDates}
        openToDate={this.props.openToDate}
        filterDate={this.isWeekDay}
        fixedHeight
        minDate={this.props.openToDate.startOf('month')}
        maxDate={this.props.openToDate.endOf('month')}
      />
    )
  }
}

export default CalendarItem
