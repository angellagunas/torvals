import React, { Component } from 'react'
import { FormattedMessage, injectIntl } from 'react-intl'
import api from '~base/api'
import moment from 'moment'
import env from '~base/env-variables'
import FontAwesome from 'react-fontawesome'

import Loader from '~base/components/spinner';
import UserForm from './form';
import Multiselect from '~base/components/base-multiselect';
import tree from '~core/tree';
import Breadcrumb from '~base/components/base-breadcrumb';
import NotFound from '~base/components/not-found';

class UserDetail extends Component {
  constructor (props) {
    super(props)
    this.state = {
      loaded: false,
      loading: true,
      resetLoading: false,
      resetText: this.formatTitle('user.resetText'),
      resetClass: 'button is-danger',
      user: {},
      roles: [],
      groups: [],
      projects: [],
      selectedGroups: [],
      saving: false,
      saved: false,
      isLoading: ''
    }
  }

  componentWillMount () {
    this.load()
    this.loadGroups()
    this.loadRoles()
    this.loadProjects()
  }

  formatTitle (id) {
    return this.props.intl.formatMessage({ id: id })
  }

  async loadProjects () {
    var url = '/app/projects/'
    const body = await api.get(url, {
      start: 0,
      limit: 0
    })

    this.setState({
      projects: body.data
    })
  }
  async load () {
    var url = '/app/users/' + this.props.user.uuid
    try {
      const body = await api.get(url)
      const role = tree._data.user.currentRole.slug
      const groups = role == 'orgadmin' ? body.data.groups : body.data.groups.filter(item => tree._data.user.groups.includes(item._id))

      await this.setState({
        loading: false,
        loaded: true,
        user: body.data,
        selectedGroups: groups
      })
    } catch (e) {
      await this.setState({
        loading: false,
        loaded: true,
        notFound: true
      })
    }
  }

  async loadGroups () {
    var url = '/app/groups/'
    const role = tree._data.user.currentRole.slug
    const body = await api.get(
      url,
      {
        user_orgs: this.props.user.uuid,
        start: 0,
        limit: 0
      }
    )

    const groups = role == 'orgadmin' ? body.data : body.data.filter(item => tree._data.user.groups.includes(item._id))

    this.setState({
      ...this.state,
      groups: groups
    })
  }

  async loadRoles () {
    var url = '/app/roles/'
    const body = await api.get(
      url,
      {
        start: 0,
        limit: 0
      }
    )

    this.setState({
      ...this.state,
      roles: body.data
    })
  }

  getDateCreated () {
    if (this.state.user.dateCreated) {
      return moment.utc(
        this.state.user.dateCreated
      ).format('DD/MM/YYYY hh:mm a')
    }

    return 'N/A'
  }

  async availableGroupOnClick (uuid) {
    this.setState({
      saving: true
    })

    var selected = this.state.selectedGroups
    var group = this.state.groups.find(item => { return item.uuid === uuid })

    if (selected.findIndex(item => { return item.uuid === uuid }) !== -1) {
      return
    }

    selected.push(group)

    var url = '/app/users/' + this.props.user.uuid + '/add/group'
    await api.post(url,
      {
        group: uuid
      }
    )

    setTimeout(() => {
      this.setState({
        saving: false,
        saved: true
      })
    }, 300)
  }

  async assignedGroupOnClick (uuid) {
    this.setState({
      saving: true
    })

    var index = this.state.selectedGroups.findIndex(item => { return item.uuid === uuid })
    var selected = this.state.selectedGroups

    if (index === -1) {
      return
    }

    selected.splice(index, 1)

    this.setState({
      selectedGroups: selected
    })

    var url = '/app/users/' + this.props.user.uuid + '/remove/group'
    await api.post(url,
      {
        group: uuid
      }
    )

    setTimeout(() => {
      this.setState({
        saving: false,
        saved: true
      })
    }, 300)
  }

  async resetOnClick () {
    await this.setState({
      resetLoading: true,
      resetText: this.formatTitle('user.resetText1'),
      resetClass: 'button is-info'
    })

    var url = '/user/reset-password'

    try {
      await api.post(url, {email: this.state.user.email})
      setTimeout(() => {
        this.setState({
          resetLoading: true,
          resetText: this.formatTitle('user.resetText2'),
          resetClass: 'button is-success'
        })
      }, 3000)
    } catch (e) {
      await this.setState({
        resetLoading: true,
        resetText: this.formatTitle('user.resetText3'),
        resetClass: 'button is-danger'
      })
    }

    setTimeout(() => {
      this.setState({
        resetLoading: false,
        resetText: this.formatTitle('user.resetText'),
        resetClass: 'button is-danger'
      })
    }, 10000)
  }

  getSavingMessage () {
    let {saving, saved} = this.state

    if (saving) {
      return (
        <p className='card-header-title' style={{fontWeight: '200', color: 'grey'}}>
          <FormattedMessage
            id='user.saving'
            defaultMessage={`Guardando`}
          /> <span style={{paddingLeft: '5px'}}><FontAwesome className='fa-spin' name='spinner' /></span>
        </p>
      )
    }

    if (saved) {
      if (this.savedTimeout) {
        clearTimeout(this.savedTimeout)
      }

      this.savedTimeout = setTimeout(() => {
        this.setState({
          saved: false
        })
      }, 500)

      return (
        <p className='card-header-title' style={{fontWeight: '200', color: 'grey'}}>
          <FormattedMessage
            id='user.saved'
            defaultMessage={`Guardado`}
          />
        </p>
      )
    }
  }

  submitHandler () {
    this.setState({ isLoading: ' is-loading' })
  }

  errorHandler () {
    this.setState({ isLoading: '' })
  }

