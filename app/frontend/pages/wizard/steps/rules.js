import React, { Component } from 'react'
import moment from 'moment'
import CalendarRules from './calendar-rules'

const times = {
  'd': 'Día',

  'w': 'Semana',

  'M': 'Mes',

  'y': 'Año'

}

class Rules extends Component {
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
      }
    }
  }

  getStartDates () {
    let start = []
    let end = []

    for (let i = 0; i < 12; i++) {
      let date = moment(this.props.rules.startDate).add(i, 'month')
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
      let date = moment(this.props.rules.startDate).add(i, 'month')
      dates.push(date.add(num, 'day').format('YYYY-MM-DD'))
    }

    let aux = this.state.dates
    aux[name] = dates

    this.setState({
      dates: aux
    })
  }

  componentWillMount () {
    this.setCalendar()
  }

  componentWillReceiveProps (next) {
    if (this.props.rules.startDate !== next.rules.startDate ||
      this.props.rules.salesUpload !== next.rules.salesUpload ||
      this.props.rules.forecastCreation !== next.rules.forecastCreation ||
      this.props.rules.rangeAdjustment !== next.rules.rangeAdjustment ||
      this.props.rules.rangeAdjustmentRequest !== next.rules.rangeAdjustmentRequest) {
      this.setCalendar()
    }
  }

  setCalendar () {
    let aux = this.state.data
    aux.consolidation =
      moment(this.props.rules.startDate).daysInMonth() - 1 -
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

  render () {
    let rules = this.props.rules
    return (
      <div className='section pad-sides has-20-margin-top'>
        <h1 className='title is-5'>Resumen</h1>
        <p className='subtitle is-6'>Revisa la información de tu organización.</p>
        <div className='columns is-centered'>
          <div className='column'>
            <div className='card'>
              <header className='card-header'>
                <p className='card-header-title'>
                  Reglas de organización
                </p>
              </header>
              <div className='card-content'>
                <div className='columns'>
                  <div className='column'>
                    <button className='button is-primary is-small is-pulled-right'
                      onClick={() => this.props.setStep(2)}>
                      Editar
                    </button>
                    <p>
                      Inicio del ciclo:
                    <span className='has-text-weight-bold is-capitalized'> {moment(rules.startDate).format('DD-MMM-YYYY')}</span>
                    </p>
                    <p>
                      Duración de ciclo:
                    <span className='has-text-weight-bold is-capitalized'> {rules.cycleDuration + ' ' + times[rules.cycle]}</span>
                    </p>
                    <p>
                      Ciclos disponibles para ajuste:
                    <span className='has-text-weight-bold is-capitalized'> {rules.cyclesAvailable}</span>
                    </p>
                    <p>
                      Temporada:
                      <span className='has-text-weight-bold is-capitalized'> {rules.season} ciclos</span>
                    </p>
                    <p>
                      Duración de periodo:
                      <span className='has-text-weight-bold is-capitalized'> {rules.periodDuration + ' ' + times[rules.period]}</span>
                    </p>
                    <p>
                      Se usará la fecha de
                      <span className='has-text-weight-bold'> {rules.takeStart ? 'inicio' : 'fin'} </span>
                      del periodo para determinar el ciclo al que pertenece
                    </p>

                    <hr />
                    <button className='button is-primary is-small is-pulled-right'
                      onClick={() => this.props.setStep(3)}>
                      Editar
                    </button>
                    {rules.ranges.map((item, key) => {
                      return (
                        <p key={key}>
                          Rango de ajuste permitido ciclo {key + 1}:
                          <span className='has-text-weight-bold is-capitalized'> {item !== null ? item + '%' : 'ilimitado'}</span>
                        </p>
                      )
                    })}

                  </div>

                  <div className='column'>

                    <div>
                      <button className='button is-primary is-small is-pulled-right'
                        onClick={() => this.props.setStep(5)}>
                        Editar
                    </button>
                      <p>Catálogos:</p>
                      <ul className='has-text-weight-bold is-capitalized'>
                        {this.props.rules.catalogs.map((item, key) => {
                          return (
                            <li key={key}>{item.replace(/_/g, ' ')}</li>
                          )
                        })}
                      </ul>
                    </div>

                    <hr />
                    <div>
                      <button className='button is-primary is-small is-pulled-right'
                        onClick={() => this.props.setStep(4)}>
                        Editar
                    </button>
                      <br />
                      <p>Ciclos de operación:</p>
                      <ul className='has-text-weight-bold'>
                        <li>Ventas {rules.salesUpload} días</li>
                        <li>Forecast {rules.forecastCreation} días</li>
                        <li>Ajustes {rules.rangeAdjustment} días</li>
                        <li>Aprobar {rules.rangeAdjustmentRequest} días</li>
                        <li>Consolidar {rules.consolidation} días</li>
                      </ul>
                    </div>

                  </div>
                  <div className='column is-offset-1'>
                    <CalendarRules
                      disabled
                      date={moment(rules.startDate)}
                      limits={this.state.dates}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default Rules
