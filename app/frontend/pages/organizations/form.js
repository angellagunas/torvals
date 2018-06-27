import React, { Component } from 'react'

import api from '~base/api'

import {
  BaseForm,
  TextWidget,
  TextareaWidget,
  FileWidget
} from '~base/components/base-form'
import { shouldRender } from '~base/components/base-form/utils'

const schema = {
  type: 'object',
  title: '',
  required: [
    'name', 'slug'
  ],
  properties: {
    name: {type: 'string', title: 'Nombre'},
    description: {type: 'string', title: 'Descripción'},
    slug: {type: 'string', title: 'Subdominio'},
    profile: {type: 'string', title: 'Logo', format: 'data-url'}
  }
}

const uiSchema = {
  'ui:field': 'custom',
  /*name: {'ui:widget': TextWidget},
  description: {'ui:widget': TextareaWidget, 'ui:rows': 3},
  slug: {'ui:widget': TextWidget, 'ui:disabled': true},
  profile: {'ui:widget': FileWidget}*/
}

class CustomForm extends Component {
  constructor(props) {
    super(props)
    this.state = {
      name: '',
      description: '',
      slug: '',
      profile: '',
      ...props.formData
    }
  }

  onChange(name) {
    return value => {
      this.setState({ [name]: value })
      setImmediate(() => this.props.onChange(this.state))
    }
  }

  render() {
    const { name, slug, description, profile, profileUrl } = this.state
    const profileImg = profile || profileUrl

    return (
      <div className="columns is-multiline test">

        <div className='column is-12'>
          <p className='subtitle is-pulled-left'>
            <strong>Detalle de tu organización</strong>
          </p>
          <div className="is-pulled-right">
            {this.props.children}
          </div>
        </div>

        <div className='column is-one-third'>
          <div className='card'>
            <div className='card-content'>
              <div className='columns'>
                <div className='column'>

                  <center>
                    {
                      profileImg && <div
                        style={{
                          width: '170px',
                          height: '170px',
                          backgroundImage: `url('${profileImg}')`,
                          backgroundSize: 'cover',
                          display: 'block',
                          borderRadius: '100px'
                        }}
                      />
                    }
                    <div className="form-group field">
                      <br />
                      <label className="label">
                        Sube tu foto de organización
                      </label>
                      <br />
                      <FileWidget
                        value={profile}
                        onChange={this.onChange('profile')}
                        style={{ justifyContent: 'center' }}
                      />
                    </div>
                  </center>

                </div>
              </div>
            </div>
          </div>
        </div>

        <div className='column'>
          <div className='card'>
            <div className='card-content'>
              <div className='columns'>
                <div className='column'>

                  <div className="form-group field">
                    <label className="label">Nombre*</label>
                    <div className="control">
                      <TextWidget
                        required
                        type='text'
                        className='input'
                        value={name}
                        onChange={this.onChange('name')}
                      />
                    </div>
                  </div>
                  <div className="form-group field">
                    <label className="label">Descripción</label>
                    <div className="control">
                      <TextareaWidget
                        options={{ rows: 4 }}
                        type='text'
                        className='input'
                        value={description}
                        onChange={this.onChange('description')}
                      />
                    </div>
                  </div>
                  <div className="form-group field">
                    <label className="label">Subdominio*</label>
                    <div className="control">
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

  shouldComponentUpdate(nextProps, nextState) {
    return !shouldRender(this, nextProps, nextState)
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
        ...this.state,
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
          fields={{
            custom: props => (
              <CustomForm {...props}>
                {this.props.children}
              </CustomForm>
            )
          }}
        >
          <div className={this.state.apiCallMessage}>
            <div className='message-body is-size-7 has-text-centered'>
              Los datos se han guardado correctamente
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
