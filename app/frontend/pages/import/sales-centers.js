import React, { Component } from 'react'
import api from '~base/api'

import Page from '~base/page'
import {loggedIn, verifyRole} from '~base/middlewares/'

import {BaseForm, FileWidget} from '~base/components/base-form'

const schema = {
  type: 'object',
  required: ['file'],
  properties: {
    file: {type: 'string', title: 'Archivo a importar', format: 'data-url'}
  }
}

const uiSchema = {
  file: {
    'ui:widget': FileWidget,
    'ui:className': 'is-centered',
    'ui:accept': '.csv'
  }
}

class ImportSalesCenter extends Component {
  constructor (props) {
    super(props)

    this.state = {
      apiCallMessage: 'is-hidden',
      apiCallErrorMessage: 'is-hidden',
      message: '',
      formData: {
        file: undefined
      }
    }
  }

  errorHandler (e) {}

  changeHandler ({formData}) {
    this.setState({formData, apiCallMessage: 'is-hidden', apiCallErrorMessage: 'is-hidden'})
  }

  async submitHandler ({formData}) {
    var data
    try {
      data = await api.post('/app/salesCenters/import/', formData)
    } catch (e) {
      return this.setState({
        error: e.message,
        apiCallErrorMessage: 'message is-danger'
      })
    }

    this.setState({apiCallMessage: 'message is-success', message: data.message})
  }

  render () {
    var error
    if (this.state.error) {
      error = <div>
        {this.state.error}
      </div>
    }

    return (
      <div className='columns c-flex-1 is-marginless'>
        <div className='column is-paddingless'>
          <div className='section is-paddingless-top'>
            <h1
              className='is-size-3 is-padding-top-small is-padding-bottom-small'
            >
              Cargar centros de venta
            </h1>
            <div className='card'>
              <div className='card-content'>
                <div className='columns'>
                  <div className='column'>
                    <BaseForm schema={schema}
                      uiSchema={uiSchema}
                      formData={this.state.formData}
                      onChange={(e) => { this.changeHandler(e) }}
                      onSubmit={(e) => { this.submitHandler(e) }}
                      onError={(e) => { this.errorHandler(e) }}
                      className='has-text-centered'
                    >
                      <div className={this.state.apiCallMessage}>
                        <div
                          className='message-body is-size-7 has-text-centered'
                        >
                          {this.state.message}
                        </div>
                      </div>
                      <div className={this.state.apiCallErrorMessage}>
                        <div
                          className='message-body is-size-7 has-text-centered'
                        >
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
                    <pre style={{marginTop: '1em'}}>
                      "name","description","externalId"<br />
                      "Centro","Ventas","12888"
                    </pre>
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

export default Page({
  path: '/import/salesCenters',
  title: 'Centros de venta ',
  icon: 'credit-card-alt',
  exact: true,
  validate: [loggedIn, verifyRole],
  roles: 'orgadmin',
  component: ImportSalesCenter
})
