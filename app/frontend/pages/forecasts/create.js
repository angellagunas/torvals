import React, { Component } from 'react'
import { FormattedMessage } from 'react-intl'
import BaseModal from '~base/components/base-modal'
import ForecastForm from './create-form'

var initialState = {
  dateStart: '',
  dateEnd: ''
}

class CreateForecast extends Component {
  constructor (props) {
    super(props)
    this.state = {
      submit: false
    }
  }
  submitOnClick () {
    this.setState({submit: true})

    setTimeout(() => { this.setState({submit: false}) }, 100)
  }

  render () {
    let footer = (
      <div className='field is-grouped'>
        <div className='control'>
          <button className='button is-primary' type='submit' onClick={() => this.submitOnClick()}>
            <FormattedMessage
              id="forecasts.btnCrate"
              defaultMessage={`Crear`}
            />
          </button>
        </div>
        <div className='control'>
          <button className='button' onClick={this.props.hideModal} type='button'>
            <FormattedMessage
              id="forecasts.btnCancel"
              defaultMessage={`Cancelar`}
            />
          </button>
        </div>
      </div>
    )
    return (
      <BaseModal
        title='Crear Forecast'
        className={this.props.className}
        hideModal={this.props.hideModal}
        hasFooter
        footer={footer}
      >
        <ForecastForm
          url={this.props.url}
          finishUp={this.props.finishUp}
          load={this.props.load}
          initialState={initialState}
          submit={this.state.submit}
          project={this.props.project}
        />
      </BaseModal>
    )
  }
}

export default CreateForecast
