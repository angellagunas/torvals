import React, { Component } from 'react'
import Page from '~base/page'
import { loggedIn } from '~base/middlewares/'
import tree from '~core/tree'
import Periods from './wizard/steps/periods'
import Ranges from './wizard/steps/ranges'
import DeadLines from './wizard/steps/deadlines'
import CalendarRules from './wizard/steps/calendar-rules'
import Catalogs from './wizard/steps/catalogs'
import Tabs from '~base/components/base-tabs'
import moment from 'moment'
import { toast } from 'react-toastify'
import api from '~base/api'
import BaseModal from '~base/components/base-modal'

const times = {
  'd': 'Día',

  'w': 'Semana',

  'M': 'Mes',

  'y': 'Año'

}

class OrgRules extends Component {
  constructor (props) {
    super(props)
    this.state = {
      currentStep: 1,
      rules: tree.get('rule'),
      unsaved: false,
      important: false,
      isLoading: '',
      className: ''
    }
    this.tabs = []
  }

  async saveData () {
    if (this.state.important) {
      this.showModal()
      return
    }
    this.setState({ isLoading: 'is-loading' })

    try {
      let url = '/app/rules'

      let res = await api.post(url, {
        ...this.state.rules
      })

      if (res) {
        this.notify(
          '¡Las nuevas reglas de negocio se han guardado exitosamente!',
          5000,
          toast.TYPE.SUCCESS
        )

        this.setState({ unsaved: false, isLoading: '', className: '' })
        tree.set('rule', res.rules)
        tree.commit()
        return true
      } else {
        this.setState({ isLoading: '', className: '' })
        return false
      }
    } catch (e) {
      console.log(e)
      this.setState({ isLoading: '', className: '' })
      return false
    }
  }

  nextStep (data, step) {
    if (data) {
      this.setState({
        rules: {
          ...this.state.rules,
          ...data,
          step: step
        },
        unsaved: true,
        important: step === 1 || step === 4 || this.state.important,
        currentStep: 1
      })
    }
  }

  setStep (step) {
    this.setState({ currentStep: step })
  }

  notify (message = '', timeout = 5000, type = toast.TYPE.INFO) {
    let className = ''
    if (type === toast.TYPE.WARNING) {
      className = 'has-bg-warning'
    }
    if (!toast.isActive(this.toastId)) {
      this.toastId = toast(message, {
        autoClose: timeout,
        type: type,
        hideProgressBar: true,
        closeButton: false,
        className: className
      })
    } else {
      toast.update(this.toastId, {
        render: message,
        type: type,
        autoClose: timeout,
        closeButton: false,
        className: className
      })
    }
  }

  confirmMsg () {
    return (
      <BaseModal
        title='Cambios en reglas de negocio'
        className={'modal-confirm ' + this.state.className}
        hideModal={() => { this.hideModal() }}
      >
        <center>
          <h3>
            ¿Estas seguro de guardar las últimas reglas de negocio establecidas?
          <p><strong>Recuerda que tus reglas anteriores se perderán.</strong></p>
          </h3>
          <br />
          <button className='button is-success'
            onClick={() => { this.confirmSave() }} >Sí, guardar</button>
          <br />
          <button
            className='button is-primary is-inverted'
            onClick={() => { this.hideModal() }}>No, regresar</button>
        </center>
      </BaseModal>
    )
  }

  confirmSave () {
    this.setState({ important: false }, () => {
      this.saveData()
    })
  }

  showModal () {
    this.setState({
      className: ' is-active'
    })
  }

  hideModal () {
    this.setState({
      className: ''
    })
  }

