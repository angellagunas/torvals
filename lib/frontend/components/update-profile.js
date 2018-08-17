import React, { Component } from 'react'
import api from '~base/api'
import tree from '~core/tree'

import {BaseForm, CheckboxWidget, SelectWidget, EmailWidget, TextWidget, FileWidget} from '~base/components/base-form'
import { injectIntl } from 'react-intl'


const uiSchema = {
  name: {'ui:widget': TextWidget},
  email: {'ui:widget': EmailWidget},
  job: {'ui:widget': TextWidget},
  phone: {'ui:widget': TextWidget},
  language: {'ui:widget': SelectWidget},
  isVerified: {'ui:widget': CheckboxWidget, 'ui:disabled': true},
  profile: {'ui:widget': FileWidget}
}

class UpdateProfileForm extends Component {
  constructor (props) {
    super(props)

    let user

    if (tree.get('user')) {
      user = tree.get('user')
    }

    this.state = {
      apiCallMessage: 'is-hidden',
      apiCallErrorMessage: 'is-hidden',
      formData: {
        email: user.email,
        name: user.name,
        language: user.language,
        job: user.job,
        phone: user.phone
      },
      accountOwner: user.currentOrganization.accountOwner,
      user,      
      isLoading: '',
      languages: {}
    }
  }

  formatTitle(id) {
    return this.props.intl.formatMessage({ id: id })
  }

  errorHandler (e) {
    this.setState({ isLoading: '' })
  }

  finishUpHandler () {
    this.setState({ isLoading: '' })
  }

  changeHandler ({formData}) {
    this.setState({formData, apiCallMessage: 'is-hidden', apiCallErrorMessage: 'is-hidden'})
  }

  async submitHandler ({formData}) {
    var data
    this.setState({ isLoading: ' is-loading' })
    try {
      data = await api.post('/user/me/update', formData)
      localStorage.setItem('lang', `${data.user.language.code}`)
      this.finishUpHandler()
    } catch (e) {
      this.errorHandler(e)
      return this.setState({
        error: e.message,
        apiCallErrorMessage: 'message is-danger'
      })
    }

    this.setState({apiCallMessage: 'message is-success'})
    const cursor = tree.select('user')
    cursor.set('profileUrl', data.user.profileUrl)
    cursor.set('name', data.user.name)
    tree.commit()
  }

  async componentWillMount () {
    const languages = await this.selectAllLanguages()
  }

  async selectAllLanguages () {
    const languages = await api.get('/app/languages/')
    let result = {}
    for (let language of languages.data) {
      result[language.uuid] = language.name
    }
    this.setState({
      languages: result
    })
  }

  render () {
    var error
    if (this.state.error) {
      error = <div>
        Error: {this.state.error}
      </div>
    }
    const schema = {
      type: 'object',
      required: ['name', 'email'],
      properties: {
        name: {type: 'string', title: 'Nombre'},
        email: {type: 'string', title: 'Email'},
        job: {type: 'string', title: 'Puesto'},
        phone: {type: 'string', title: 'Teléfono'},
        language: {
          type: 'string',
          title: 'Lenguaje',
          enum: Object.keys(this.state.languages),
          enumNames: Object.values(this.state.languages)
        },
        profile: {type: 'string', title: 'Foto', format: 'data-url'}
      }
    }

    return (
      <div className='is-fullwidth'>
        {this.state.accountOwner.uuid === this.state.user.uuid &&
          <div className='accountOwner'>
            <strong>Propietario de la organización</strong>
          </div>
        }
        {this.state.user.isVerified &&
          <div className='accountOwner'>
            <strong>Cuenta verificada</strong>
          </div>
        }
        <BaseForm schema={schema}
          uiSchema={uiSchema}
          formData={this.state.formData}
          onChange={(e) => { this.changeHandler(e) }}
          onSubmit={(e) => { this.submitHandler(e) }}
          onError={(e) => { this.errorHandler(e) }}
          className='is-fullwidth'>
          
          <div className={this.state.apiCallMessage}>
            <div className='message-body is-size-7 has-text-centered'>Tus datos se han modificado correctamente</div>
          </div>

          <div className={this.state.apiCallErrorMessage}>
            <div className='message-body is-size-7 has-text-centered'>{error}</div>
          </div>

          <div className='has-text-right'>
            <button
              className={'button is-primary ' + this.state.isLoading}
              disabled={!!this.state.isLoading}
              type='submit'
            >
              Guardar
            </button>
          </div>
        </BaseForm>
      </div>
    )
  }
}

export default UpdateProfileForm
