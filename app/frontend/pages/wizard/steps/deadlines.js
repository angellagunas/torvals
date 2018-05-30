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
        salesUpload: this.props.rules.salesUpload || 0,
        forecastCreation: this.props.rules.forecastCreation || 0,
        rangeAdjustment: this.props.rules.rangeAdjustment || 0,
        rangeAdjustmentRequest: this.props.rules.rangeAdjustmentRequest || 0,
        consolidation: this.props.rules.cycleDuration * 31
      },
      dates: {
        startDates: [],
        endDates: [],
        salesUpload: [],
        forecastCreation: [],
        rangeAdjustment: [],
        rangeAdjustmentRequest: []
      },
      startDate: this.props.startDate
    }
  }

  componentWillMount () {
    let aux = this.state.data
    aux.consolidation =
      moment(this.props.startDate).daysInMonth() - 1 -
      aux.salesUpload -
      aux.forecastCreation -
      aux.rangeAdjustment -
      aux.rangeAdjustmentRequest

    this.setState({
      data: aux
    }, () => {
      this.getStartDates()
    })
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
      let aux = this.state.data
      Object.keys(this.state.data).map(name => {
        let num = this.state.data[name]

        if (name === 'forecastCreation') {
          num = num + aux.salesUpload
        } else if (name === 'rangeAdjustment') {
          num = num + aux.salesUpload + aux.forecastCreation
        } else if (name === 'rangeAdjustmentRequest') {
          num = num + aux.salesUpload + aux.forecastCreation + aux.rangeAdjustment
        }

        this.getDates(name, num)
      })
    })
  }

  getDates (name, num) {
    if (num === 0) { return }
    let dates = []
    for (let i = 0; i < 12; i++) {
      let date = moment(this.props.startDate).add(i, 'month')
      dates.push(date.add(num, 'day').format('YYYY-MM-DD'))
    }

    let aux = this.state.dates
    aux[name] = dates

    this.setState({
      dates: aux
    })
  }

  handleInputChange (name, value) {
    let aux = this.state.data
    value = value.replace(/\D/, '')
    value = Number(value)
    aux[name] = value

    aux.consolidation =
    moment(this.props.startDate).daysInMonth() - 1 -
    aux.salesUpload -
    aux.forecastCreation -
    aux.rangeAdjustment -
    aux.rangeAdjustmentRequest

    this.setState({
      data: aux
    })

    let num = value

    if (name === 'forecastCreation') {
      num = value + aux.salesUpload
    } else if (name === 'rangeAdjustment') {
      num = value + aux.salesUpload + aux.forecastCreation
    } else if (name === 'rangeAdjustmentRequest') {
      num = value + aux.salesUpload + aux.forecastCreation + aux.rangeAdjustment
    }

    this.getDates(name, num)
  }

  componentWillReceiveProps (next) {
    if (this.state.startDate !== next.startDate) {
      this.setState({
        startDate: next.startDate
      }, () => {
        let aux = this.state.data
        aux.consolidation =
          moment(this.props.startDate).daysInMonth() - 1 -
          aux.salesUpload -
          aux.forecastCreation -
          aux.rangeAdjustment -
          aux.rangeAdjustmentRequest

        this.setState({
          data: aux
        }, () => {
          this.getStartDates()
        })
      })
    }
  }

  render () {
    const deadlines = [
      {
        title: 'ventas',
        name: 'salesUpload',
        color: 'deadline-sales'
      },
      {
        title: 'forecast',
        name: 'forecastCreation',
        color: 'deadline-forecast'
      },
      {
        title: 'ajustes',
        name: 'rangeAdjustment',
        color: 'deadline-adjustments'
      },
      {
        title: 'aprobar',
        name: 'rangeAdjustmentRequest',
        color: 'deadline-approve'
      },
      {
        title: 'consolidar',
        name: 'consolidation',
        color: 'deadline-consolidate'
      }
    ]

    return (
      <div className='section pad-sides has-20-margin-top'>
        <h1 className='title is-5'> Ciclos de operación</h1>
        <p className='subtitle is-6'>Define las fechas para el ciclo de operación a partir de la fecha de inicio.</p>
        <div className='columns is-centered'>
          <div className='column is-6'>
            <div className='card'>
              <header className='card-header'>
                <p className='card-header-title'>
                  Fechas para operar
                </p>
              </header>
              <div className='card-content'>
                <div>
                  {
                    deadlines.map((item) => {
                      return (
                        <div className='field has-addons' key={item.name}>
                          <p className='control'>
                            <a className={'button is-capitalized ' + item.color}>
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
              </div>
            </div>
          </div>

          <div className='column is-offset-1'>
            <CalendarRules
              disabled
              date={moment(this.state.startDate)}
              limits={this.state.dates}
            />
          </div>

        </div>

        <center>
          <button onClick={() => this.props.nextStep({ ...this.state.data, dates: this.state.dates })} className='button is-primary'>Guardar</button>
        </center>

      </div>
    )
  }
}

export default DeadLines
