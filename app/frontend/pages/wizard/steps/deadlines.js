import React, { Component } from 'react'
import CalendarRules from './calendar-rules'
import Moment from 'moment'
import { extendMoment } from 'moment-range'
const moment = extendMoment(Moment)

class DeadLines extends Component {
  constructor (props) {
    super(props)
    this.state = {
      data: {
        sales_upload: this.props.rules.sales_upload || 0,
        forecast_creation: this.props.rules.forecast_creation || 0,
        range_adjustment: this.props.rules.range_adjustment || 0,
        range_adjustmentRequest: this.props.rules.range_adjustmentRequest || 0,
        consolidation: this.props.rules.cicleDuration * 31
      },
      dates: {
        startDates: [],
        endDates: [],
        sales_upload: [],
        forecast_creation: [],
        range_adjustment: [],
        range_adjustmentRequest: []
      },
      ranges: {
        sales_upload: [],
        forecast_creation: [],
        range_adjustment: [],
        range_adjustmentRequest: [],
        consolidation: []
      }
    }
  }

  componentWillMount () {
    this.getStartDates()
  }

  getStartDates () {
    let start = []
    let end = []

    for (let i = 0; i < 12; i++) {
      let date = moment(this.props.startDate).add(i, 'month')
      start.push(date.format('YYYY-MM-DD'))
      if (i > 0) { end.push(date.add(-1, 'day').format('YYYY-MM-DD')) }
    }

    this.setState({
      dates: {
        ...this.state.dates,
        startDates: start,
        endDates: end
      }
    }, () => {
      Object.keys(this.state.data).map(e => {
        this.getDates(e, this.state.data[e])
      })
    })
  }

  getDates (name, num) {
    if (num === 0) { return }
    let dates = []
    let r = []
    for (let i = 0; i < 12; i++) {
      let date = moment(this.props.startDate).add(i, 'month')
      dates.push(date.add(num, 'day').format('YYYY-MM-DD'))
      r.push(moment.range(moment(this.props.startDate), date.add(num, 'day')))
    }

    let aux = this.state.dates
    aux[name] = dates
    let ranges = this.state.ranges
    ranges[name] = ranges[name].concat(r)
    console.log(name, ranges[name])
    this.setState({
      dates: aux,
      ranges: ranges
    })
  }

  handleInputChange (name, value) {
    let aux = this.state.data
    aux[name] = value

    this.setState({
      data: aux
    })

    this.getDates(name, value)
  }

  render () {
    const deadlines = [
      {
        title: 'ventas',
        name: 'sales_upload'
      },
      {
        title: 'forecast',
        name: 'forecast_creation'
      },
      {
        title: 'ajustes',
        name: 'range_adjustment'
      },
      {
        title: 'aprobar',
        name: 'range_adjustmentRequest'
      },
      {
        title: 'consolidar',
        name: 'consolidation'
      }
    ]

    return (
      <div className='section'>

        <h1 className='title is-4'> Debes definir el fechas para el ciclo de operación a partir de la fecha de inicio.</h1>

        <br />
        <div className='columns'>
          <div className='column'>
            {
              deadlines.map((item) => {
                return (
                  <div className='field has-addons' key={item.name}>
                    <p className='control'>
                      <a className='button is-capitalized'>
                        {item.title}
                      </a>
                    </p>
                    <p className='control'>
                      <input className='input' type='text' placeholder='dias' name={item.name}
                        value={this.state.data[item.name]}
                        onChange={(e) => { this.handleInputChange(e.target.name, e.target.value) }}
                      />
                    </p>
                    <p className='control'>
                      <a className='button is-static'>
                        Días
                  </a>
                    </p>
                  </div>
                )
              })
            }
          </div>
          <div className='column'>
            <CalendarRules
              disabled
              date={moment(this.props.startDate)}
              limits={this.state.dates}
              />
          </div>
        </div>

        <br />

        <button onClick={() => this.props.nextStep({ ...this.state.data })} className='button is-primary is-pulled-right'>Continuar</button>
      </div>
    )
  }
}

export default DeadLines
