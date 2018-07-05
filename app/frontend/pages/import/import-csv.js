import React, { Component } from 'react'
import api from '~base/api'
import { BaseForm, FileWidget } from '~base/components/base-form'

const schema = {
  type: 'object',
  required: ['file'],
  properties: {
    file: { type: 'string', title: 'Archivo a importar', format: 'data-url' }
  }
}

const uiSchema = {
  file: {
    'ui:widget': FileWidget,
    'ui:className': 'is-centered is-medium is-info',
    'ui:accept': '.csv',
    'ui:hidden': true
  }
}

class ImportCSV extends Component {
  constructor (props) {
    super(props)

    this.state = {
      apiCallMessage: 'is-hidden',
      apiCallErrorMessage: 'is-hidden',
      message: '',
      formData: {
        file: undefined,
        type: this.props.type
      }
    }
  }

  errorHandler (e) { }

  changeHandler ({ formData }) {
    this.setState({ formData, apiCallMessage: 'is-hidden', apiCallErrorMessage: 'is-hidden' })
  }

  async submitHandler ({ formData }) {
    var data
    try {
      data = await api.post(this.props.url, formData)
    } catch (e) {
      return this.setState({
        error: e.message,
        apiCallErrorMessage: 'message is-danger'
      })
    }
    this.setState({ apiCallMessage: 'message is-success', message: data.message })
    if (this.props.finishUp) {
      setTimeout(() => {
        this.setState({
          apiCallMessage: 'is-hidden',
          apiCallErrorMessage: 'is-hidden',
          message: '',
          formData: {
            file: undefined,
            type: this.props.type
          }
        })
        this.props.finishUp()
      }, 3000)
    }
  }

  render () {
    var error
    if (this.state.error) {
      error = <div>
        {this.state.error}
      </div>
    }

    if (this.props.isModal) {
      return (
        <div className='importcsv'>
          <div className='section is-paddingless-top'>

            <div className='columns'>
              <div className='column is-6'>
                <BaseForm schema={schema}
                  uiSchema={uiSchema}
                  formData={this.state.formData}
                  onChange={(e) => { this.changeHandler(e) }}
                  onSubmit={(e) => { this.submitHandler(e) }}
                  onError={(e) => { this.errorHandler(e) }}
                  className='has-text-centered is-primary'
                    >
                  <div className={this.state.apiCallMessage}>
                    <div
                      className='message-body is-size-7 has-text-centered'
                        >
                      {this.state.message}
                    </div>
                  </div>
                  <div className={this.state.apiCallErrorMessage}>
                    <div className='message-body is-size-7 has-text-centered'>
                      {error}
                    </div>
                  </div>
                  <div>
                    <button
                      className='button is-primary'
                      type='submit'>
                      Importar
                    </button>
                  </div>
                </BaseForm>
              </div>
              <div className='column'>
                <h4>
                  El archivo <strong>.csv</strong> debe contener el mismo formato que el mostrado debajo:
                </h4>
                {this.props.format}
              </div>
            </div>
          </div>
        </div>

      )
    }

    return (
      <div className='importcsv'>
        <div className='section-header'>
          <h2>Cargar {this.props.title}</h2>
        </div>
        <div className='section is-paddingless-top'>
          <div className='card'>
            <div className='card-content'>
              <div className='columns'>
                <div className='column is-5'>
                  <BaseForm schema={schema}
                    uiSchema={uiSchema}
                    formData={this.state.formData}
                    onChange={(e) => { this.changeHandler(e) }}
                    onSubmit={(e) => { this.submitHandler(e) }}
                    onError={(e) => { this.errorHandler(e) }}
                    className='has-text-centered is-primary'
                    >
                    <div className={this.state.apiCallMessage}>
                      <div
                        className='message-body is-size-7 has-text-centered'
                        >
                        {this.state.message}
                      </div>
                    </div>
                    <div className={this.state.apiCallErrorMessage}>
                      <div className='message-body is-size-7 has-text-centered'>
                        {error}
                      </div>
                    </div>
                    <div>
                      <button
                        className='button is-primary'
                        type='submit'
                          >
                            Importar
                        </button>
                    </div>
                  </BaseForm>
                </div>
                <div className='column'>
                  <h4>
                      El archivo <strong>.csv</strong> debe contener el mismo formato que el mostrado debajo:
                      </h4>
                  {this.props.format}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    )
  }
}

export default ImportCSV
