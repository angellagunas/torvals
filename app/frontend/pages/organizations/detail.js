import React, { Component } from 'react'
import { branch } from 'baobab-react/higher-order'
import PropTypes from 'baobab-react/prop-types'
import Link from '~base/router/link'
import api from '~base/api'
import Loader from '~base/components/spinner'
import { testRoles } from '~base/tools'
import tree from '~core/tree'
import { toast } from 'react-toastify'

import Page from '~base/page'
import {loggedIn, verifyRole} from '~base/middlewares/'
import { BranchedPaginatedTable } from '~base/components/base-paginated-table'
import OrganizationForm from './form'
import Breadcrumb from '~base/components/base-breadcrumb'
import NotFound from '~base/components/not-found'

import Tabs from '~base/components/base-tabs'
import Periods from '../wizard/steps/periods'
import Ranges from '../wizard/steps/ranges'
import DeadLines from '../wizard/steps/deadlines'
import CalendarRules from '../wizard/steps/calendar-rules'
import Catalogs from '../wizard/steps/catalogs'
import Rules from '../wizard/steps/rules'

class OrganizationDetail extends Component {
  constructor (props) {
    super(props)
    this.state = {
      loading: true,
      loaded: false,
      organization: {},
      isLoading: '',    
      currentStep: 1,
      selectedTab: '1',
      rules: {},
      stepsCompleted: [],
      unsaved: false
    }
    this.tabs = []
  }

  componentWillMount () {
    this.context.tree.set('organizations', {
      page: 1,
      totalItems: 0,
      items: [],
      pageLength: 10
    })
    this.context.tree.commit()
    this.load()
  }

  async load () {
    var url = '/app/organizations/' + this.props.match.params.uuid
    
    try {
      const body = await api.get(url)

      this.setState({
        organization: body.data,
      })
    } catch (e) {
      await this.setState({
        loading: false,
        loaded: true,
        notFound: true
      })
    }

    await this.loadRules()
  }

  async loadRules () {
    var url = '/app/rules/active'
    
    try {
      const body = await api.get(url)

      this.setState({
        loading: false,
        loaded: true,
        rules: body.data
      })
    } catch (e) {
      await this.setState({
        loading: false,
        loaded: true,
        notFound: true
      })
    }
  }

