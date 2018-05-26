import React, { Component } from 'react'
import api from '~base/api'
import BaseModal from '~base/components/base-modal'
import Tabs from '~base/components/base-tabs'
import OrgInfo from './steps/org-info'
import Periods from './steps/periods'
import Ranges from './steps/ranges'
import DeadLines from './steps/deadlines'
import CalendarRules from './steps/calendar-rules'
import Catalogs from './steps/catalogs'

class Wizard extends Component {
  constructor (props) {
    super(props)
    this.state = {
      modalClass: 'is-active',
      currentStep: 0,
      selectedTab: '1',
      rules: this.props.org.rules || {},
      stepsCompleted: []
    }
    this.tabs = []
  }

  componentWillMount () {
    console.log(this.props.org)
    let step = 0
    let tab = '1'

    let org = this.props.org
    /* if (org.rules) {
      if (!org.rules.cicle || !org.rules.period) {
        step = 0
        tab = '1'
      } else if (!org.rules.ranges) {
        step = 2
        tab = '3'
      } else if (!org.rules.range_adjustment) {
        step = 3
        tab = '4'
      } else if (org.rules.consolidation) {
        step = 4
        tab = '5'
      }

      this.setState({
        currentStep: step,
        selectedTab: tab
      })
    } */
  }
  hideModal () {
    this.setState({
      modalClass: ''
    })
  }

  nextStep (data) {
    if (data) {
      this.setState({
        rules: {
          ...this.state.rules,
          ...data
        }
      }, async () => {
        console.log('Rules', this.state.rules)
        let res = await this.saveData()
        if (res) {
          let step = this.state.currentStep + 1
          if (step >= this.tabs.length) {
            step = 0
          }
          this.setState({
            currentStep: step,
            stepsCompleted: this.state.stepsCompleted.concat(this.state.currentStep)
          })
        }
      })
    } else {
      let step = this.state.currentStep + 1
      if (step >= this.tabs.length) {
        step = 0
      }
      this.setState({
        currentStep: step
      })
    }
  }

  async saveData () {
    try {
      let url = '/app/organizations/rules/' + this.props.org.uuid
      let res = api.post(url, {
        ...this.state.rules
      })
      if (res) {
        return true
      } else {
        return false
      }
    } catch (e) {
      console.log(e)
      return false
    }
  }

  render () {
    console.log(this.state.stepsCompleted)
    this.tabs = [
      {
        name: '1',
        title: 'Paso 1 Organización',
        hide: false,
        content: (
          <OrgInfo org={this.props.org} nextStep={() => this.nextStep()} />
          )
      },
      {
        name: '2',
        title: 'Paso 2 Periodos',
        hide: false,
        disabled: !(Number(this.state.currentStep) > 1),
        content: (
          <Periods rules={this.state.rules} nextStep={(data) => this.nextStep(data)} />
          )
      }, {
        name: '3',
        title: 'Paso 3 Rangos',
        hide: false,
        reload: true,
        disabled: !(Number(this.state.currentStep) > 2),
        content: (
          <Ranges rules={this.state.rules} nextStep={(data) => this.nextStep(data)} />
          )
      },
      {
        name: '4',
        title: 'Paso 4 Ciclos de operación',
        hide: false,
        disabled: !(Number(this.state.currentStep) > 3),
        content: (
          <DeadLines startDate={this.state.rules.startDate} rules={this.state.rules} nextStep={(data) => this.nextStep(data)} />
          )
      },
      {
        name: '5',
        title: 'Paso 5 Resumen información',
        hide: false,
        disabled: !(Number(this.state.currentStep) > 4),
        content: (
          <div>
            <CalendarRules />
            <button onClick={() => this.nextStep()} className='button is-primary'>Continuar</button>
          </div>
          )
      },
      {
        name: '6',
        title: 'Paso 6 Info de Ventas',
        hide: false,
        disabled: !(Number(this.state.currentStep) > 5),
        content: (
          <Catalogs nextStep={(data) => this.nextStep(data)} />
          )
      },
      {
        name: '7',
        title: 'Paso 7 Finalizar',
        hide: false,
        disabled: !(Number(this.state.currentStep) > 6),
        content: (
          <div className='section'>
            <center>
              <h1 className='title is-4'> Haz tarminado la configuración, ya puedes crear un proyecto</h1>

              <button className='button is-primary'>Crear Proyecto</button>
            </center>
          </div>
          )
      }
    ]

    return (
      <div className='wizard'>
        <BaseModal
          title='Wizard'
          className={this.state.modalClass}
          hideModal={this.hideModal} >
          <div className='section-header'>
            <h2>Wizard</h2>
          </div>
          <div className='container'>
            <Tabs
              onChangeTab={(tab) => this.setState({ actualTab: tab })}
              tabs={this.tabs}
              selectedTab={this.tabs[this.state.currentStep].name}
              className='is-fullwidth'
          />
          </div>
        </BaseModal>
      </div>
    )
  }
}

export default Wizard
