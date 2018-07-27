import React, { Component } from 'react'
import tree from '~core/tree'
import { toast } from 'react-toastify'
import api from '~base/api'
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
      rules: this.props.rules || {},
      stepsCompleted: []
    }
    this.tabs = []
  }

  componentWillMount () {
    let step = 0
    let tab = '1'
    let rules = this.state.rules

    if (rules) {
      if (!rules.cicle || !rules.period) {
        step = 0
        tab = '1'
      } else if (!rules.ranges) {
        step = 2
        tab = '3'
      } else if (!rules.range_adjustment) {
        step = 3
        tab = '4'
      } else if (rules.consolidation) {
        step = 4
        tab = '5'
      }

      this.setState({
        currentStep: step,
        selectedTab: tab
      })
    }
  }

  setStep (step) {
    this.setState({ currentStep: step })
  }

  nextStep (data, step) {
    if (data) {
      this.setState({
        rules: {
          ...this.state.rules,
          ...data,
          step: step
        },
        unsaved: step === 1,
        currentStep: step
      })
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

  async saveData () {
    try {
      let url = '/app/rules'

      let res = await api.post(url, {
        ...this.state.rules,
        important: true
      })

      if (res) {
        //TODO: translate
        this.notify(
          '¡Las nuevas reglas de negocio se han guardado exitosamente!',
          5000,
          toast.TYPE.SUCCESS
        )

        this.setState({unsaved: false})

        let me = await api.get('/user/me')
        tree.set('user', me.user)
        tree.set('organization', me.user.currentOrganization)
        tree.set('rule', me.rule)
        tree.set('role', me.user.currentRole)
        tree.set('loggedIn', me.loggedIn)
        tree.commit()
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
        name: '0',
        title: 'Organización', //TODO: translate
        hide: !(this.state.currentStep === 0),
        disabled: !(this.state.currentStep === 0),
        content: (
          <OrgInfo org={this.props.org} nextStep={() => this.setStep(2)} />
          )
      },
      {
        name: '1',
        title: 'Resumen', //TODO: translate
        hide: !(this.state.currentStep === 1),
        disabled: !(this.state.currentStep === 1),
        content: (
          <div className='section'>
            <Rules
              org={this.props.org}
              rules={this.state.rules}
              setStep={(step) => this.setStep(step)}
              save={() => { this.saveData() }}
              unsaved={this.state.unsaved} />
          </div>
        )
      },
      {
        name: '2',
        title: 'Periodos', //TODO: translate
        hide: !(this.state.currentStep === 2),
        disabled: !(this.state.currentStep === 2),
        content: (
          <Periods
            org={this.props.org}
            rules={this.state.rules}
            nextStep={(data, step) => this.nextStep(data, step)}
            setStep={(step) => this.setStep(step)}
            completed={this.state.stepsCompleted} />
          )
      }, {
        name: '3',
        title: 'Rangos', //TODO: translate
        hide: !(this.state.currentStep === 3),
        disabled: !(this.state.currentStep === 3),
        reload: true,
        content: (
          <Ranges
            org={this.props.org}
            rules={this.state.rules}
            nextStep={(data, step) => this.nextStep(data, step)}
            setStep={(step) => this.setStep(step)}
            completed={this.state.stepsCompleted} />
          )
      },
      {
        name: '4',
        title: 'Ciclos de operación', //TODO: translate
        hide: !(this.state.currentStep === 4),
        disabled: !(this.state.currentStep === 4),
        content: (
          <DeadLines
            org={this.props.org}
            startDate={this.state.rules.startDate}
            rules={this.state.rules}
            nextStep={(data, step) => this.nextStep(data, step)}
            setStep={(step) => this.setStep(step)}
            completed={this.state.stepsCompleted} />
          )
      },
      {
        name: '5',
        title: 'Catálogos de Ventas', //TODO: translate
        hide: !(this.state.currentStep === 5),
        disabled: !(this.state.currentStep === 5),
        content: (
          <Catalogs
            org={this.props.org}
            rules={this.props.rules}
            nextStep={(data, step) => this.nextStep(data, step)}
            setStep={(step) => this.setStep(step)}
            completed={this.state.stepsCompleted} />
          )
      }
    ]

    return (
      <div className='wizard wizard__modal'>
        <div className='container'>
          <div className='section-header'>
            <h2>
              <figure className='image'>
                <img className='logo' src='/app/public/img/oraxh.svg' />
              </figure>
            </h2>
          </div>
          <Tabs
            onChangeTab={(tab) => this.actualTab(tab)}
            tabs={this.tabs}
            selectedTab={this.tabs[this.state.currentStep].name}
            className='is-fullwidth'
          />
        </div>
      </div>
    )
  }
}

export default Wizard
