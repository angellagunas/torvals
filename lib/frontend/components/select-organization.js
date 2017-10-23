import React, { Component } from 'react'

import tree from '~core/tree'
import env from '~base/env-variables'

import {BaseForm, SelectWidget} from '~base/components/base-form'

const schema = {
  type: 'object',
  required: ['organization'],
  properties: {
    organization: {
      type: 'string',
      title: 'Organización'
    }
  }
}

const uiSchema = {
  organization: {'ui:widget': SelectWidget}
}

class SelectOrganizationForm extends Component {
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

    tree.set('shouldSelectOrg', false)
    await tree.commit()

    var data = env.APP_HOST.split('://')
    alert(data[0] + '://' + formData.organization + '.' + data[1])
    window.location = data[0] + '://' + formData.organization + '.' + data[1]
  }

  render () {
    let user = tree.get('user')

    schema.properties.organization.enum = user.organizations.map(item => { return item.slug })
    schema.properties.organization.enumNames = user.organizations.map(item => { return item.name })

    return (
      <BaseForm schema={schema}
        uiSchema={uiSchema}
        formData={this.state.formData}
        onChange={(e) => { this.changeHandler(e) }}
        onSubmit={(e) => { this.submitHandler(e) }}
        onError={(e) => { this.errorHandler(e) }}>
        <div>
          <button className='button is-primary is-fullwidth' type='submit'>Ir!</button>
        </div>
      </BaseForm>
    )
  }
}

export default SelectOrganizationForm
