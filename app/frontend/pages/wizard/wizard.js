import React, { Component } from 'react'
import api from '~base/api'
import BaseModal from '~base/components/base-modal'
import Tabs from '~base/components/base-tabs'
import OrgInfo from './steps/org-info'
import Periods from './steps/periods'
import Ranges from './steps/ranges'
import DeadLines from './steps/deadlines'
import Catalogs from './steps/catalogs'
import Rules from './steps/rules'

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
    let step = 0
    let tab = '1'

    let org = this.props.org
    if (org.rules) {
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
    }
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
          ...data,
          step: this.state.currentStep
        }
      }, async () => {
      })
    }
    let step = this.state.currentStep + 1
    if (step >= this.tabs.length) {
      step = this.tabs.length
    }
    this.stepCompleted(step)
  }

  stepCompleted (step) {
    let steps = this.state.stepsCompleted
    if (steps.indexOf(step) === -1) {
      steps.push(step)
      this.setState({
        currentStep: step,
        stepsCompleted: steps
      })
    } else {
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

  actualTab (tab) {
    this.setState({
      actualTab: tab,
      currentStep: Number(tab) - 1
    })
  }

  render () {
    this.tabs = [
      {
        name: '1',
        title: 'Organización',
        hide: false,
        content: (
          <OrgInfo org={this.props.org} nextStep={() => this.nextStep()} />
          )
      },
      {
        name: '2',
        title: 'Periodos',
        hide: false,
        disabled: !(this.state.stepsCompleted.length >= 1),
        content: (
          <Periods rules={this.state.rules} nextStep={(data) => this.nextStep(data)} />
          )
      }, {
        name: '3',
        title: 'Rangos',
        hide: false,
        reload: true,
        disabled: !(this.state.stepsCompleted.length >= 2),
        content: (
          <Ranges rules={this.state.rules} nextStep={(data) => this.nextStep(data)} />
          )
      },
      {
        name: '4',
        title: 'Ciclos de operación',
        hide: false,
        disabled: !(this.state.stepsCompleted.length >= 3),
        content: (
          <DeadLines startDate={this.state.rules.startDate} rules={this.state.rules} nextStep={(data) => this.nextStep(data)} />
          )
      },
      {
        name: '5',
        title: 'Catálogos de Ventas',
        hide: false,
        disabled: !(this.state.stepsCompleted.length >= 4),
        content: (
          <Catalogs nextStep={(data) => this.nextStep(data)} />
          )
      },
      {
        name: '6',
        title: 'Finalizar',
        hide: false,
        disabled: !(this.state.stepsCompleted.length >= 5),
        content: (
          <div className='section'>
            <Rules rules={this.state.rules} />

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
              onChangeTab={(tab) => this.actualTab(tab)}
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
