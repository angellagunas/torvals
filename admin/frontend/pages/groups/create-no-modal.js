import React, { Component } from 'react'
import { branch } from 'baobab-react/higher-order'
import PropTypes from 'baobab-react/prop-types'
import api from '~base/api'
import GroupForm from './form'

var initialState = {
  name: '',
  description: ''
}

class CreateGroupNoModal extends Component {
  constructor (props) {
    super(props)
    this.state = {
      orgs: [],
      isLoading: ''
    }
  }

  componentWillMount () {
    this.cursor = this.context.tree.select(this.props.branchName)
    this.loadOrgs()
  }

  async load () {
    const body = await api.get(
      '/admin/groups',
      {
        start: 0,
        limit: this.cursor.get('pageLength') || 10
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
    return (
      <GroupForm
        baseUrl='/admin/groups'
        url={this.props.url}
        finishUp={(data) => this.finishUpHandler(data)}
        initialState={initialState}
        load={this.load.bind(this)}
        organizations={this.state.orgs || []}
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
      </GroupForm>
    )
  }
}

CreateGroupNoModal.contextTypes = {
  tree: PropTypes.baobab
}

const BranchedCreateGroup = branch((props, context) => {
  return {
    data: props.branchName
  }
}, CreateGroupNoModal)

export default BranchedCreateGroup
