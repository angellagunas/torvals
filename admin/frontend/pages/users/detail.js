import React, { Component } from 'react'
import { branch } from 'baobab-react/higher-order'
import PropTypes from 'baobab-react/prop-types'
import api from '~base/api'
import moment from 'moment'
import env from '~base/env-variables'
import FontAwesome from 'react-fontawesome'

import Page from '~base/page'
import {loggedIn} from '~base/middlewares/'
import Loader from '~base/components/spinner'
import UserForm from './form'
import Multiselect from '~base/components/base-multiselect'
import { BaseTable } from '~base/components/base-table'
import Link from '~base/router/link'
import AddOrganization from './add-organization'
import BaseModal from '~base/components/base-modal'

class UserDetail extends Component {
  constructor (props) {
    super(props)
    this.state = {
      loaded: false,
      loading: true,
      resetLoading: false,
      resetText: 'Restablecer Contraseña',
      resetClass: 'button is-danger',
      user: {},
      roles: [],
      groups: [],
      selectedGroups: [],
      saving: false,
      saved: false,
      classNameProjects: '',
      projects: [],
      project: '',
      isLoading: ''
    }
  }

  componentWillMount () {
    this.load()
    this.loadRoles()
    this.loadGroups()
  }

  async load () {
    var url = '/admin/users/' + this.props.match.params.uuid
    const body = await api.get(url)

    await this.setState({
      loading: false,
      loaded: true,
      user: body.data,
      selectedGroups: [...body.data.groups]
    })
  }

