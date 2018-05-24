import React, { Component } from 'react'
import BaseModal from '~base/components/base-modal'
import Tabs from '~base/components/base-tabs'
import OrgInfo from './steps/org-info'
import Periods from './steps/periods'

class Wizard extends Component {
  constructor (props) {
    super(props)
    this.state = {
      modalClass: 'is-active',
      currentStep: 0,
      selectedTab: 'step1'
    }

    this.tabs = [
      {
        name: 'step1',
        title: 'Paso 1 Organización',
        hide: false,
        content: (
          <div>
            <OrgInfo />
            <button onClick={() => this.nextStep()} className='button is-primary'>Continuar</button>
          </div>
        )
      },
      {
        name: 'step2',
        title: 'Paso 2 Periodos',
        hide: false,
        content: (
          <div>
            <Periods nextStep={(data) => this.nextStep(data)} />
          </div>
        )
      }, {
        name: 'step3',
        title: 'Paso 3 Rangos',
        hide: false,
        content: (
          <div>
            <OrgInfo />
            <button onClick={() => this.nextStep()} className='button is-primary'>Continuar</button>
          </div>
        )
      },
      {
        name: 'step4',
        title: 'Paso 4 Ciclos de operación',
        hide: false,
        content: (
          <div>
            <OrgInfo />
            <button onClick={() => this.nextStep()} className='button is-primary'>Continuar</button>
          </div>
        )
      },
      {
        name: 'step5',
        title: 'Paso 5 Resumen información',
        hide: false,
        content: (
          <div>
            <OrgInfo />
            <button onClick={() => this.nextStep()} className='button is-primary'>Continuar</button>
          </div>
        )
      },
      {
        name: 'step6',
        title: 'Paso 6 Info de Ventas',
        hide: false,
        content: (
          <div>
            <OrgInfo />
            <button onClick={() => this.nextStep()} className='button is-primary'>Continuar</button>
          </div>
        )
      },
      {
        name: 'step7',
        title: 'Paso 7 Finalizar',
        hide: false,
        content: (
          <div>
            <OrgInfo />
            <button onClick={() => this.nextStep()} className='button is-primary'>Continuar</button>
          </div>
        )
      }
    ]
  }

  hideModal () {
    this.setState({
      modalClass: ''
    })
  }

  nextStep (data) {
    console.log(data)
    let step = this.state.currentStep + 1
    if (step >= this.tabs.length) {
      step = 0
    }
    this.setState({
      currentStep: step
    })
  }

  render () {
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
