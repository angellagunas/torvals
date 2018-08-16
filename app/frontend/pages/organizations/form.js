import React, { Component } from 'react'
import { FormattedMessage } from 'react-intl'
import api from '~base/api'

import {
  BaseForm,
  TextWidget,
  TextareaWidget,
  FileWidget
} from '~base/components/base-form'

const schema = {
  type: 'object',
  title: '',
  required: [
    'name', 'slug'
  ],
  properties: { // TODO: translate
    name: {type: 'string', title: 'Nombre'},
    description: {type: 'string', title: 'Descripción'},
    slug: {type: 'string', title: 'Subdominio'},
    profile: {type: 'string', title: 'Logo', format: 'data-url'}
  }
}

const uiSchema = {
  'ui:field': 'custom'
}

class CustomForm extends Component {
  constructor (props) {
    super(props)
    this.state = {
      name: '',
      description: '',
      slug: '',
      profile: '',
      ...props.formData
    }
  }

  onChange (name) {
    return value => {
      this.setState({ [name]: value })
      setImmediate(() => this.props.onChange(this.state))
    }
  }

  render () {
    const { name, slug, description, profile, profileUrl } = this.state
    const profileImg = profile || profileUrl

    return (
      <div className='columns is-multiline'>

        <div className='column is-12'>
          <p className='subtitle is-pulled-left'>
            <strong>
              <FormattedMessage
                id='organizations.formTitle'
                defaultMessage={`Detalle de tu organización`}
              />
            </strong>
          </p>
          <div className='is-pulled-right'>
            <button
              className={'button is-primary org-button-save ' + this.state.isLoading}
              disabled={!!this.state.isLoading}
              type='submit'
            >
              <FormattedMessage
                id='organizations.btnSave'
                defaultMessage={`Guardar`}
              />
            </button>
            <button
              className={'button is-primary org-button is-hidden ' + this.state.isLoading}
              disabled={!!this.state.isLoading}
              type='submit'
            >
              <FormattedMessage
                id='organizations.btnContinue'
                defaultMessage={`Continuar`}
              />
            </button>
            <button
              className={'button is-primary org-button is-hidden ' + this.state.isLoading}
              disabled={!!this.state.isLoading}
              type='submit'>
              Continuar
            </button>
          </div>
        </div>

        <div className='column is-narrow'>
          <div className='card org-card'>
            <div className='card-image'>
              <figure className='image is-1by1'>
                <img src={profileImg} className='org-img' />
              </figure>
            </div>
            <div className='card-content'>
              <div className='form-group field has-text-centered'>
                <label className='label'>
                  <FormattedMessage
                    id='organizations.logoUploadMsg'
                    defaultMessage={`Sube el logo de la organización`}
                  />
                </label>
                <FileWidget
                  value={profile}
                  onChange={this.onChange('profile')}
                  style={{ justifyContent: 'center' }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className='column'>
          <div className='card'>
            <div className='card-content'>
              <div className='columns'>
                <div className='column'>

                  <div className='form-group field'>
                    <label className='label'>
                      <FormattedMessage
                        id='organizations.name'
                        defaultMessage={`Nombre`}
                      />*
                    </label>
                    <div className='control'>
                      <TextWidget
                        required
                        type='text'
                        className='input'
                        value={name}
                        onChange={this.onChange('name')}
                      />
                    </div>
                  </div>
                  <div className='form-group field'>
                    <label className='label'>
                      <FormattedMessage
                        id='organizations.description'
                        defaultMessage={`Descripción`}
                      />
                    </label>
                    <div className='control'>
                      <TextareaWidget
                        options={{ rows: 4 }}
                        type='text'
                        className='input'
                        maxLength='140'
                        value={description}
                        onChange={this.onChange('description')}
                      />
                    </div>
                    <p className='help-block has-text-grey is-size-7'>
                      <FormattedMessage
                        id='organizations.maxMsg'
                        defaultMessage={`Máximo 140 caracteres`}
                      />
                    </p>
                  </div>
                  <div className='form-group field'>
                    <label className='label'>
                      <FormattedMessage
                        id='organizations.subdomain'
                        defaultMessage={`Subdominio`}
                      />*
                    </label>
                    <div className='control'>
                      <TextWidget
                        required
                        disabled
                        type='text'
                        className='input'
                        value={slug}
                        onChange={this.onChange('slug')}
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

class OrganizationForm extends Component {
  constructor (props) {
    super(props)
    this.state = {
      initialState: this.props.initialState,
      formData: this.props.initialState,
      apiCallMessage: 'is-hidden',
      apiCallErrorMessage: 'is-hidden'
    }
  }

  errorHandler (e) {}

  changeHandler ({formData}) {
    this.setState({
      formData,
      apiCallMessage: 'is-hidden',
      apiCallErrorMessage: 'is-hidden'
    })
  }

  clearState () {
    this.setState({
      apiCallMessage: 'is-hidden',
      apiCallErrorMessage: 'is-hidden',
      formData: this.props.initialState
    })
  }

  async submitHandler ({formData}) {
    if (formData.slug !== this.state.initialState.slug && !this.state.confirmed) {
      return this.setState({
        ...this.state, // TODO: translate
        error: 'Si modificas el slug, se cerrará la sesión de todos los usuarios que hayan iniciado sesión en esta organización. Si REALMENTE desea continuar, haga clic en guardar de nuevo',
        apiCallErrorMessage: 'message is-danger',
        confirmed: true
      })
    }

    if (this.props.submitHandler) this.props.submitHandler(formData)
    try {
      var data = await api.post(this.props.url, formData)
      await this.props.load()
      this.clearState()
      this.setState({...this.state, apiCallMessage: 'message is-success'})
      if (this.props.finishUp) this.props.finishUp(data.data)
      return
    } catch (e) {
      if (this.props.errorHandler) this.props.errorHandler(e)
      return this.setState({
        ...this.state,
        error: e.message,
        apiCallErrorMessage: 'message is-danger'
      })
    }
  }

  render () {
    var error
    if (this.state.error) {
      error = <div>
        Error: {this.state.error}
      </div>
    }

    return (
      <div>
        <BaseForm schema={schema}
          uiSchema={uiSchema}
          formData={this.state.formData}
          onChange={(e) => { this.changeHandler(e) }}
          onSubmit={(e) => { this.submitHandler(e) }}
          onError={(e) => { this.errorHandler(e) }}
          fields={{ custom: CustomForm }}
        >
          <div className={this.state.apiCallMessage}>
            <div className='message-body is-size-7 has-text-centered'>
              <FormattedMessage
                id='organizations.savedMsg'
                defaultMessage={`Los datos se han guardado correctamente`}
              />
            </div>
          </div>

          <div className={this.state.apiCallErrorMessage}>
            <div className='message-body is-size-7 has-text-centered'>
              {error}
            </div>
          </div>
        </BaseForm>
      </div>
    )
  }
}

export default OrganizationForm
