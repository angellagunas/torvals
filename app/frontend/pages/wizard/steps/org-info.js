import React, { Component } from 'react'
import OrganizationForm from '../../organizations/form'
import Editable from '~base/components/base-editable'
import api from '~base/api'

class OrgInfo extends Component {
  constructor (props) {
    super(props)
    this.state = {
      isLoading: '',
      org: this.props.org
    }
  }
  submitHandler () {
    this.setState({ isLoading: ' is-loading' })
  }

  errorHandler () {
    this.setState({ isLoading: '' })
  }

  finishUpHandler (data) {
    this.setState({ isLoading: '' })
    console.log('handlre', data)
    this.props.nextStep()
  }

  async load () {
    var url = '/app/organizations/' + this.state.org.uuid
    try {
      const body = await api.get(url)
      this.setState({
        org: body.data
      })
    } catch (e) {
      await this.setState({
        notFound: true
      })
    }
  }

  render () {
    return (
      <div className='section pos-rel'>

        {this.state.org &&
        <div className='columns'>
          <div className='column'>
            <h1 className='title is-4'> Bienvenido al asistente de configuración de Orax. </h1>
            <h2 className='subtitle'> Primero revisa los datos de tu organización.
            Cuando todo esté correcto da click en guardar y después en continuar.
          </h2>
            <OrganizationForm
              baseUrl='/app/organizations'
              url={'/app/organizations/' + this.state.org.uuid}
              initialState={this.state.org}
              submitHandler={(data) => this.submitHandler(data)}
              errorHandler={(data) => this.errorHandler(data)}
              finishUp={(data) => this.finishUpHandler(data)}
              load={() => { this.load() }}
             />
          </div>
        </div>

        }

      </div>
    )
  }
}

export default OrgInfo