  async loadRoles () {
    var url = '/admin/roles/'
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

  async loadGroups () {
    var url = '/admin/groups/'
    const body = await api.get(
      url,
      {
        user_orgs: this.props.match.params.uuid,
        start: 0,
        limit: 0
      }
    )

    this.setState({
      ...this.state,
      groups: body.data
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

  async removeOrgOnClick (org, role) {
    var url = '/admin/users/' + this.props.match.params.uuid + '/remove/organization'
    await api.post(url,
      {
        organization: org,
        role: role
      }
    )
    this.load()
    this.loadGroups()
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

    this.setState({
      selectedGroups: selected
    })

    var url = '/admin/users/' + this.props.match.params.uuid + '/add/group'
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

    var url = '/admin/users/' + this.props.match.params.uuid + '/remove/group'
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
      resetText: 'Enviando email...',
      resetClass: 'button is-info'
    })

    var url = '/user/reset-password'

    try {
      await api.post(url, {email: this.state.user.email})
      setTimeout(() => {
        this.setState({
          resetLoading: true,
          resetText: 'Éxito!',
          resetClass: 'button is-success'
        })
      }, 3000)
    } catch (e) {
      await this.setState({
        resetLoading: true,
        resetText: 'Error!',
        resetClass: 'button is-danger'
      })
    }

    setTimeout(() => {
      this.setState({
        resetLoading: false,
        resetText: 'Restablecer Contraseña',
        resetClass: 'button is-danger'
      })
    }, 10000)
  }

  async roleSelectOnChange (role, organization) {
    var currentRole = this.state.roles.find((item) => {
      return item.uuid === role
    })

    if (currentRole.slug === 'localmanager') {
      await this.loadProjects(organization)
      this.setState({classNameProjects: 'is-active', formProject: { organization: organization, role: role }})
    } else {
      this.setState({
        projects: []
      })
      var url = '/admin/users/' + this.props.match.params.uuid + '/add/role'
      await api.post(url,
        {
          organization: organization,
          role: role
        }
      )
      this.load()
    }
  }

  async loadProjects (organization) {
    var url = '/admin/projects/'
    const body = await api.get(url, {
      start: 0,
      limit: 0,
      organization: organization
    })

    this.setState({
      projects: body.data
    })
  }

  getColumns () {
    return [
      {
        'title': 'Organización',
        'property': 'organization',
        'default': 'N/A',
        formatter: (row) => {
          return (
            <Link to={'/manage/organizations/' + row.organization.uuid}>
              {row.organization.name}
            </Link>
          )
        }
      },
      {
        'title': 'Rol',
        'property': 'role',
        'default': 'N/A',
        formatter: (row) => {
          if (row.defaultProject && row.role.slug === 'localmanager') {
            return (
              <div>
                <div className='select'>
                  <select
                    value={row.role.uuid}
                    onChange={event => {
                      this.roleSelectOnChange(event.target.value, row.organization.uuid)
                    }}>
                    {this.state.roles.map((obj) => {
                      return (
                        <option key={obj.uuid} value={obj.uuid}>
                          {obj.name}
                        </option>
                      )
                    })}
                  </select>
                </div>
                &nbsp;{row.defaultProject.name}
              </div>
            )
          }
          return (
            <div className='select'>
              <select
                value={row.role.uuid}
                onChange={event => {
                  this.roleSelectOnChange(event.target.value, row.organization.uuid)
                }}>
                {this.state.roles.map((obj) => {
                  return (
                    <option key={obj.uuid} value={obj.uuid}>
                      {obj.name}
                    </option>
                  )
                })}
              </select>
            </div>
          )
        }
      },
      {
        'title': 'Acciones',
        formatter: (row) => {
          return <button
            className='button'
            onClick={() => { this.removeOrgOnClick(row.organization.uuid, row.role.uuid) }}
          >
            Eliminar
          </button>
        }
      }
    ]
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

  finishUp (object) {
    window.setTimeout(() => {
      this.setState({
        className: ''
      })
    }, 2000)
  }

  getSavingMessage () {
    let {saving, saved} = this.state

    if (saving) {
      return (
        <p className='card-header-title' style={{fontWeight: '200', color: 'grey'}}>
          Guardando <span style={{paddingLeft: '5px'}}><FontAwesome className='fa-spin' name='spinner' /></span>
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
          Guardado
        </p>
      )
    }
  }

  hideModalProject (e) {
    this.setState({classNameProjects: ''})
  }

  projectSelectOnChange (e) {
    this.setState({project: e})
  }

  async submitHandler (e) {
    if (this.state.project !== '') {
      var url = '/admin/users/' + this.props.match.params.uuid + '/add/role'

      this.state.formProject['project'] = this.state.project
      await api.post(url,
        this.state.formProject
      )
      this.setState({classNameProjects: ''})
      this.load()
    }
  }

  getModalProjects () {
    return (
      <BaseModal
        title='Asignar Proyecto'
        className={this.state.classNameProjects}
        hideModal={(e) => this.hideModalProjects(e)}>

        <div className='field'>
          <label className='label'>Proyecto</label>
          <div className='control'>
            <div className='select'>
              <select
                value={this.state.project}
                onChange={event => { this.projectSelectOnChange(event.target.value) }}>
                <option value={''}>
                  Selecciona un proyecto
                </option>
                {this.state.projects.map((obj) => {
                  return (
                    <option key={obj.uuid} value={obj.uuid}>
                      {obj.name}
                    </option>
                  )
                })}
              </select>
            </div>
          </div>
        </div>

        <div className='field is-grouped'>
          <div className='control'>
            <button className='button is-primary' type='submit' onClick={(e) => { this.submitHandler(e) }}>
              Asignar
            </button>
          </div>
          <div className='control'>
            <button className='button' type='button' onClick={(e) => this.hideModalProject(e)}>
              Cancelar
            </button>
          </div>
        </div>
      </BaseModal>
    )
  }

  submitHandler () {
    this.setState({ isLoading: ' is-loading' })
  }

  errorHandler () {
    this.setState({ isLoading: '' })
  }

  finishUpHandler () {
    this.setState({ isLoading: '' })
  }

  render () {
    const { user } = this.state

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
        <div className='columns'>
          <div className='column has-text-right'>
            <div className='field is-grouped is-grouped-right'>
              <div className='control'>
                <button
                  className={this.state.resetClass}
                  type='button'
                  onClick={() => this.resetOnClick()}
                  disabled={!!this.state.resetLoading}
                  >
                  {this.state.resetText}
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className='columns c-flex-1 is-marginless'>
        <div className='column is-paddingless'>
          <div className='section'>
            {resetButton}
            <div className='columns is-mobile'>
              <div className='column'>
                <div className='card'>
                  <header className='card-header'>
                    <p className='card-header-title'>
                      { user.name }
                    </p>
                  </header>
                  <div className='card-content'>
                    <div className='columns'>
                      <div className='column'>
                        <UserForm
                          baseUrl='/admin/users'
                          url={'/admin/users/' + this.props.match.params.uuid}
                          initialState={this.state.user}
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
                          Organizaciones
                        </p>
                        <div className='card-header-select'>
                          <button className='button is-primary' onClick={() => this.showModal()}>
                            Agregar Organización
                          </button>
                          <AddOrganization
                            className={this.state.className}
                            hideModal={this.hideModal.bind(this)}
                            finishUp={this.finishUp.bind(this)}
                            load={() => { this.load(); this.loadGroups() }}
                            baseUrl='/admin/users'
                            url={'/admin/users/' + this.props.match.params.uuid + '/add/organization'}
                          />
                        </div>
                      </header>
                      <div className='card-content'>
                        <BaseTable
                          columns={this.getColumns()}
                          data={this.state.user.organizations}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className='columns'>
                  <div className='column'>
                    <div className='card'>
                      <header className='card-header'>
                        <p className='card-header-title'>
                          Grupos
                        </p>
                        <div>
                          {this.getSavingMessage()}
                        </div>
                      </header>
                      <div className='card-content'>
                        <Multiselect
                          availableTitle='Disponible'
                          assignedTitle='Asignado'
                          assignedList={this.state.selectedGroups}
                          availableList={availableList}
                          dataFormatter={(item) => { return item.name + ' de ' + item.organization.name || 'N/A' }}
                          availableClickHandler={this.availableGroupOnClick.bind(this)}
                          assignedClickHandler={this.assignedGroupOnClick.bind(this)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {this.getModalProjects()}
      </div>
    )
  }
}

UserDetail.contextTypes = {
  tree: PropTypes.baobab
}

const branchedUserDetail = branch({}, UserDetail)

export default Page({
  path: '/manage/users/:uuid',
  title: 'Detalle de usuario',
  exact: true,
  validate: loggedIn,
  component: branchedUserDetail
})
