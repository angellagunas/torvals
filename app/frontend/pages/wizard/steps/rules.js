import React, { Component } from 'react';
import moment from 'moment';
import { Prompt } from 'react-router-dom';

import DeadLines from './deadlines';

const times = {
  d: 'Día',

  w: 'Semana',

  M: 'Mes',

  y: 'Año',
};

class Rules extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: {
        salesUpload: this.props.rules.salesUpload || 0,
        forecastCreation: this.props.rules.forecastCreation || 0,
        rangeAdjustment: this.props.rules.rangeAdjustment || 0,
        rangeAdjustmentRequest: this.props.rules.rangeAdjustmentRequest || 0,
        consolidation: this.props.rules.cycleDuration * 31,
        isLoading: '',
      },
    };
  }

  async save() {
    this.setState({ isLoading: 'is-loading' });
    await this.props.save();
    this.setState({ isLoading: '' });
  }

  render() {
    let rules = this.props.rules;
    return (
      <div className="section pad-sides has-20-margin-top rules">
        <Prompt
          when={this.props.unsaved}
          message={location =>
            `Hay cambios a las reglas de negocio sin aplicar, ¿estás seguro de querer salir de esta página?`
          }
        />
        <h1 className="title is-5">Reglas de la organización</h1>
        <div className="columns is-centered">
          <div className="column">
            <div className="card">
              <header className="card-header">
                <p className="card-header-title">Configuración</p>
              </header>
              <div className="card-content">
                <div className="columns">
                  <div className="column is-4">
                    <button
                      className="button is-primary is-small is-pulled-right edit-btn"
                      onClick={() => this.props.setStep(2)}
                    >
                      Editar
                    </button>
                    <p>
                      Inicio del ciclo:
                      <span className="has-text-weight-bold is-capitalized">
                        {' '}
                        {moment.utc(rules.startDate).format('DD-MMM-YYYY')}
                      </span>
                    </p>
                    <p>
                      Duración de ciclo:
                      <span className="has-text-weight-bold is-capitalized">
                        {' '}
                        {rules.cycleDuration + ' ' + times[rules.cycle]}
                      </span>
                    </p>
                    <p>
                      Ciclos disponibles para ajuste:
                      <span className="has-text-weight-bold is-capitalized">
                        {' '}
                        {rules.cyclesAvailable}
                      </span>
                    </p>
                    <p>
                      Temporada:
                      <span className="has-text-weight-bold is-capitalized">
                        {' '}
                        {rules.season} ciclos
                      </span>
                    </p>
                    <p>
                      Duración de periodo:
                      <span className="has-text-weight-bold is-capitalized">
                        {' '}
                        {rules.periodDuration + ' ' + times[rules.period]}
                      </span>
                    </p>
                    <p>
                      Los periodos pertenecen al ciclo donde
                      <span className="has-text-weight-bold">
                        {' '}
                        {rules.takeStart ? 'inician.' : 'terminan.'}{' '}
                      </span>
                    </p>

                    <hr />
                    <button
                      className="button is-primary is-small is-pulled-right edit-btn"
                      onClick={() => this.props.setStep(3)}
                    >
                      Editar
                    </button>
                    <p>Rangos de ajuste:</p>

                    <ul className="rules-ranges">
                      <li>
                        <div className="tags has-addons">
                          <span className="tag clear-blue has-text-weight-semibold">
                            {' '}
                            Ciclos
                          </span>
                          <span className="tag clear-blue has-text-weight-semibold">
                            Ajuste
                          </span>
                          <span className="tag clear-blue has-text-weight-semibold">
                            Manager Lvl 2
                          </span>
                        </div>
                      </li>
                      {rules.ranges.map((item, key) => {
                        if (key < rules.cyclesAvailable) {
                          return (
                            <li key={key}>
                              <div className="tags has-addons">
                                <span className="tag has-text-weight-semibold">
                                  {' '}
                                  {key + 1}
                                </span>
                                <span className="tag has-text-weight-semibold">
                                  {item !== null ? item + '%' : 'ilimitado'}
                                </span>
                                <span className="tag has-text-weight-semibold">
                                  {rules.rangesLvl2[key] !== undefined
                                    ? rules.rangesLvl2[key] !== null
                                      ? rules.rangesLvl2[key] + '%'
                                      : 'ilimitado'
                                    : 'No definido'}
                                </span>
                              </div>
                            </li>
                          );
                        }
                      })}
                    </ul>
                  </div>

                  <div className="column is-4">
                    <div>
                      <button
                        className="button is-primary is-small is-pulled-right edit-btn"
                        onClick={() => this.props.setStep(4)}
                      >
                        Editar
                      </button>

                      <p>Ciclos de operación:</p>
                      <ul>
                        <li>
                          <div className="tags has-addons">
                            <span className="tag deadline-sales has-text-weight-semibold">
                              {' '}
                              Actualizar datos de ventas
                            </span>
                            <span className="tag has-text-weight-semibold">
                              {rules.salesUpload} días
                            </span>
                          </div>
                        </li>
                        <li>
                          <div className="tags has-addons">
                            <span className="tag deadline-forecast has-text-weight-semibold">
                              {' '}
                              Generar Predicción
                            </span>
                            <span className="tag has-text-weight-semibold">
                              {rules.forecastCreation} días
                            </span>
                          </div>
                        </li>
                        <li>
                          <div className="tags has-addons">
                            <span className="tag deadline-adjustments has-text-weight-semibold">
                              {' '}
                              Realizar Ajustes
                            </span>
                            <span className="tag has-text-weight-semibold">
                              {rules.rangeAdjustment} días
                            </span>
                          </div>
                        </li>
                        <li>
                          <div className="tags has-addons">
                            <span className="tag deadline-approve has-text-weight-semibold">
                              {' '}
                              Aprobar Ajustes
                            </span>
                            <span className="tag has-text-weight-semibold">
                              {rules.rangeAdjustmentRequest} días
                            </span>
                          </div>
                        </li>
                        <li>
                          <div className="tags has-addons">
                            <span className="tag deadline-consolidate has-text-weight-semibold">
                              {' '}
                              Concentrar Información
                            </span>
                            <span className="tag has-text-weight-semibold">
                              {rules.consolidation} días
                            </span>
                          </div>
                        </li>
                      </ul>
                    </div>

                    <hr />

                    <div>
                      <button
                        className="button is-primary is-small is-pulled-right edit-btn"
                        onClick={() => this.props.setStep(5)}
                      >
                        Editar
                      </button>
                      <p>Catálogos:</p>
                      <br />
                      <div className="tags">
                        <div className="tag is-capitalized has-text-weight-semibold">
                          Precio
                        </div>
                        {this.props.rules.catalogs.map((item, key) => {
                          return (
                            <div
                              key={key}
                              className="tag is-capitalized has-text-weight-semibold"
                            >
                              {item.name}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="column">
                    <div className="is-centered-content">
                      <DeadLines rules={rules} hideInputs />
                    </div>
                  </div>
                </div>
                <div
                  className={
                    this.props.unsaved ? 'columns' : 'columns is-hidden'
                  }
                >
                  <div className="column">
                    <div
                      className="has-text-centered"
                      style={{ marginTop: '2rem' }}
                    >
                      <button
                        className={
                          'button is-medium is-success save-btn ' +
                          this.state.isLoading
                        }
                        disabled={!!this.state.isLoading}
                        onClick={() => {
                          this.save();
                        }}
                      >
                        Aplicar cambios
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Rules;