  async finishUpHandler () {
    await this.updateStep()
    this.setState({ isLoading: '' })
  }

  async updateStep () {
    try {
      let user = tree.get('user')
      if (user.currentOrganization.wizardSteps.users) {
        return
      }
      let url = '/app/organizations/' + user.currentOrganization.uuid + '/step'

      let res = await api.post(url, {
        step: {
          name: 'users',
          value: true
        }
      })

      if (res) {
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

  render () {
    if (this.state.notFound) {
      return <NotFound msg={this.formatTitle('user.notFound')} />
    }
    const { user } = this.state
    const currentUser = tree.get('user')

    var disabledForm = false
    if (user.roleDetail && currentUser) {
      disabledForm = user.roleDetail.priority <= currentUser.currentRole.priority
    }

    var disabledRoles = false
    if (user.roleDetail && currentUser.currentRole.slug === 'consultor-level-3') {
      disabledRoles = true
      disabledForm = true
    }

    if (currentUser.currentRole.slug === 'orgadmin') {
      disabledRoles = false
      disabledForm = false
    }

    if (user) {
      let role
      if (this.state.formData && this.state.formData.roleDetail) {
        role = this.state.formData.roleDetail
      }

      if (role && role.slug === 'manager-level-1') {
        var currentOrg = user.organizations.find((item) => {
          return item.organization.uuid === currentUser.currentOrganization.uuid
        })

        if (currentOrg.defaultProject) {
          var currentProject = this.state.projects.find((item) => {
            return item.uuid === currentOrg.defaultProject.uuid
          })

          if (currentProject) {
            this.state.user.project = currentProject.uuid
          }
        }
      }
    }

    if (!user.uuid) {
      return <Loader />
    }

    const availableList = this.state.groups.filter(item => {
      return (this.state.selectedGroups.findIndex(group => {
        return group.uuid === item.uuid
      }) === -1)
    })

    var resetButton
    if (env.EMAIL_SEND) {
      resetButton = (
        <div className='column has-text-right'>
          <div className='field is-grouped is-grouped-right'>
            <div className='control'>
              <button
                className={this.state.resetClass}
                type='button'
                onClick={() => this.resetOnClick()}
                disabled={!!this.state.resetLoading || disabledForm}>
                {this.state.resetText}
              </button>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className='detail-page'>

        <div className='level'>
          <div className='level-left'>
            <div className='level-item'>
              <Breadcrumb
                path={[
                  {
                    path: '/',
                    label: this.formatTitle('user.breadcrumbStart'),
                    current: false
                  },
                  {
                    path: '/manage/users-groups',
                    label: this.formatTitle('user.breadcrumbUsers'),
                    current: false,
                    onclick: (e) => {
                      e.preventDefault()
                      this.props.selectUser()
                    }
                  },
                  {
                    path: '/manage/users',
                    label: this.formatTitle('user.breadcrumbDetail'),
                    current: true
                  },
                  {
                    path: '/manage/users/',
                    label: user.name,
                    current: true
                  }
                ]}
                align='left'
            />
            </div>
          </div>
          <div className='level-right'>
            <div className='level-item'>
              <a
                className='button is-info'
                onClick={() => { this.props.selectUser() }}
              >
                <FormattedMessage
                  id='user.back'
                  defaultMessage={`Regresar`}
                />
              </a>
            </div>
            <div className='level-item'>
              {!disabledForm && resetButton}
            </div>
          </div>
        </div>
        <div className='section is-paddingless-top pad-sides'>

          <div className='columns is-mobile'>
            <div className='column'>
              <div className='card'>
                <header className='card-header'>
                  <p className='card-header-title'>
                    <FormattedMessage
                      id='user.detail'
                      defaultMessage={`Detalle`}
                    />
                  </p>
                </header>
                <div className='card-content'>
                  <div className='columns'>
                    <div className='column'>
                      <UserForm
                        baseUrl='/app/users'
                        url={'/app/users/' + this.props.user.uuid}
                        initialState={this.state.user}
                        load={this.load.bind(this)}
                        roles={this.state.roles || []}
                        projects={this.state.projects}
                        submitHandler={(data) => this.submitHandler(data)}
                        errorHandler={(data) => this.errorHandler(data)}
                        finishUp={(data) => this.finishUpHandler(data)}
                        disabled={disabledForm}
                        disabledRoles={disabledRoles}
                        >
                        <div className='field is-grouped'>
                          <div className='control'>
                            {!disabledForm &&
                              <button
                                className={'button is-primary ' + this.state.isLoading}
                                disabled={!!this.state.isLoading}
                                type='submit'
                              >
                                <FormattedMessage
                                  id='user.btnSave'
                                  defaultMessage={`Guardar`}
                                />
                              </button>
                            }
                          </div>
                        </div>
                      </UserForm>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className='column'>
              <div className='columns'>
                <div className='column'>
                  <div className='card'>
                    <header className='card-header'>
                      <p className='card-header-title'>
                        <FormattedMessage
                          id='user.groups'
                          defaultMessage={`Grupos`}
                        />
                      </p>
                      <div>
                        {this.getSavingMessage()}
                      </div>
                    </header>
                    <div className='card-content'>
                      <Multiselect
                        availableTitle={this.formatTitle('user.multiselectAvailableTitle')}
                        assignedTitle={this.formatTitle('user.multiselectAssignedTitle')}
                        assignedList={this.state.selectedGroups}
                        availableList={availableList}
                        dataFormatter={(item) => { return item.name || 'N/A' }}
                        availableClickHandler={this.availableGroupOnClick.bind(this)}
                        assignedClickHandler={this.assignedGroupOnClick.bind(this)}
                        disabled={disabledForm}
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
  }
}

export default injectIntl(UserDetail)