  notify(message = '', timeout = 5000, type = toast.TYPE.INFO) {
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

  getColumns () {
    return [
      {
        'title': 'Nombre',
        'property': 'name',
        'default': 'N/A',
        'sortable': true
      },
      {
        'title': 'Email',
        'property': 'email',
        'default': 'N/A',
        'sortable': true,
      },
      {
        'title': 'Acciones',
        formatter: (row) => {
          if (testRoles('manager-level-2, consultor-level-3')) {
            return (
              <Link className='button is-primary' to={'/manage/users/' + row.uuid}>
                <span className='icon is-small' title='Visualizar'>
                  <i className='fa fa-eye' />
                </span>
              </Link>
            )
          } else {
            return (
              <Link className='button is-primary' to={'/manage/users/' + row.uuid}>
                <span className='icon is-small' title='Editar'>
                  <i className='fa fa-pencil' />
                </span>
              </Link>
            )
          }
        }
      }
    ]
  }

  submitHandler() {
    this.setState({ isLoading: ' is-loading' })
  }

  errorHandler() {
    this.setState({ isLoading: '' })
  }

  finishUpHandler() {
    this.setState({ isLoading: '' })
  }


  nextStep(data, step) {
    if (data) {
      this.setState({
        rules: {
          ...this.state.rules,
          ...data,
          step: step
        },
        unsaved: true,
        currentStep: 1
      })
    }
  }

  stepCompleted(step) {
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

  async saveData() {
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

        this.setState({unsaved: false})
        tree.set('rule', res.rules)
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

  actualTab(tab) {
    this.setState({
      actualTab: tab,
    })
  }

  setStep(step){
    this.setState({currentStep: step})
  }

  render () {
    const { organization } = this.state

    if (this.state.notFound) {
      return <NotFound msg='esta organización' />
    }

    if (!organization.uuid || !this.state.loaded) {
      return <Loader />
    }

    this.tabs = [
      {
        name: '0',
        title: 'Organización',
        hide: false,
        content: (
          <div>
            <div className='section pad-sides has-20-margin-top'>
              <div className='columns'>
                <div className='column'>
                  <div className='card'>
                    <header className='card-header'>
                      <p className='card-header-title'>
                        Detalle
                    </p>
                    </header>
                    <div className='card-content'>
                      <div className='columns'>
                        <div className='column'>
                          <OrganizationForm
                            baseUrl='/app/organizations'
                            url={'/app/organizations/' + this.props.match.params.uuid}
                            initialState={this.state.organization}
                            load={this.load.bind(this)}
                            submitHandler={(data) => this.submitHandler(data)}
                            errorHandler={(data) => this.errorHandler(data)}
                            finishUp={(data) => this.finishUpHandler(data)}
                          >
                            <div className='field is-grouped'>
                              <div className='control'>
                                <button
                                  className={'button is-primary ' + this.state.isLoading}
                                  disabled={!!this.state.isLoading}
                                  type='submit'
                                >Guardar</button>
                              </div>
                            </div>
                          </OrganizationForm>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className='column'>
                  <div className='card'>
                    <header className='card-header'>
                      <p className='card-header-title'>
                        Usuarios
                    </p>
                    </header>
                    <div className='card-content'>
                      <div className='columns'>
                        <div className='column'>
                          <BranchedPaginatedTable
                            branchName='users'
                            baseUrl='/app/users'
                            columns={this.getColumns()}
                            filters={{ organization: this.props.match.params.uuid }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      },
      {
        name: '1',
        title: 'Reglas de la organización',
        hide: !(this.state.currentStep === 1),
        reload: true,
        disabled: !(this.state.currentStep === 1),
        content: (
          <Rules
            rules={this.state.rules}
            setStep={(step) => this.setStep(step)}
            save={async () => { await this.saveData() }}
            unsaved={this.state.unsaved}
          />
        )
      }, 
      {
        name: '2',
        title: 'Periodos',
        hide: !(this.state.currentStep === 2),
        disabled: !(this.state.currentStep === 2),
        content: (
          <Periods 
            rules={this.state.rules} 
            nextStep={(data) => this.nextStep(data,1)}
            setStep={(step) => this.setStep(step)}
             />
        )
      }, {
        name: '3',
        title: 'Rangos',
        hide: !(this.state.currentStep === 3),
        reload: true,
        disabled: !(this.state.currentStep === 3),
        content: (
          <Ranges 
            rules={this.state.rules} 
            nextStep={(data) => this.nextStep(data,2)} 
            setStep={(step) => this.setStep(step)}
          />
        )
      },
      {
        name: '4',
        title: 'Ciclos de operación',
        hide: !(this.state.currentStep === 4),
        disabled: !(this.state.currentStep === 4),
        content: (
          <DeadLines 
            startDate={this.state.rules.startDate} 
            rules={this.state.rules} 
            nextStep={(data) => this.nextStep(data,3)}
            setStep={(step) => this.setStep(step)} />
        )
      },
      {
        name: '5',
        title: 'Catálogos de Ventas',
        hide: !(this.state.currentStep === 5),
        disabled: !(this.state.currentStep === 5),
        content: (
          <Catalogs 
            rules={this.state.rules}
            nextStep={(data) => this.nextStep(data,4)} 
            setStep={(step) => this.setStep(step)}
            />
        )
      }
    ]

    return (
     
      <div className='wizard'>
        <div className='section-header'>
          <h2>{organization.name}</h2>
        </div>
        <Breadcrumb
          path={[
            {
              path: '/',
              label: 'Inicio',
              current: false
            },
            {
              path: '/organizations/',
              label: organization.name,
              current: true
            }
          ]}
          align='left'
        />
        <Tabs
          onChangeTab={(tab) => this.actualTab(tab)}
          tabs={this.tabs}
          selectedTab={this.tabs[this.state.currentStep].name}
          className='is-fullwidth'
        />
      </div>
    )
  }
}

OrganizationDetail.contextTypes = {
  tree: PropTypes.baobab
}

const branchedOrganizationDetail = branch({organizations: 'organizations'}, OrganizationDetail)

export default Page({
  path: '/manage/organizations/:uuid',
  title: 'User details',
  exact: true,
  roles: 'admin, orgadmin, analyst, manager-level-3',
  validate: [loggedIn, verifyRole],
  component: branchedOrganizationDetail
})
  