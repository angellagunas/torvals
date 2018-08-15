import React, { Component } from 'react'
import { FormattedMessage, injectIntl } from 'react-intl'
import api from '~base/api'
import { BaseForm, FileWidget } from '~base/components/base-form'

class ImportCSV extends Component {
  constructor (props) {
    super(props)

    this.extraData = {}
    if (this.props.extraFields) {
      this.extraData = this.props.extraFields.formData
    }

    this.state = {
      apiCallMessage: 'is-hidden',
      apiCallErrorMessage: 'is-hidden',
      isLoading: '',
      message: '',
      formData: {
        file: undefined,
        type: this.props.type,
        ...this.extraData
      }
    }
  }

  errorHandler () {
    this.setState({ isLoading: '' })
  }

  changeHandler ({ formData }) {
    this.setState({ formData, apiCallMessage: 'is-hidden', apiCallErrorMessage: 'is-hidden' })
  }

  async submitHandler ({ formData }) {
    this.setState({ isLoading: ' is-loading' })
    var data
    try {
      data = await api.post(this.props.url, formData)
    } catch (e) {
      return this.setState({
        error: e.message,
        apiCallErrorMessage: 'message is-danger'
      })
    }
    this.setState({ apiCallMessage: 'message is-success', message: data.message, isLoading: '' })
    if (this.props.finishUp) {
      setTimeout(() => {
        this.setState({
          apiCallMessage: 'is-hidden',
          apiCallErrorMessage: 'is-hidden',
          message: '',
          formData: {
            file: undefined,
            type: this.props.type,
            ...this.extraData
          }
        })
        this.props.finishUp()
      }, 3000)
    }
  }

  formatTitle(id) {
    return this.props.intl.formatMessage({ id: id })
  }

  render () {
    let schema = {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', title: this.formatTitle('import.importMsg'), format: 'data-url' }
      }
    }

    let uiSchema = {
      file: {
        'ui:widget': FileWidget,
        'ui:className': 'is-centered is-medium is-info',
        'ui:accept': '.csv',
        'ui:hidden': true
      }
    }

    var error
    if (this.state.error) {
      error = <div>
        {this.state.error}
      </div>
    }

    if (this.props.extraFields) {
      schema.properties = {...schema.properties, ...this.props.extraFields.schema.properties}
      uiSchema = {...uiSchema, ...this.props.extraFields.uiSchema}
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
                    <div className='message-body is-size-7 has-text-centered'>
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
                      className={'button is-primary ' + this.state.isLoading}
                      disabled={!!this.state.isLoading}
                      type='submit'
                    >
                      <FormattedMessage
                        id='import.btnImport'
                        defaultMessage={`Importar`}
                      />
                    </button>
                  </div>
                </BaseForm>
              </div>
              <div className='column'>
                <h4>
                  <FormattedMessage
                    id='import.info'
                    defaultMessage={`El archivo .csv debe contener el mismo formato que el mostrado debajo: `}
                  />
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
          <h2>
            <FormattedMessage
              id='import.title'
              defaultMessage={`Cargar`}
            /> {this.props.title}
          </h2>
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
                      <div className='message-body is-size-7 has-text-centered'>
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
                        className={'button is-primary ' + this.state.isLoading}
                        disabled={!!this.state.isLoading}
                        type='submit'
                      >
                        <FormattedMessage
                          id='import.btnImport'
                          defaultMessage={`Importar`}
                        />
                      </button>
                    </div>
                  </BaseForm>
                </div>
                <div className='column'>
                  <h4>
                    <FormattedMessage
                      id='import.info'
                      defaultMessage={`El archivo .csv debe contener el mismo formato que el mostrado debajo: `}
                    />
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

export default injectIntl(ImportCSV)
