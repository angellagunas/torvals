import React, { Component } from 'react'
import { branch } from 'baobab-react/higher-order'
import PropTypes from 'baobab-react/prop-types'

import env from '~base/env-variables'
import api from '~base/api'
import PasswordUserForm from './password-form'
import InviteUserForm from './send-invite-form'

var initialState = {
  name: '',
  email: '',
  password_1: '',
  password_2: ''
}

class CreateUserNoModal extends Component {
  constructor (props) {
    super(props)
    this.state = {
      roles: [],
      orgs: [],
      isLoading: ''
    }
    initialState['organization'] = this.props.organization || ''
  }

  componentWillMount () {
    this.cursor = this.context.tree.select(this.props.branchName)
    this.loadRoles()
    this.loadOrgs()
  }

  async load () {
    const body = await api.get(
      '/admin/users',
      {
        start: 0,
        limit: this.cursor.get('pageLength') || 10,
        ...this.props.filters || ''
      }
    )

    this.cursor.set({
      page: 1,
      totalItems: body.total,
      items: body.data,
      pageLength: this.cursor.get('pageLength') || 10
    })
    this.context.tree.commit()
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

  async loadOrgs () {
    var url = '/admin/organizations/'
    const body = await api.get(
      url,
      {
        start: 0,
        limit: 0
      }
    )

    this.setState({
      ...this.state,
      orgs: body.data
    })
  }

  getPasswordForm () {
    return (
      <PasswordUserForm
        baseUrl='/admin/users'
        url={this.props.url}
        initialState={initialState}
        load={this.load.bind(this)}
        roles={this.state.roles || []}
        orgs={this.state.orgs || []}
        filters={this.props.filters}
        finishUp={(data) => this.finishUpHandler(data)}
        submitHandler={(data) => this.submitHandler(data)}
        errorHandler={(data) => this.errorHandler(data)}
      >
        <div className='field is-grouped is-padding-top-small'>
          <div className='control'>
            <button
              className={'button is-primary ' + this.state.isLoading}
              disabled={!!this.state.isLoading}
              type='submit'>
                Crear
              </button>
          </div>
        </div>
      </PasswordUserForm>
    )
  }

  getSendInviteForm () {
    return (
      <InviteUserForm
        baseUrl='/admin/users'
        url={this.props.url}
        initialState={initialState}
        load={this.props.load || this.load.bind(this)}
        roles={this.state.roles || []}
        orgs={this.state.orgs || []}
        filters={this.props.filters}
        finishUp={(data) => this.finishUpHandler(data)}
        submitHandler={(data) => this.submitHandler(data)}
        errorHandler={(data) => this.errorHandler(data)}
      >
        <div className='field is-grouped is-padding-top-small'>
          <div className='control'>
            <button
              className={'button is-primary ' + this.state.isLoading}
              disabled={!!this.state.isLoading}
              type='submit'>
                Invitar
              </button>
          </div>
        </div>
      </InviteUserForm>
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
    var content

    if (this.state.roles.length > 0) {
      initialState.role = this.state.roles.find(item => {
        return item.isDefault === true
      })._id
    }

    if (env.EMAIL_SEND) {
      content = this.getSendInviteForm()
    } else {
      content = this.getPasswordForm()
    }

    return (
        content
    )
  }
}

CreateUserNoModal.contextTypes = {
  tree: PropTypes.baobab
}

const BranchedCreateUser = branch((props, context) => {
  return {
    data: props.branchName
  }
}, CreateUserNoModal)

export default BranchedCreateUser
