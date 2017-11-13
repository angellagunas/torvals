import React, { Component } from 'react'

import api from '~base/api'
import Loader from '~base/components/spinner'

class ConfigureDatasetForm extends Component {
  constructor (props) {
    super(props)
    this.state = {
      formData: {
        columns: this.props.columns,
        groupings: []
      },
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

  handleChange (type, event) {
    const data = {}
    data[type] = event.currentTarget.value

    this.setState(data)
  }

  handleChangeCheckbox (type, event) {
    const column = type.split('|')
    const valueColumn = event.currentTarget.checked
    var posColumn = this.state.formData.columns.findIndex(e => {
      return (
        String(e.name) === String(column[0])
      )
    })

    this.setState({

      ...this.state.formData.columns[posColumn][column[1]] = valueColumn

    })
  }

  async submitHandler (event) {
    event.preventDefault()
    const formData = this.state.formData
    try {
      var response = await api.post(this.props.url, formData)
      this.props.changeHandler(response.data)
    } catch (e) {
      return this.setState({
        ...this.state,
        error: e.message,
        apiCallErrorMessage: 'message is-danger'
      })
    }
  }

  handleColumnsValues (event) {
    if (!this.state.groupingColumn) {

    } else {
      this.setState({

        ...this.state.formData.groupings.push({
          column: this.state.groupingColumn,
          inputValue: this.state.groupingInput,
          outputValue: this.state.groupingOutput
        }),
        ...this.state.groupingColumn = '',
        ...this.state.groupingInput = '',
        ...this.state.groupingOutput = ''

      })
    }
    event.preventDefault()
  }

  handleChangeDateAnalyze (type, event) {
    const column = event.currentTarget.value
    var posColumn = this.state.formData.columns.findIndex(e => {
      return (
        String(e.name) === String(column)
      )
    })

    this.setState({

      ...this.state.formData.columns[posColumn][type] = true

    })
  }

  clearState () {
    this.setState({
      apiCallMessage: 'is-hidden',
      formData: this.props.initialState
    })
  }

  render () {
    var error
    if (this.state.error) {
      error = <div>
        Error: {this.state.error}
      </div>
    }

    if (this.props.columns.length === 0) {
      return <Loader />
    }

    return (
      <div>
        <form onSubmit={(e) => { this.submitHandler(e) }}>
          <div className='field'>
            <label className='label'>Is Date</label>
            <div className='control'>
              <div className='select'>
                <select type='text' onChange={(e) => { this.handleChangeDateAnalyze('isDate', e) }}>
                  <option value=''>Select a option</option>
                  {
                    this.state.formData.columns.map(function (item, key) {
                      return <option key={key}
                        value={item.name}>{item.name}</option>
                    })
                  }
                </select>
              </div>
            </div>
          </div>

          <div className='field'>
            <label className='label'>Is Analyze</label>
            <div className='control'>
              <div className='select'>
                <select type='text' onChange={(e) => { this.handleChangeDateAnalyze('analyze', e) }}>
                  <option value=''>Select a option</option>
                  {
                    this.state.formData.columns.map(function (item, key) {
                      return <option key={key}
                        value={item.name}>{item.name}</option>
                    })
                  }
                </select>
              </div>
            </div>
          </div>

          <div className='field is-horizontal'>
            <div className='field-label is-normal'>
              <label className='label' />
            </div>
            <div className='field-body'>
              <div className='field'>
                <div className='field-label has-text-centered'>
                  <label className=''>
                    Operation Filter
                  </label>
                </div>
              </div>
              <div className='field'>
                <div className='field-label has-text-centered'>
                  <label className=''>
                    Analysis Filter
                  </label>
                </div>
              </div>
            </div>
          </div>

          {
          this.state.formData.columns.map((item, key) => {
            return (
              <div className='field is-horizontal'>
                <div className='field-label is-normal'>
                  <label className='label'>{item.name}</label>
                </div>
                <div className='field-body'>
                  <div className='field'>
                    <div className='control box has-text-centered'>
                      <label className='checkbox'>
                        <input type='checkbox' onChange={(e) => { this.handleChangeCheckbox(item.name + '|isOperationFilter', e) }} />
                      </label>
                    </div>
                  </div>
                  <div className='field'>
                    <div className='control box has-text-centered'>
                      <label className='checkbox'>
                        <input onChange={(e) => { this.handleChangeCheckbox(item.name + '|isAnalysisFilter', e) }} type='checkbox' />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
          }

          <div className='field is-horizontal'>
            <div className='field-body'>
              <div className='field is-narrow'>
                <div className='control'>
                  <div className='select is-fullwidth'>
                    <select onChange={(e) => { this.handleChange('groupingColumn', e) }}>
                      <option value='' >Select a option</option>
                      {
                    this.state.formData.columns.map(function (item, key) {
                      return <option key={key}
                        value={item.name}>{item.name}</option>
                    })
                  }
                    </select>
                  </div>
                </div>
              </div>
              <div className='field'>
                <p className='control is-expanded'>
                  <input className='input' type='text' value={this.state.groupingInput} onChange={(e) => { this.handleChange('groupingInput', e) }} />
                </p>
              </div>
              <div className='field'>
                <p className='control is-expanded'>
                  <input className='input is-success' type='text' value={this.state.groupingOutput} onChange={(e) => { this.handleChange('groupingOutput', e) }} />
                </p>
              </div>
              <div className='field'>
                <p className='control is-expanded'>
                  <button className='button is-primary' onClick={(e) => this.handleColumnsValues(e)} type='button'>Add</button>
                </p>
              </div>
            </div>
          </div>

          <table className='table is-fullwidth'>
            <thead>
              <tr>
                <th>Column</th>
                <th>Value 1</th>
                <th>Value 2</th>
              </tr>
            </thead>
            <tbody>
              {this.state.formData.groupings.length === 0 ? (
                <tr>
                  <td colSpan='3'>No rows to show</td>
                </tr>
                ) : (
                  this.state.formData.groupings.map(function (item, key) {
                    return (
                      <tr key={key}>
                        <td>{item.column}</td>
                        <td>{item.inputValue}</td>
                        <td>{item.outputValue}</td>
                      </tr>
                    )
                  })

                )}
            </tbody>
          </table>

          <div className='field is-grouped'>
            <div className='control'>
              <button className='button is-primary'>Configure</button>
            </div>
          </div>
        </form>

        <div className={this.state.apiCallMessage}>
          <div className='message-body is-size-7 has-text-centered'>
            The dataSet has been configured successfuly
          </div>
        </div>
      </div>

    )
  }
}

export default ConfigureDatasetForm
