import React, { Component } from 'react'
import moment from 'moment'
import CalendarRules from './calendar-rules'

const times = {
  'd': 'Día',

  'w': 'Semana',

  'm': 'Mes',

  'y': 'Año'

}

class Rules extends Component {
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
                    {rules.ranges.map((item, key) => {
                      return (
                        <p>
                          Rango de ajuste permitido ciclo {key + 1}:
                          <span className='has-text-weight-bold is-capitalized'> {item !== '' ? item + '%' : 'ilimitado'}</span>
                        </p>
                      )
                    })}

                  </div>

                  <div className='column'>

                    <div>
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
                  <div className='column'>
                    <CalendarRules
                      disabled
                      date={moment(rules.startDate)}
                      limits={this.props.rules.dates}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <center>
          <button className='button is-primary'>Guardar</button>
        </center>
      </div>
    )
  }
}

export default Rules
