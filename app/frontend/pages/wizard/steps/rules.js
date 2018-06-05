import React, { Component } from 'react'
import moment from 'moment'
import DeadLines from './deadlines'

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
      }
    }
  }

  render () {
    let rules = this.props.rules
    return (
      <div className='section pad-sides has-20-margin-top'>
        <h1 className='title is-5'>Reglas de la organizacion</h1>
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
                      if (key < rules.cyclesAvailable) {
                        return (
                          <p key={key}>
                          Rango de ajuste permitido ciclo {key + 1}:
                          <span className='has-text-weight-bold is-capitalized'> {item !== null ? item + '%' : 'ilimitado'}</span>
                          </p>
                        )
                      }
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
                      <ul>
                        <li>Ventas: <strong>{rules.salesUpload} días</strong></li>
                        <li>Forecast: <strong>{rules.forecastCreation} días</strong></li>
                        <li>Ajustes: <strong>{rules.rangeAdjustment} días</strong></li>
                        <li>Aprobar: <strong>{rules.rangeAdjustmentRequest} días</strong></li>
                        <li>Consolidar: <strong>{rules.consolidation} días</strong></li>
                      </ul>
                    </div>

                  </div>
                  <div className='column is-offset-1'>
                    <DeadLines rules={rules} hideInputs />
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
