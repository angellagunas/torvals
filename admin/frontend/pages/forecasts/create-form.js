import React, { Component } from 'react'
import api from '~base/api'

import {
  BaseForm,
  DateWidget,
  SelectWidget
} from '~base/components/base-form'

const schema = {
  type: 'object',
  title: '',
  required: [
    'dateStart',
    'dateEnd',
    'frequency'
  ],
  properties: {
    dateStart: {type: 'string', title: 'Start date', format: 'date'},
    dateEnd: {type: 'string', title: 'End date', format: 'date'},
    frequency: {
      type: 'string',
      title: 'Frequency',
      enum: ['B', 'D', 'W', 'M'],
      enumNames: [
        'Business day frequency',
        'Calendar day frequency',
        'Weekly frequency',
        'Month end frequency'
      ]
    }
    // holidays: {
    //   type: 'array',
    //   title: 'Holidays',
    //   items: {
    //     type: 'object',
    //     properties: {
    //       date: {
    //         title: 'Date',
    //         type: 'string',
    //         format: 'date'
    //       },
    //       name: {
    //         title: 'Name',
    //         type: 'string'
    //       }
    //     }
    //   }
    // }
  }
}

const uiSchema = {
  dateStart: {'ui:widget': DateWidget},
  dateEnd: {'ui:widget': DateWidget},
  frequency: {'ui:widget': SelectWidget}
  // 'holidays': {
  //   'additionalItems': {
  //     date: {
  //       'ui:widget': DateWidget
  //     },
  //     name: {
  //       'ui:widget': TextWidget
  //     }
  //   }
  // }
}

class ForecastForm extends Component {
  constructor (props) {
    super(props)
    this.state = {
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
    try {
      var data = await api.post(this.props.url, formData)
      if (this.props.load) {
        await this.props.load()
      }
      this.clearState()
      this.setState({...this.state, apiCallMessage: 'message is-success'})
      if (this.props.finishUp) this.props.finishUp(data.data)
      return
    } catch (e) {
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
          {this.props.children}
        </BaseForm>
      </div>
    )
  }
}

export default ForecastForm
