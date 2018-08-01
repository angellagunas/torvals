import React, { Component } from 'react'
import tree from '~core/tree'
import api from '~base/api'
import BaseModal from '~base/components/base-modal'
import {BaseForm, TextWidget, SelectWidget} from '~base/components/base-form'
import BaseDeleteButton from '~base/components/base-deleteButton'
import { setTimeout } from 'timers';
import Loader from '~base/components/spinner'

const schema = {
  type: 'object',
  title: '',
  required: [
    'name',
    'organization'
  ],
  properties: {
    name: {
      type: 'string',
      title: 'Nombre'
    },
    organization: {
      type: 'string',
      title: 'Organización',
      enum: [],
      enumNames: []
    }
  }
}

const uiSchema = {
  name: {'ui:widget': TextWidget},
  organization: {'ui:widget': SelectWidget},
}

var initialState = {
  name: ''
}

class TokensList extends Component {
  constructor(props) {
    super(props)
    this.state = {
      tokens: [],
      className: '',
      formData: initialState,
      organizations: [],
      apiCallMessage: 'is-hidden',
      apiCallErrorMessage: 'is-hidden',
      notificationClass: 'is-hidden'
    }
  }

  componentWillMount() {
    this.getTokens()
    this.getOrganizations()
  }

  async getTokens() {
    let data
    try {
      data = await api.get('/user/tokens')
    } catch (e) {
      return this.setState({
        error: e.message,
        apiCallErrorMessage: 'message is-danger'
      })
    }
    this.setState({
      tokens: data.tokens
    })
  }

  async removeToken(item) {
    let data
    try {
      data = await api.del('/user/tokens/' + item.uuid)
      let index = this.state.tokens.indexOf(item);
      let aux = this.state.tokens;
      aux.splice(index,1);
      this.setState({
        tokens: aux
      })
    } catch (e) {
      return this.setState({
        error: e.message,
        apiCallErrorMessage: 'message is-danger'
      })
    }
  }

  async createToken(item) {
    let data
    try {
      data = await api.post('/user/tokens', item)
      this.setState({
        tokens: this.state.tokens.concat(data.token),
        notificationClass: ''
      })
      this.clearState()
      this.setState({...this.state, apiCallMessage: 'message is-success'})
      setTimeout(()=>{
        this.clearState()
        this.hideModal()
      },1500)
    } catch (e) {
      return this.setState({
        ...this.state,
        error: e.message,
        apiCallErrorMessage: 'message is-danger'
      })
    }
  }

  async getOrganizations() {
    try {
      const { data=[] } = await api.get('/admin/organizations/', { start: 0, limit: 0 })

      let org = schema.properties.organization
      org.enum = data.map(item => item.uuid)
      org.enumNames = data.map(item => item.name)

      this.setState({
        organizations: data
      })
    } catch (error) {
      this.setState({
        error: e.message,
        apiCallErrorMessage: 'message is-danger'
      })
    }
  }

  showModal = () => {
    this.setState({
      className: ' is-active'
    })
  }

  hideModal = () => {
    this.setState({
      className: ''
    })
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
      formData: initialState
    })
  }

  showNotification(){
    this.setState({
      notificationClass: ''
    })
  }

  hideNotification(){
    this.setState({
      notificationClass: 'is-hidden'
    })
  }

  render() {
    let error
    if (this.state.error) {
      error = <div>
        Error: {this.state.error}
      </div>
    }
    if (this.state.organizations.length === 0) {
      return <Loader />
    }

    return (
      <div className='panel is-bg-white'>
        <p className='panel-heading'>
          Api Tokens <a className="button is-primary is-pulled-right is-small" onClick={() => this.showModal()}>Nuevo Token</a>
        </p>

        <div className='content'>
        <div className={"notification is-primary is-size-6 " + this.state.notificationClass }>
          <button className="delete" onClick={() => this.hideNotification()}></button>
          ¡Guarda el secreto en un lugar seguro!
        </div>
          {this.state.tokens.map((item, index) => (

            <div className="panel-block panel-body is-relative" key={index}>
              <div className="media">
                <div>
                  <p className="subtitle is-6"><strong>Nombre:</strong> {item.name}</p>
                  {item.secret ? <p className="subtitle is-6 secret"><strong>Secreto:</strong> {item.secret} </p> : null}
                  <p className="subtitle is-6"><strong>Organización:</strong> {(item.organization || {}).name}</p>
                  <p className="subtitle is-6"><strong>Llave:</strong> {item.key} </p>
                  <p className="subtitle is-6"><strong>Último uso:</strong> {item.lastUse ? item.lastUse : "N/A"}</p>
                </div>

                <div className="is-bottom">
                <BaseDeleteButton
                   objectDelete={() => { this.removeToken(item) }}
                   titleButton="Revocar"
                   objectName={item.name}
                   message="¿Está seguro de que desea revocar este token?"
                   history={this.props.history}
                />
                </div>
              </div>
            </div>
          ))}
        </div>
        <BaseModal
          title='Crear Token'
          className={this.state.className}
          hideModal={this.hideModal}
        >
          <BaseForm schema={schema}
            uiSchema={uiSchema}
            formData={this.state.formData}
            onChange={(e) => { this.changeHandler(e) }}
            onSubmit={(e) => { this.createToken(e.formData) }}
            onError={(e) => { this.errorHandler(e) }}
          >
            <div className={this.state.apiCallMessage}>
              <div className='message-body is-size-7 has-text-centered'>
                Token generado correctamente
              </div>
            </div>

            <div className={this.state.apiCallErrorMessage}>
              <div className='message-body is-size-7 has-text-centered'>
                {error}
              </div>
            </div>
            <div className='field is-grouped'>
              <div className='control'>
                <button className='button is-primary' type='submit'>Crear</button>
              </div>
              <div className='control'>
                <button className='button' type='button' onClick={this.hideModal}>Cancelar</button>
              </div>
            </div>
          </BaseForm>
        </BaseModal>
      </div>
    )
  }
}

export default TokensList