import React, { Component } from 'react'

import tree from '~core/tree'
import api from '~core/api'

import Loader from '~base/components/spinner'

import {BaseForm, SelectWidget} from '~base/components/base-form'

const schema = {
  type: 'object',
  required: ['organization'],
  properties: {
    organization: {
      type: 'string',
      title: 'Organization'
    }
  }
}

const uiSchema = {
  organization: {'ui:widget': SelectWidget}
}

class SelectOrg extends Component {
  constructor (props) {
    super(props)
    this.state = {
      formData: {
        organization: ''
      },
      apiCallMessage: 'is-hidden',
      apiCallErrorMessage: 'is-hidden'
    }
  }

  errorHandler (e) {}

  changeHandler ({formData}) {
    this.setState({
      ...this.state,
      formData,
      apiCallMessage: 'is-hidden',
      apiCallErrorMessage: 'is-hidden'
    })
  }

  async submitHandler ({formData}) {
    this.setState({loading: true})

    var data
    try {
      data = await api.post('/user/select/organization', formData)
    } catch (e) {
      return this.setState({
        error: e.message,
        loading: false,
        apiCallErrorMessage: 'message is-danger',
        formData: {
          organization: ''
        }
      })
    }
    tree.set('organization', data.organization)
    await tree.commit()

    this.setState({loading: false})
    this.props.history.push('/app', {})
  }

  render () {
    let spinner
    let user = tree.get('user')

    if (this.state.loading) {
      return <Loader />
    }

    schema.properties.organization.enum = user.organizations.map(item => { return item.slug })
    schema.properties.organization.enumNames = user.organizations.map(item => { return item.name })

    return (
      <div className={'LogIn single-form ' + this.props.className}>
        <div className='card'>
          <header className='card-header'>
            <p className='card-header-title'>
              Select Organization to log in
            </p>
            <a className='card-header-icon'>
              <span className='icon'>
                <i className='fa fa-angle-down' />
              </span>
            </a>
          </header>
          <div className='card-content'>
            <div className='content'>
              { spinner }
              <BaseForm schema={schema}
                uiSchema={uiSchema}
                formData={this.state.formData}
                onChange={(e) => { this.changeHandler(e) }}
                onSubmit={(e) => { this.submitHandler(e) }}
                onError={(e) => { this.errorHandler(e) }}>
                <div>
                  <button className='button is-primary is-fullwidth' type='submit'>Go!</button>
                </div>
              </BaseForm>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default SelectOrg
