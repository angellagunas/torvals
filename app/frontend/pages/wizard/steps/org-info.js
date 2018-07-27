import React, { Component } from 'react'
import { FormattedMessage } from 'react-intl'
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

  finishUpHandler () {
    this.setState({ isLoading: '' })
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
      <div className='section'>

        {this.state.org &&
        <div className='columns'>
          <div className='column is-6'>
            <h1 className='title is-4'>
              <FormattedMessage
                id="wizard.orgWelcome"
                defaultMessage={`Bienvenido al asistente de configuración de Orax.`}
              />
            </h1>
            <h2 className='subtitle'>
              <FormattedMessage
                id="wizard.orgInfo"
                defaultMessage={`Primero revisa los datos de tu organización.
                Cuando todo esté correcto da click en guardar y después en continuar.`}
              />
            </h2>
            <OrganizationForm
              baseUrl='/app/organizations'
              url={'/app/organizations/' + this.state.org.uuid}
              initialState={this.state.org}
              submitHandler={(data) => this.submitHandler(data)}
              errorHandler={(data) => this.errorHandler(data)}
              finishUp={(data) => this.finishUpHandler(data)}
              load={() => { this.load() }}
            >
              <div className='field is-grouped'>
                <div className='control'>
                  <button
                    className={'button is-primary ' + this.state.isLoading}
                    disabled={!!this.state.isLoading}
                    type='submit'
                  >
                    <FormattedMessage
                      id="wizard.orgBtnSave"
                      defaultMessage={`Guardar`}
                    />
                  </button>
                </div>
              </div>
            </OrganizationForm>
          </div>
          {/* <div className='column is-4 is-offset-1'>

            <div className='card'>
              <div className='card-image'>
                <figure className='image is-1by1'>
                  <img src={this.state.org.profileUrl} />
                </figure>
              </div>
              <div className='card-content'>
                <div className='media'>
                  <div className='media-content'>
                    <p className='title is-4'>{this.state.org.name}</p>
                  </div>
                </div>

                <div className='content'>
                  {this.state.org.description}
                </div>
              </div>
            </div>
          </div> */}
        </div>

        }
        <center>
          <button onClick={() => this.props.nextStep()} className='button is-primary'>
            <FormattedMessage
              id="wizard.orgBtnContinue"
              defaultMessage={`Continuar`}
            />
          </button>
        </center>
      </div>
    )
  }
}

export default OrgInfo
