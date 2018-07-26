import {isEmpty} from 'lodash'
import React, { Component } from 'react'
import { root } from 'baobab-react/higher-order'

import tree from '~core/tree'
import classNames from 'classnames'

import cookies from '~base/cookies'
import api from '~base/api'
import Loader from '~base/components/spinner'

import Sidebar from '~components/sidebar'
import AdminNavBar from '~components/admin-navbar'
import { ToastContainer } from 'react-toastify'
import { withRouter } from 'react-router'

class AdminLayout extends Component {
  constructor (props) {
    super(props)
    this.state = {
      user: {},
      loaded: false,
      sidebarCollapsed: false,
      activePath: ''
    }
  }

  handleBurgerEvent () {
    this.setState({sidebarCollapsed: !this.state.sidebarCollapsed})
  }

  handlePathChange (activePath) {
    this.setState({activePath})
  }

  async componentWillMount () {
    const userCursor = tree.select('user')

    userCursor.on('update', ({data}) => {
      const user = data.currentData
      this.setState({user})
    })

    var me
    if (tree.get('jwt')) {
      try {
        me = await api.get('/user/me')
      } catch (err) {
        if (err.status === 401) {
          cookies.remove('jwt')
          cookies.remove('organization')
          tree.set('jwt', null)
          tree.set('user', null)
          tree.set('rule', null)
          tree.set('organization', null)
          tree.set('role', null)
          tree.commit()
        }

        return this.setState({loaded: true})
      }

      tree.set('user', me.user)
      tree.set('organization', me.user.currentOrganization)
      tree.set('role', me.user.currentRole)
      tree.set('rule', me.rule)
      tree.set('loggedIn', me.loggedIn)
      tree.commit()

      if (!me.user.currentOrganization) {
        cookies.remove('jwt')
        cookies.remove('organization')
        tree.set('jwt', null)
        tree.set('user', null)
        tree.set('organization', null)
        tree.set('role', null)
        tree.set('rule', null)
        tree.set('loggedIn', false)
        await tree.commit()
      }
    }

    this.setState({loaded: true})
    this.getViewPort()
  }

  getViewPort () {
    let w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0)
    if (w <= 1024) {
      this.setState({
        sidebarCollapsed: false
      })
    }
  }

  openNav = () => {
    this.setState({
      open: this.state.open === 'open' ? '' : 'open'
    })
  }

  openWizards() {
    this.setState({
      openWizards: this.state.openWizards === 'is-active' ? '' : 'is-active'
    })
  }

  moveTo(route){
    this.openWizards()
    this.props.history.push(route)
  }

  render () {
    const mainClass = classNames('main-wrapper',{
      'sidenav-open': this.state.sidebarCollapsed
    })

    const burguerIcon = classNames('fa fa-2x',{
      'fa-times': this.state.sidebarCollapsed,
      'fa-bars': !this.state.sidebarCollapsed,
    })

    if (!this.state.loaded) {
      return <Loader />
    }

    if (!isEmpty(this.state.user)) {
      return (
        <div className='is-wrapper'>
          <AdminNavBar
            handlePathChange={(p) => this.handlePathChange(p)}
            collapsed={this.state.sidebarCollapsed}
            handleBurgerEvent={() => this.handleBurgerEvent()}
            openWizards={() => this.openWizards()} />
          
          
          {this.state.user.currentRole && this.state.user.currentRole.slug !== 'manager-level-1' &&
          <div>
          <div className='icon is-large is-clickable is-hamburguer'
          onClick={() => {this.handleBurgerEvent()}}>
          <i className={burguerIcon} />
          </div>
          <Sidebar
            collapsed={this.state.sidebarCollapsed}
            activePath={this.state.activePath} />
           </div> 
          }

          <div className={this.state.user.currentRole && this.state.user.currentRole.slug === 'manager-level-1' ? mainClass + ' main-wrapper-lvl-1' : mainClass}>
            <section className='card main'>
              {this.props.children}
              <ToastContainer />
            </section>
          </div>


          <div className={'modal wizard-steps-modal ' + this.state.openWizards}>
            <div className='modal-background' onClick={() => this.openWizards()}/>
            <div className='modal-card'>
              <header className='modal-card-head'>
                <p className='modal-card-title'>Inicia con Orax</p>
                <button className='delete' aria-label='close' onClick={() => this.openWizards()}></button>
              </header>
              <section className='modal-card-body'>
                {!this.state.user.currentOrganization.wizardSteps.businessRules ?
                  'Comienza con la configuración de reglas de negocio para crear un proyecto.'
                  :
                  'Continúa configurando los pasos restantes'
                }
                <p className={ 
                this.state.user.currentOrganization.wizardSteps.businessRules ||
                    this.state.user.currentOrganization.isConfigured ? 
                    'wizard-step done has-20-margin-top' : 'wizard-step has-20-margin-top'
                }>
                <strong>Reglas de negocio </strong>
                Deberás establecer tus ciclos y periodos de ajuste.
                <span className='icon has-text-success'>
                  <i className='fa fa-check fa-lg'/>
                </span>
                </p>

                <p className={
                  this.state.user.currentOrganization.wizardSteps.project ?
                    'wizard-step done' : 
                    this.state.user.currentOrganization.wizardSteps.businessRules ||
                      this.state.user.currentOrganization.isConfigured  ?
                    'wizard-step' :
                    'wizard-step disabled' 
                  }
                  onClick={() => {
                    this.moveTo('/projects')
                  }}
                >
                  <strong>Proyecto </strong>
                  Crea un proyecto para generar predicciones.
                <span className='icon has-text-success'>
                    <i className='fa fa-check fa-lg' />
                  </span>
                </p>

                <p className={
                  this.state.user.currentOrganization.wizardSteps.forecast ?
                    'wizard-step done' : 
                    this.state.user.currentOrganization.wizardSteps.businessRules ||
                      this.state.user.currentOrganization.isConfigured &&
                    this.state.user.currentOrganization.wizardSteps.project ?
                    'wizard-step' :
                    'wizard-step disabled'
                  }
                  onClick={() => {
                    this.moveTo('/forecast')
                  }}
                  >
                  <strong>Predicción </strong>
                  Realiza predicciones por proyecto.
                <span className='icon has-text-success'>
                    <i className='fa fa-check fa-lg' />
                  </span>
                </p>

                <p className={
                  this.state.user.currentOrganization.wizardSteps.users ?
                    'wizard-step done' : 
                    this.state.user.currentOrganization.wizardSteps.businessRules ||
                      this.state.user.currentOrganization.isConfigured &&
                    this.state.user.currentOrganization.wizardSteps.project ?
                      'wizard-step' :
                      'wizard-step disabled'
                  }
                  onClick={() => {
                    this.moveTo('/manage/users-groups')
                  }}
                  >
                  <strong>Usuarios </strong>
                  Agrega, edita o elimina usuarios.
                <span className='icon has-text-success'>
                    <i className='fa fa-check fa-lg' />
                  </span>
                </p>
                <br/>
                <button className='button is-primary is-inverted is-pulled-right'
                  onClick={() => this.openWizards()}>Omitir</button>

              </section>    
              
            </div>
            </div>
        </div>)
    } else {
      return (<div>
        {this.props.children}
      </div>)
    }
  }
}

export default withRouter(root(tree, AdminLayout))