  render () {
    let org = tree.get('user').currentOrganization

    this.tabs = [
      {
        name: '0',
        title: 'Configuración de operación',
        hide: false,
        disabled: false,
        content: (
          <div className='columns section is-centered'>
            <div className='column'>
              <div className='card'>
                <div className='card-header'>
                  <p className='card-header-title'>Rangos de ajuste</p>
                </div>
                <div className='card-content'>
                  <ul className='rules-ranges'>
                    <li>
                      <div className='columns is-gapless has-addons'>
                        <span className='column has-text-centered clear-blue has-text-weight-semibold'> Ciclos</span>
                        <span className='column has-text-centered clear-blue has-text-weight-semibold'>Manager Lvl 1</span>
                        <span className='column has-text-centered clear-blue has-text-weight-semibold'>Manager Lvl 2</span>
                      </div>
                    </li>
                    {this.state.rules.ranges.map((item, key) => {
                      if (key < this.state.rules.cyclesAvailable) {
                        return (
                          <li key={key}>
                            <div className='columns is-gapless has-addons'>
                              <span className='column has-text-centered has-background-light has-text-weight-semibold'> {key + 1}</span>
                              <span className='column has-text-centered has-background-light has-text-weight-semibold'>{item !== null ? item + '%' : 'ilimitado'}</span>
                              <span className='column has-text-centered has-background-light has-text-weight-semibold'>{
                                this.state.rules.rangesLvl2[key] !== undefined
                                  ? this.state.rules.rangesLvl2[key] !== null ? this.state.rules.rangesLvl2[key] + '%' : 'ilimitado'
                                  : 'No definido'
                              }</span>
                            </div>
                          </li>
                        )
                      }
                    })}
                  </ul>
                  <button className='button is-primary edit-btn'
                    onClick={() => this.setStep(3)}>
                    Editar
                  </button>
                </div>
              </div>
            </div>

            <div className='column'>
              <div className='card'>
                <div className='card-header'>
                  <p className='card-header-title'>Ciclos de operación</p>
                </div>
                <div className='card-content'>
                  <ul>
                    <li>
                      <div className='tags has-addons'>
                        <span className='tag deadline-sales has-text-weight-semibold'> Actualizar datos de ventas</span>
                        <span className='tag has-text-weight-semibold'>{this.state.rules.salesUpload} días</span>
                      </div>
                    </li>
                    <li>
                      <div className='tags has-addons'>
                        <span className='tag deadline-forecast has-text-weight-semibold'> Generar Predicción</span>
                        <span className='tag has-text-weight-semibold'>{this.state.rules.forecastCreation} días</span>
                      </div>
                    </li>
                    <li>
                      <div className='tags has-addons'>
                        <span className='tag deadline-adjustments has-text-weight-semibold'> Realizar Ajustes</span>
                        <span className='tag has-text-weight-semibold'>{this.state.rules.rangeAdjustment} días</span>
                      </div>
                    </li>
                    <li>
                      <div className='tags has-addons'>
                        <span className='tag deadline-approve has-text-weight-semibold'> Aprobar Ajustes</span>
                        <span className='tag has-text-weight-semibold'>{this.state.rules.rangeAdjustmentRequest} días</span>
                      </div>
                    </li>
                    <li>
                      <div className='tags has-addons'>
                        <span className='tag deadline-consolidate has-text-weight-semibold'> Concentrar Información</span>
                        <span className='tag has-text-weight-semibold'>{this.state.rules.consolidation} días</span>
                      </div>
                    </li>
                  </ul>

                  <button className='button is-primary edit-btn'
                    onClick={() => this.setStep(4)}>
                    Editar
                  </button>
                </div>
              </div>
            </div>

            <div className='column'>
              <div className='is-centered-content'>
                <DeadLines rules={this.state.rules} hideInputs />
              </div>
            </div>
          </div>
        )
      },
      {
        name: '1',
        title: 'Configuración de datos',
        hide: false,
        disabled: false,
        content: (
          <div className='columns section is-centered'>
            <div className='column'>
              <div className='card'>
                <div className='card-header'>
                  <p className='card-header-title'>Reglas de organización</p>
                </div>
                <div className='card-content'>
                  <p>
                    Inicio del ciclo:
                    <span className='has-text-weight-bold is-capitalized'> {moment.utc(this.state.rules.startDate).format('DD-MMM-YYYY')}</span>
                  </p>
                  <p>
                    Duración de ciclo:
                    <span className='has-text-weight-bold is-capitalized'> {this.state.rules.cycleDuration + ' ' + times[this.state.rules.cycle]}</span>
                  </p>
                  <p>
                    Ciclos disponibles para ajuste:
                    <span className='has-text-weight-bold is-capitalized'> {this.state.rules.cyclesAvailable}</span>
                  </p>
                  <p>
                    Temporada:
                      <span className='has-text-weight-bold is-capitalized'> {this.state.rules.season} ciclos</span>
                  </p>
                  <p>
                    Duración de periodo:
                      <span className='has-text-weight-bold is-capitalized'> {this.state.rules.periodDuration + ' ' + times[this.state.rules.period]}</span>
                  </p>
                  <p>
                    Los periodos pertenecen al ciclo donde
                      <span className='has-text-weight-bold'> {this.state.rules.takeStart ? 'inician.' : 'terminan.'} </span>
                  </p>

                  <button className='button is-primary edit-btn'
                    onClick={() => this.setStep(2)}>
                    Editar
                  </button>
                </div>
              </div>
            </div>

            <div className='column'>
              <div className='card'>
                <div className='card-header'>
                  <p className='card-header-title'>Catálogos</p>
                </div>
                <div className='card-content'>
                  <div className='tags'>
                    <div className='tag is-capitalized has-text-weight-semibold'>
                      Precio
                    </div>
                    {this.state.rules.catalogs.map((item, key) => {
                      return (
                        <div key={key} className='tag is-capitalized has-text-weight-semibold'>
                          {item.name}
                        </div>
                      )
                    })}
                  </div>

                  <button className='button is-primary edit-btn'
                    onClick={() => this.setStep(5)}>
                    Editar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    ]

    let content =
      <div>
        <div className='card'>
          <div className='card-content'>
            {this.state.unsaved &&
            <button
              className={'button is-pulled-right is-success save-btn ' + this.state.isLoading}
              disabled={!!this.state.isLoading}
              onClick={() => { this.saveData() }}>Guardar configuración</button>
            }
            <h4><strong>Configura tus reglas de negocio</strong></h4>

            Puedes editar los datos las veces que desees sin embargo, recuerda que tus anteriores reglas quedarán deshabilitadas y perderás tu información.
            </div>
        </div>

        <Tabs
          tabs={this.tabs}
          selectedTab={'0'}
          className='is-fullwidth'
        />
      </div>

    if (this.state.currentStep === 2) {
      content = (
        <Periods
          rules={this.state.rules}
          nextStep={(data) => this.nextStep(data, 1)}
          setStep={(step) => this.setStep(step)}
        />
      )
    } else if (this.state.currentStep === 3) {
      content = (
        <Ranges
          rules={this.state.rules}
          nextStep={(data) => this.nextStep(data, 2)}
          setStep={(step) => this.setStep(step)}
        />
      )
    } else if (this.state.currentStep === 4) {
      content = (
        <DeadLines
          startDate={this.state.rules.startDate}
          rules={this.state.rules}
          nextStep={(data) => this.nextStep(data, 3)}
          setStep={(step) => this.setStep(step)} />
      )
    } else if (this.state.currentStep === 5) {
      content = (
        <Catalogs
          rules={this.state.rules}
          nextStep={(data) => this.nextStep(data, 4)}
          setStep={(step) => this.setStep(step)}
        />
      )
    }

    return (
      <div>
        <div className='org-rules wizard'>
          <div className='section-header'>
            <h2>{org.name}</h2>
          </div>
          {content}
        </div>

        {this.confirmMsg()}
      </div>
    )
  }
}

export default Page({
  path: '/rules',
  title: 'Reglas',
  icon: 'list',
  exact: true,
  validate: loggedIn,
  component: OrgRules
})
