import React, { Component } from 'react'

import BaseModal from '~base/components/base-modal'
import ForecastForm from './create-form'

var initialState = {
  dateStart: '',
  dateEnd: ''
}

class CreateForecast extends Component {
  render () {
    return (
      <BaseModal
        title='Create Forecast'
        className={this.props.className}
        hideModal={this.props.hideModal}
      >
        <ForecastForm
          url={this.props.url}
          finishUp={this.props.finishUp}
          load={this.props.load}
          initialState={initialState}

        >
          <div className='field is-grouped'>
            <div className='control'>
              <button className='button is-primary'>Create</button>
            </div>
            <div className='control'>
              <button className='button' onClick={this.hideModal}>Cancel</button>
            </div>
          </div>
        </ForecastForm>
      </BaseModal>
    )
  }
}

export default CreateForecast
