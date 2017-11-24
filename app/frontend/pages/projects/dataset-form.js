import React, { Component } from 'react'
import api from '~base/api'

import {
  BaseForm,
  SelectWidget,
  TextWidget
} from '~base/components/base-form'

class DatasetForm extends Component {
  constructor (props) {
    super(props)
    this.state = {
      formData: this.props.initialState,
      apiCallMessage: 'is-hidden',
      apiCallErrorMessage: 'is-hidden',
      datasets: [],
      columns: [],
      disabledControls: true
    }
  }

  errorHandler (e) {}

  changeHandler ({formData}) {
    if (formData.dataset) {
      var posDataset = this.props.datasets.findIndex(e => {
        return (
        String(e.uuid) === String(formData.dataset)
        )
      })

      this.setState({
        columns: this.props.datasets[posDataset].columns,
        disabledControls: false
      })
    } else {
      this.setState({
        columns: [ ],
        disabledControls: true
      })
    }

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
      this.setState({apiCallMessage: 'message is-success'})
      if (this.props.finishUp) this.props.finishUp(data.data)

      setTimeout(() => {
        this.setState({apiCallMessage: 'is-hidden'})
      }, 2000)

      return
    } catch (e) {
      return this.setState({
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

    if (this.props.datasets.length === 0) {
      return (
        <div>
          <h4>There are no processed datasets to select from!</h4>
        </div>
      )
    }

    const schema = {
      type: 'object',
      title: '',
      required: [
        'dataset'
      ],
      properties: {
        dataset: {
          type: 'string',
          title: 'Select dataset to add',
          enum: [],
          enumNames: []
        },
        column: {
          type: 'string',
          title: 'Select a column',
          enum: [],
          enumNames: []
        },
        name: {
          type: 'string',
          title: 'Name'
        }
      }
    }

    const uiSchema = {
      dataset: {'ui:widget': SelectWidget},
      column: {'ui:widget': SelectWidget, 'ui:disabled': this.state.disabledControls},
      name: {'ui:widget': TextWidget, 'ui:disabled': this.state.disabledControls}
    }

    let datasets = schema.properties.dataset

    datasets.enum = this.props.datasets.map(item => { return item.uuid })
    datasets.enumNames = this.props.datasets.map(item => { return item.name })

    let columns = schema.properties.column

    columns.enum = this.state.columns.map(item => { return item.name })
    columns.enumNames = this.state.columns.map(item => { return item.name })

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

export default DatasetForm
