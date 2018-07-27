import React, { Component } from 'react'
import moment from 'moment'
import { Prompt } from 'react-router-dom'
import { FormattedMessage } from 'react-intl'

import DeadLines from './deadlines'

//TODO: translate
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
        consolidation: this.props.rules.cycleDuration * 31,
        isLoading: ''
      }
    }
  }

  async save () {
    this.setState({isLoading: 'is-loading'})
    await this.props.save()
    this.setState({isLoading: ''})
  }

  render () {
    let rules = this.props.rules
    return (
      <div className='section pad-sides has-20-margin-top rules'>
        <Prompt
          when={this.props.unsaved}
          message={location => (
            //TODO: translate
            `Hay cambios a las reglas de negocio sin aplicar, ¿estás seguro de querer salir de esta página?`
          )}
        />
        <h1 className='title is-5'>
          <FormattedMessage
            id="wizard.rulesTitle"
            defaultMessage={`Reglas de la organización`}
          />
        </h1>
        <div className='columns is-centered'>
          <div className='column'>
            <div className='card'>
              <header className='card-header'>
                <p className='card-header-title'>
                  <FormattedMessage
                    id="wizard.rulesConfig"
                    defaultMessage={`Reglas de la organización`}
                  />
                </p>
              </header>
              <div className='card-content'>
                <div className='columns'>
                  <div className='column is-4'>
                    <button className='button is-primary is-small is-pulled-right edit-btn'
                      onClick={() => this.props.setStep(2)}>
                      <FormattedMessage
                        id="wizard.rulesBtnEditar"
                        defaultMessage={`Editar`}
                      />
                    </button>
                    <p>
                      <FormattedMessage
                        id="wizard.rulesCyclesStart"
                        defaultMessage={`Inicio del ciclo`}
                      />:
                      <span className='has-text-weight-bold is-capitalized'> {moment.utc(rules.startDate).format('DD-MMM-YYYY')}</span>
                    </p>
                    <p>
                      <FormattedMessage
                        id="wizard.rulesCyclesEnd"
                        defaultMessage={`Duración de ciclo`}
                      />:
                      <span className='has-text-weight-bold is-capitalized'> {rules.cycleDuration + ' ' + times[rules.cycle]}</span>
                    </p>
                    <p>
                      <FormattedMessage
                        id="wizard.rulesCyclesAvailable"
                        defaultMessage={`Ciclos disponibles para ajuste`}
                      />:
                      <span className='has-text-weight-bold is-capitalized'> {rules.cyclesAvailable}</span>
                    </p>
                    <p>
                      <FormattedMessage
                        id="wizard.rulesSeason"
                        defaultMessage={`Temporada`}
                      />:
                      <span className='has-text-weight-bold is-capitalized'> {rules.season} ciclos</span>
                    </p>
                    <p>
                      <FormattedMessage
                        id="wizard.rulesPeriodsDuration"
                        defaultMessage={`Duración de periodo`}
                      />:
                      <span className='has-text-weight-bold is-capitalized'> {rules.periodDuration + ' ' + times[rules.period]}</span>
                    </p>
                    <p>
                      <FormattedMessage
                        id="wizard.rulesPeriods"
                        defaultMessage={`Los periodos pertenecen al ciclo donde`}
                      />:
                      <span className='has-text-weight-bold'>
                        {
                          rules.takeStart
                          ? <FormattedMessage
                            id="wizard.rulesPeriodsStart"
                            defaultMessage={`inician`}
                          />
                          : <FormattedMessage
                            id="wizard.rulesPeriodsEnd"
                            defaultMessage={`inician`}
                          />
                        }
                      </span>
                    </p>

                    <hr />
                    <button className='button is-primary is-small is-pulled-right edit-btn'
                      onClick={() => this.props.setStep(3)}
                    >
                      <FormattedMessage
                        id="wizard.rulesBtnEditar"
                        defaultMessage={`Editar`}
                      />
                    </button>
                    <p>
                      <FormattedMessage
                        id="wizard.rulesRangeTitle"
                        defaultMessage={`Rangos de ajuste`}
                      />:
                    </p>

                    <ul className='rules-ranges'>
                      <li>
                        <div className='tags has-addons'>
                          <span className='tag clear-blue has-text-weight-semibold'>
                            <FormattedMessage
                              id="wizard.rulesRange1"
                              defaultMessage={`Ciclos`}
                            />
                          </span>
                          <span className='tag clear-blue has-text-weight-semibold'>
                            <FormattedMessage
                              id="wizard.rulesRange2"
                              defaultMessage={`Ajuste`}
                            />
                          </span>
                          <span className='tag clear-blue has-text-weight-semibold'>
                            <FormattedMessage
                              id="wizard.rulesRange3"
                              defaultMessage={`Manager Lvl 2`}
                            />
                          </span>
                        </div>
                      </li>
                      {rules.ranges.map((item, key) => {
                        if (key < rules.cyclesAvailable) {
                          return (
                            <li key={key}>
                              <div className='tags has-addons'>
                                <span className='tag has-text-weight-semibold'> {key + 1}</span>
                                <span className='tag has-text-weight-semibold'>
                                  {
                                    item !== null
                                      ? item + '%'
                                      : <FormattedMessage
                                        id="wizard.rulesRangeUnlimited"
                                        defaultMessage={`ilimitado`}
                                      />
                                  }
                                </span>
                                <span className='tag has-text-weight-semibold'>
                                  {
                                    rules.rangesLvl2[key] !== undefined
                                    ? rules.rangesLvl2[key] !== null
                                      ? rules.rangesLvl2[key] + '%'
                                      : <FormattedMessage
                                        id="wizard.rulesRangeUnlimited"
                                        defaultMessage={`ilimitado`}
                                      />
                                    : <FormattedMessage
                                      id="wizard.rulesRangeUndefined"
                                      defaultMessage={`No definido`}
                                    />
                                  }
                                </span>
                              </div>
                            </li>
                          )
                        }
                      })}
                    </ul>
                  </div>

                  <div className='column is-4'>

                    <div>
                      <button className='button is-primary is-small is-pulled-right edit-btn'
                        onClick={() => this.props.setStep(4)}>
                        <FormattedMessage
                          id="wizard.rulesBtnEditar"
                          defaultMessage={`Editar`}
                        />
                    </button>

                      <p>
                        <FormattedMessage
                          id="wizard.rulesOperations"
                          defaultMessage={`Ciclos de operación`}
                        />:
                      </p>
                      <ul>
                        <li>
                          <div className='tags has-addons'>
                            <span className='tag deadline-sales has-text-weight-semibold'>
                              <FormattedMessage
                                id="wizard.rulesSalesUpdate"
                                defaultMessage={`Editar`}
                              />
                            </span>
                            <span className='tag has-text-weight-semibold'>
                              {rules.salesUpload} <FormattedMessage
                                id="wizard.rulesDay"
                                defaultMessage={`días`}
                              />
                            </span>
                          </div>
                        </li>
                        <li>
                          <div className='tags has-addons'>
                            <span className='tag deadline-forecast has-text-weight-semibold'>

                              <FormattedMessage
                                id="wizard.rulesPrediction"
                                defaultMessage={`Generar Predicción`}
                              />
                            </span>
                            <span className='tag has-text-weight-semibold'>
                              {rules.forecastCreation} <FormattedMessage
                                id="wizard.rulesDay"
                                defaultMessage={`días`}
                              />
                            </span>
                          </div>
                        </li>
                        <li>
                          <div className='tags has-addons'>
                            <span className='tag deadline-adjustments has-text-weight-semibold'>
                              <FormattedMessage
                                id="wizard.rulesAdjustment"
                                defaultMessage={`Realizar Ajustes`}
                              />
                            </span>
                            <span className='tag has-text-weight-semibold'>
                              {rules.rangeAdjustment} <FormattedMessage
                                id="wizard.rulesDay"
                                defaultMessage={`días`}
                              />
                            </span>
                          </div>
                        </li>
                        <li>
                          <div className='tags has-addons'>
                            <span className='tag deadline-approve has-text-weight-semibold'>
                              <FormattedMessage
                                id="wizard.rulesAdjustmentApprove"
                                defaultMessage={`Aprobar Ajustes`}
                              />
                            </span>
                            <span className='tag has-text-weight-semibold'>
                              {rules.rangeAdjustmentRequest} <FormattedMessage
                                id="wizard.rulesDay"
                                defaultMessage={`días`}
                              />
                            </span>
                          </div>
                        </li>
                        <li>
                          <div className='tags has-addons'>
                            <span className='tag deadline-consolidate has-text-weight-semibold'>
                              <FormattedMessage
                                id="wizard.rulesInfo"
                                defaultMessage={`Concentrar Información`}
                              />
                            </span>
                            <span className='tag has-text-weight-semibold'>
                              {rules.consolidation} <FormattedMessage
                                id="wizard.rulesDay"
                                defaultMessage={`días`}
                              />
                            </span>
                          </div>
                        </li>
                      </ul>
                    </div>

                    <hr />

                    <div>
                      <button className='button is-primary is-small is-pulled-right edit-btn'
                        onClick={() => this.props.setStep(5)}
                      >
                        <FormattedMessage
                          id="wizard.rulesBtnEditar"
                          defaultMessage={`Editar`}
                        />
                    </button>
                      <p>
                        <FormattedMessage
                          id="wizard.rulesCatalogs"
                          defaultMessage={`Catálogos`}
                        />:
                      </p>
                      <br />
                      <div className='tags'>
                        <div className='tag is-capitalized has-text-weight-semibold'>

                          <FormattedMessage
                            id="wizard.rulesPrice"
                            defaultMessage={`Precio`}
                          />
                        </div>
                        {this.props.rules.catalogs.map((item, key) => {
                          return (
                            <div key={key} className='tag is-capitalized has-text-weight-semibold'>
                              {item.name}
                            </div>
                          )
                        })}
                      </div>
                    </div>

                  </div>
                  <div className='column'>
                    <div className='is-centered-content'>
                      <DeadLines rules={rules} hideInputs />
                    </div>
                  </div>
                </div>
                <div className={this.props.unsaved ? 'columns' : 'columns is-hidden'}>
                  <div className='column'>
                    <div className='has-text-centered' style={{marginTop: '2rem'}}>
                      <button
                        className={'button is-medium is-success save-btn ' + this.state.isLoading}
                        disabled={!!this.state.isLoading}
                        onClick={() => { this.save() }}
                      >
                        <FormattedMessage
                          id="wizard.rulesBtnSave"
                          defaultMessage={`Aplicar cambios`}
                        />
                      </button>
                    </div>
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
