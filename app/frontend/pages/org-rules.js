import React, { Component } from 'react'
import { FormattedMessage } from 'react-intl'
import Page from '~base/page'
import { loggedIn, verifyRole } from '~base/middlewares/'
import tree from '~core/tree'
import Periods from './wizard/steps/periods'
import Ranges from './wizard/steps/ranges'
import DeadLines from './wizard/steps/deadlines'
import Catalogs from './wizard/steps/catalogs'
import Tabs from '~base/components/base-tabs'
import moment from 'moment'
import { toast } from 'react-toastify'
import api from '~base/api'
import BaseModal from '~base/components/base-modal'
import { Prompt } from 'react-router-dom'
import Wizard from './wizard/wizard'

//TODO: translate
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
      className: '',
      projectModal: '',
      alert: false,
      selectedTab: '0'
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
          '¡Las nuevas reglas de negocio se han guardado exitosamente!', //TODO: translate
          5000,
          toast.TYPE.SUCCESS
        )

        this.setState({
          unsaved: false,
          isLoading: '',
          className: '',
          rules: res.rules
        })
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
    this.setTab()

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
    this.setTab()
    this.setState({ currentStep: step})
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
        title='Cambios en reglas de negocio' //TODO: translate
        className={'modal-confirm ' + this.state.className}
        hideModal={() => { this.hideModal() }}
      >
        <center>
          <h3>
            <FormattedMessage
              id="orgRules.confirmModalTitle"
              defaultMessage={`Seguro de guardar las últimas reglas de negocio establecidas?`}
            />
          <p>
            <strong>
              <FormattedMessage
                id="orgRules.confirmModalTitleWarning"
                defaultMessage={`Recuerda que tus reglas anteriores se perderán.`}
              />
            </strong>
          </p>
          </h3>
          <br />
          <div className='buttons org-rules__modal'>
            <button
              className={'button is-pulled-right is-success ' + this.state.isLoading}
              disabled={!!this.state.isLoading}
              onClick={() => { this.confirmSave() }}
            >
              <FormattedMessage
                id="orgRules.confirmModalBtnSave"
                defaultMessage={`Sí, guardar`}
              />
            </button>
            <button
              className='button is-primary is-inverted is-pulled-right'
              onClick={() => { this.hideModal() }}
            >
              <FormattedMessage
                id="orgRules.confirmModalBtnCancel"
                defaultMessage={`No, regresar`}
              />
            </button>
          </div>
        </center>
      </BaseModal>
    )
  }

  confirmSave () {
    this.setState({
      important: false,
      rules: { ...this.state.rules, important: true }
    }, async () => {
      await this.saveData()
      let url = '/app/projects'
      let res = await api.get(url, {
        outdated: true,
        limit: 0
      })
      if (res.data.length > 0) {
        this.setState({
          projectList: res.data,
          alert: true
        })
      }
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

  showModalProjects () {
    this.setState({
      projectModal: ' is-active'
    })
  }

  hideModalProjects () {
    this.setState({
      projectModal: ''
    })
  }

  selectProject (item) {
    this.setState({
      projecSelected: item
    })
  }

  async confirmUpdate () {
    const url = '/app/projects/update/businessRules'
    try {
      await api.post(url, { ...this.state.projecSelected })
      this.hideModalProjects()
      this.props.history.push('/projects/' + this.state.projecSelected.uuid)
    } catch (e) {
      toast('Error: ' + e.message, {
        autoClose: 5000,
        type: toast.TYPE.ERROR,
        hideProgressBar: true,
        closeButton: false
      })
    }
  }

  projectsModal () {
    return (
      <BaseModal
        title='Cambios en reglas de negocio' //TODO: translate
        className={'modal-confirm ' + this.state.projectModal}
        hideModal={() => { this.hideModalProjects() }}>
        <h3>
          <FormattedMessage
            id="orgRules.projectsModalTitle"
            defaultMessage={`Selecciona un proyecto para actualizar.`}
          />
        </h3>
        <br />
        <div className='columns is-multiline org-rules__project-container'>
          {this.state.projectList && this.state.projectList.map(item => {
            return (
              <div className='column is-6' key={item.uuid}>
                <div className='card'>
                  <div className='card-content'>
                    <input
                      className='is-checkradio is-info is-small'
                      id={item.name}
                      type='radio'
                      name='projects'
                      disabled={this.state.waitingData}
                      onChange={() => this.selectProject(item)} />
                    <label htmlFor={item.name}>
                      <span title={item.name}>{item.name}</span>
                    </label>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        <div className='buttons org-rules__modal'>
          <button
            className={'button is-pulled-right is-primary ' + this.state.isLoading}
            disabled={!!this.state.isLoading || !this.state.projecSelected}
            onClick={() => { this.confirmUpdate() }}
          >
            <FormattedMessage
              id="orgRules.projectsModalBtnSave"
              defaultMessage={`Actualizar`}
            />
          </button>
          <button
            className='button is-primary is-inverted is-pulled-right'
            onClick={() => { this.hideModalProjects() }}
          >
            <FormattedMessage
              id="orgRules.projectsModalBtnCancel"
              defaultMessage={`Ahora no`}
            />
          </button>
        </div>
      </BaseModal>
    )
  }

  setTab () {
    let tab = '0'
    if (this.state.currentStep === 2 || this.state.currentStep === 5) {
      tab = '1'
    }
    this.setState({
      selectedTab: tab
    })
  }

  componentWillMount () {
    var userCursor = tree.select('user')

    userCursor.on('update', () => {
      this.forceUpdate()
    })
  }

  render () {
    let user = tree.get('user')
    let org = user.currentOrganization

    if (!org.isConfigured && user.currentRole.slug === 'orgadmin') {
      return (
        <Wizard rules={this.state.rules} org={user.currentOrganization} />
      )
    }

    this.tabs = [
      {
        name: '0',
        title: 'Configuración de operación', //TODO: translate
        hide: false,
        disabled: false,
        content: (
          <div className='columns section is-centered'>
            <div className='column'>
              <div className='card'>
                <div className='card-header'>
                  <p className='card-header-title'>
                    <FormattedMessage
                      id="orgRules.rulesRangeTitle"
                      defaultMessage={`Rangos de ajuste`}
                    />
                  </p>
                </div>
                <div className='card-content'>
                  <ul className='rules-ranges'>
                    <li>
                      <div className='columns is-gapless has-addons'>
                        <span className='column has-text-centered clear-blue has-text-weight-semibold'>
                          <FormattedMessage
                            id="orgRules.rulesRange1"
                            defaultMessage={`Ciclos`}
                          />
                        </span>
                        <span className='column has-text-centered clear-blue has-text-weight-semibold'>
                          <FormattedMessage
                            id="orgRules.rulesRange2"
                            defaultMessage={`Manager Lvl 1`}
                          />
                        </span>
                        <span className='column has-text-centered clear-blue has-text-weight-semibold'>
                          <FormattedMessage
                            id="orgRules.rulesRange3"
                            defaultMessage={`Manager Lvl 2`}
                          />
                        </span>
                      </div>
                    </li>
                    {this.state.rules.ranges.map((item, key) => {
                      if (key < this.state.rules.cyclesAvailable) {
                        return (
                          <li key={key}>
                            <div className='columns is-gapless has-addons'>
                              <span className='column has-text-centered has-background-light has-text-weight-semibold'>
                                {key + 1}
                              </span>
                              <span className='column has-text-centered has-background-light has-text-weight-semibold'>
                                {
                                  item !== null
                                    ? item + '%'
                                    : <FormattedMessage
                                      id="orgRules.rulesRangeUnlimited"
                                      defaultMessage={`ilimitado`}
                                    />
                                }
                              </span>
                              <span className='column has-text-centered has-background-light has-text-weight-semibold'>
                                {
                                  this.state.rules.rangesLvl2[key] !== undefined
                                    ? this.state.rules.rangesLvl2[key] !== null
                                      ? this.state.rules.rangesLvl2[key] + '%'
                                      : <FormattedMessage
                                        id="orgRules.rulesRangeUnlimited"
                                        defaultMessage={`ilimitado`}
                                      />
                                    : <FormattedMessage
                                      id="orgRules.rulesRangeUndefined"
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
                  <button className='button is-primary edit-btn'
                    onClick={() => this.setStep(3)}>
                    <FormattedMessage
                      id="orgRules.btnEdit"
                      defaultMessage={`Editar`}
                    />
                  </button>
                </div>
              </div>
            </div>

            <div className='column'>
              <div className='card'>
                <div className='card-header'>
                  <p className='card-header-title'>
                    <FormattedMessage
                      id="orgRules.cyclesTitle"
                      defaultMessage={`Ciclos de operación`}
                    />
                  </p>
                </div>
                <div className='card-content'>
                  <ul>
                    <li>
                      <div className='tags has-addons'>
                        <span className='tag deadline-sales has-text-weight-semibold'>
                          <FormattedMessage
                            id="orgRules.cyclesUpdateSales"
                            defaultMessage={`Actualizar datos de ventas`}
                          />
                        </span>
                        <span className='tag has-text-weight-semibold'>
                          {this.state.rules.salesUpload}&nbsp; 
                          <FormattedMessage
                            id="orgRules.cyclesDay"
                            defaultMessage={`días`}
                          />
                        </span>
                      </div>
                    </li>
                    <li>
                      <div className='tags has-addons'>
                        <span className='tag deadline-forecast has-text-weight-semibold'>
                          <FormattedMessage
                            id="orgRules.cyclesPrediction"
                            defaultMessage={`Generar Predicción`}
                          />
                        </span>
                        <span className='tag has-text-weight-semibold'>
                          {this.state.rules.forecastCreation}&nbsp; 
                          <FormattedMessage
                            id="orgRules.cyclesDay"
                            defaultMessage={`días`}
                          />
                        </span>
                      </div>
                    </li>
                    <li>
                      <div className='tags has-addons'>
                        <span className='tag deadline-adjustments has-text-weight-semibold'>
                          <FormattedMessage
                            id="orgRules.cyclesAdjustment"
                            defaultMessage={`Realizar Ajustes`}
                          />
                        </span>
                        <span className='tag has-text-weight-semibold'>
                          {this.state.rules.rangeAdjustment}&nbsp; 
                          <FormattedMessage
                            id="orgRules.cyclesDay"
                            defaultMessage={`días`}
                          />
                        </span>
                      </div>
                    </li>
                    <li>
                      <div className='tags has-addons'>
                        <span className='tag deadline-approve has-text-weight-semibold'>
                          <FormattedMessage
                            id="orgRules.cyclesApprove"
                            defaultMessage={`Aprobar Ajustes`}
                          />
                        </span>
                        <span className='tag has-text-weight-semibold'>
                          {this.state.rules.rangeAdjustmentRequest}&nbsp; 
                          <FormattedMessage
                            id="orgRules.cyclesDay"
                            defaultMessage={`días`}
                          />
                        </span>
                      </div>
                    </li>
                    <li>
                      <div className='tags has-addons'>
                        <span className='tag deadline-consolidate has-text-weight-semibold'>
                          <FormattedMessage
                            id="orgRules.cyclesInfo"
                            defaultMessage={`Concentrar Información`}
                          />
                        </span>
                        <span className='tag has-text-weight-semibold'>
                          {this.state.rules.consolidation}&nbsp; 
                          <FormattedMessage
                            id="orgRules.cyclesDay"
                            defaultMessage={`días`}
                          />
                        </span>
                      </div>
                    </li>
                  </ul>

                  <button className='button is-primary edit-btn'
                    onClick={() => this.setStep(4)}>
                    <FormattedMessage
                      id="orgRules.btnEdit"
                      defaultMessage={`días`}
                    />
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
        title: 'Configuración de datos', //TODO: translate
        hide: false,
        disabled: false,
        content: (
          <div className='columns section is-centered'>
            <div className='column'>
              <div className='card'>
                <div className='card-header'>
                  <p className='card-header-title'>
                    <FormattedMessage
                      id="orgRules.title"
                      defaultMessage={`Establece tus ciclos y periodos de ajuste`}
                    />
                  </p>
                </div>
                <div className='card-content'>
                  <p>
                    <FormattedMessage
                      id="orgRules.cyclesStart"
                      defaultMessage={`Inicio del ciclo`}
                    />:
                    <span className='has-text-weight-bold is-capitalized'>
                      {moment.utc(this.state.rules.startDate).format('DD-MMM-YYYY')}
                    </span>
                  </p>
                  <p>
                    <FormattedMessage
                      id="orgRules.cyclesDuration"
                      defaultMessage={`Duración de ciclo`}
                    />:
                    <span className='has-text-weight-bold is-capitalized'>
                      {this.state.rules.cycleDuration + ' ' + times[this.state.rules.cycle]}
                    </span>
                  </p>
                  <p>
                    <FormattedMessage
                      id="orgRules.cyclesAvailable"
                      defaultMessage={`Ciclos disponibles para ajuste`}
                    />:
                    <span className='has-text-weight-bold is-capitalized'>
                      {this.state.rules.cyclesAvailable}
                    </span>
                  </p>
                  <p>
                    <FormattedMessage
                      id="orgRules.season"
                      defaultMessage={`Temporada`}
                    />:
                      <span className='has-text-weight-bold is-capitalized'>
                        {this.state.rules.season}
                        <FormattedMessage
                          id="orgRules.cycles"
                          defaultMessage={`ciclos`}
                        />
                      </span>
                  </p>
                  <p>
                    <FormattedMessage
                      id="orgRules.periodDuration"
                      defaultMessage={`Duración de periodo`}
                    />:
                      <span className='has-text-weight-bold is-capitalized'>
                        {this.state.rules.periodDuration + ' ' + times[this.state.rules.period]}
                      </span>
                  </p>
                  <p>
                    <FormattedMessage
                      id="orgRules.periods"
                      defaultMessage={`Los periodos pertenecen al ciclo donde`}
                    />
                    <span className='has-text-weight-bold'>
                      {
                        this.state.rules.takeStart
                          ?  <FormattedMessage
                            id="orgRules.periodsStart"
                            defaultMessage={`inician.`}
                          />
                          : <FormattedMessage
                            id="orgRules.periodsEnd"
                            defaultMessage={`terminan.`}
                          />
                      }
                    </span>
                  </p>

                  <button className='button is-primary edit-btn'
                    onClick={() => this.setStep(2)}>
                    <FormattedMessage
                      id="orgRules.btnEdit"
                      defaultMessage={`Editar`}
                    />
                  </button>
                </div>
              </div>
            </div>

            <div className='column'>
              <div className='card'>
                <div className='card-header'>
                  <p className='card-header-title'>
                    <FormattedMessage
                      id="orgRules.catalogs"
                      defaultMessage={`Catálogos`}
                    />
                  </p>
                </div>
                <div className='card-content'>
                  <div className='tags'>
                    <div className='tag is-capitalized has-text-weight-semibold'>
                      <FormattedMessage
                        id="orgRules.price"
                        defaultMessage={`Precio`}
                      />
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
                    <FormattedMessage
                      id="orgRules.btnEdit"
                      defaultMessage={`Editar`}
                    />
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
            {
              this.state.unsaved &&
                <button
                  className={'button is-pulled-right is-success save-btn ' + this.state.isLoading}
                  disabled={!!this.state.isLoading}
                  onClick={() => { this.saveData() }}
                >
                  <FormattedMessage
                    id="orgRules.configBtnSave"
                    defaultMessage={`Guardar configuración`}
                  />
                </button>
            }

            <h4>
              <strong>
                <FormattedMessage
                  id="orgRules.configTitle"
                  defaultMessage={`Configura tus reglas de negocio`}
                />
              </strong>
            </h4>
            <FormattedMessage
              id="orgRules.configInfo"
              defaultMessage={`Edita los datos las veces que desees. Recuerda que tus reglas quedarán deshabilitadas y perderás la información.`}
            />
          </div>
        </div>
        {this.state.alert &&
          <div className='section'>
            <article className='message is-warning'>
              <div className='message-header has-text-white'>
                <p>
                  <FormattedMessage
                    id="orgRules.alertTitle"
                    defaultMessage={`Atención`}
                  />
                </p>
              </div>
              <div className='message-body is-size-6'>
                <div className='level'>
                  <div className='level-left'>
                    <div className='level-item'>
                      <span className='icon is-large has-text-warning'>
                        <i className='fa fa-exclamation-triangle fa-2x' />
                      </span>
                    </div>
                    <div className='level-item'>
                      <FormattedMessage
                        id="orgRules.alertContent1"
                        defaultMessage={`Tu configuración ha sido modificada, recuerda que`}
                      /> &nbsp;
                      <strong>
                        <FormattedMessage
                          id="orgRules.alertContent2"
                          defaultMessage={`debes actualizar tus proyectos`}
                        />
                      </strong>
                    </div>
                  </div>
                  <div className='level-right'>
                    <div className='level-item'>
                      <a
                        className='button is-info is-pulled-right'
                        onClick={() => this.showModalProjects()}>
                        <span>
                          <FormattedMessage
                            id="orgRules.alertBtn"
                            defaultMessage={`Actualizar Proyectos`}
                          />
                        </span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </div>
        }
        <Tabs
          tabs={this.tabs}
          selectedTab={this.state.selectedTab}
          className='is-fullwidth'
        />
        {this.projectsModal()}
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
        <Prompt
          when={this.state.unsaved}
          message={location => (
            //TODO: translate
            `Hay cambios a las reglas de negocio sin aplicar, ¿estás seguro de querer salir de esta página?`
          )}
        />
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
  title: 'Reglas', //TODO: translate
  icon: 'list',
  exact: true,
  roles: 'admin, orgadmin, analyst, manager-level-3',
  validate: [loggedIn, verifyRole],
  component: OrgRules
})
