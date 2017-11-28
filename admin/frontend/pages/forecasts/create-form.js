import React, { Component } from 'react'
import api from '~base/api'
import lov from 'lov'

class ForecastForm extends Component {
  constructor (props) {
    super(props)
    this.state = {
      formData: {
        dateStart: '',
        dateEnd: '',
        frequency: '',
        holidays: [],
        changePoints: []
      },
      frequencyData: {
        enum: ['B', 'D', 'W', 'M'],
        enumNames: [
          'Business day frequency',
          'Calendar day frequency',
          'Weekly frequency',
          'Month end frequency'
        ]
      },
      holidaysName: '',
      holidaysDate: '',
      changePointsDate: '',
      apiCallMessage: 'is-hidden',
      apiCallErrorMessage: 'is-hidden'
    }
  }

  errorHandler (e) {}

  handleChange (type, event) {
    const data = {
      apiCallMessage: 'is-hidden',
      apiCallErrorMessage: 'is-hidden'
    }
    data[type] = event.currentTarget.value

    this.setState(data)
  }

  changeHandler ({formData}) {
    this.setState({
      formData,
      apiCallMessage: 'is-hidden',
      apiCallErrorMessage: 'is-hidden'
    })
  }

  handleHolidaysValues (event) {
    event.preventDefault()
    if (!this.state.holidaysName || !this.state.holidaysDate) {
      return false
    }

    this.setState({
      ...this.state.formData.holidays.push({
        name: this.state.holidaysName,
        date: this.state.holidaysDate
      }),
      holidaysName: '',
      holidaysDate: ''
    })
  }

  handleChangePointsValues (event) {
    event.preventDefault()
    if (!this.state.changePointsDate) {

    } else {
      this.setState({
        ...this.state.formData.changePoints.push(this.state.changePointsDate),
        changePointsDate: ''
      })
    }
  }

  async submitHandler (event) {
    event.preventDefault()
    const formData = this.state.formData

    formData.dateStart = this.state.dateStart
    formData.dateEnd = this.state.dateEnd
    formData.frequency = this.state.frequencyData.enum[this.state.frequency]

    const schema = {
      dateStart: lov.string().trim().required(),
      dateEnd: lov.string().trim().required(),
      frequency: lov.string().trim().required()
    }

    let values = {
      dateStart: formData.dateStart,
      dateEnd: formData.dateEnd,
      frequency: formData.frequency
    }

    let result = lov.validate(values, schema)

    if (result.error === null) {
      try {
        var response = await api.post(this.props.url, formData)
        await this.props.load()
        this.setState({...this.state, apiCallMessage: 'message is-success'})
        if (this.props.finishUp) this.props.finishUp(response.data)
      } catch (e) {
        return this.setState({
          ...this.state,
          error: e.message,
          apiCallErrorMessage: 'message is-danger'
        })
      }
    } else {
      return this.setState({
        ...this.state,
        error: result.error.message,
        apiCallErrorMessage: 'message is-danger'
      })
    }
  }

  clearState () {
    this.setState({
      apiCallMessage: 'is-hidden',
      formData: this.props.initialState
    })
  }

  removeChangePoint (index) {
    this.setState({
      ...this.state.formData.changePoints.splice(index, 1)
    })
  }

  removeHoliday (index) {
    this.setState({
      ...this.state.formData.holidays.splice(index, 1)
    })
  }

  render () {
    return (
      <div>
        <form onSubmit={(e) => { this.submitHandler(e) }}>
          <div className='field'>
            <label className='label'>Date Start*</label>
            <div className='control'>
              <input
                type='date'
                className='input'
                name='dateStart'
                onChange={(e) => { this.handleChange('dateStart', e) }}
              />
            </div>
          </div>

          <div className='field'>
            <label className='label'>Date End*</label>
            <div className='control'>
              <input
                type='date'
                className='input'
                name='dateEnd'
                onChange={(e) => { this.handleChange('dateEnd', e) }}
              />
            </div>
          </div>

          <div className='field'>
            <label className='label'>Frequency*</label>
            <div className='control'>
              <div className='select'>
                <select type='text' name='frequency' onChange={(e) => { this.handleChange('frequency', e) }}>
                  <option value=''>Select a option</option>
                  {
                    this.state.frequencyData.enumNames.map(function (item, key) {
                      return <option key={key}
                        value={key}>{item}</option>
                    })
                  }
                </select>
              </div>
            </div>
          </div>

          <div className='field'>
            <label className='label'>Holidays</label>
          </div>
          <div className='field is-horizontal'>
            <div className='field-body'>

              <div className='field'>
                <p className='control is-expanded'>
                  <input
                    className='input'
                    type='text'
                    placeholder='Name'
                    value={this.state.holidaysName}
                    onChange={(e) => { this.handleChange('holidaysName', e) }}
                  />
                </p>
              </div>
              <div className='field'>
                <p className='control is-expanded'>
                  <input
                    className='input'
                    type='date'
                    value={this.state.holidaysDate}
                    onChange={(e) => { this.handleChange('holidaysDate', e) }}
                  />
                </p>
              </div>
              <div className='field'>
                <p className='control is-expanded'>
                  <button
                    className='button is-primary'
                    onClick={(e) => this.handleHolidaysValues(e)}
                    type='button'
                  >
                    Add
                  </button>
                </p>
              </div>
            </div>
          </div>

          <table className='table is-fullwidth'>
            <thead>
              <tr>
                <th>Name</th>
                <th>Date</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {this.state.formData.holidays.length === 0 ? (
                <tr>
                  <td colSpan='3'>No holidays to show</td>
                </tr>
                ) : (
                  this.state.formData.holidays.map((item, key) => {
                    return (
                      <tr key={key}>
                        <td>{item.name}</td>
                        <td>{item.date}</td>
                        <td>
                          <button
                            className='button is-danger'
                            type='button'
                            onClick={() => this.removeHoliday(key)}
                          >
                            <i className='fa fa-times' aria-hidden='true' />
                          </button>
                        </td>
                      </tr>
                    )
                  })

                )}
            </tbody>
          </table>

          <div className='field'>
            <label className='label'>Change Points</label>
          </div>
          <div className='field is-horizontal'>
            <div className='field-body'>
              <div className='field'>
                <p className='control is-expanded'>
                  <input
                    className='input'
                    type='date'
                    value={this.state.changePointsDate}
                    onChange={(e) => { this.handleChange('changePointsDate', e) }}
                  />
                </p>
              </div>
              <div className='field'>
                <p className='control is-expanded'>
                  <button
                    className='button is-primary'
                    onClick={(e) => this.handleChangePointsValues(e)}
                    type='button'
                  >
                    Add
                  </button>
                </p>
              </div>
            </div>
          </div>

          <table className='table is-fullwidth'>
            <thead>
              <tr>
                <th>Date</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {this.state.formData.changePoints.length === 0 ? (
                <tr>
                  <td colSpan='3'>No change points to show</td>
                </tr>
                ) : (
                  this.state.formData.changePoints.map((item, key) => {
                    return (
                      <tr key={key}>
                        <td>{item}</td>
                        <td>
                          <button
                            className='button is-danger'
                            type='button'
                            onClick={() => this.removeChangePoint(key)}
                          >
                            <i className='fa fa-times' aria-hidden='true' />
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
            </tbody>
          </table>

          <div className={this.state.apiCallMessage}>
            <div className='message-body is-size-7 has-text-centered'>
            The dataSet has been configured successfuly
          </div>
          </div>
          <div className={this.state.apiCallErrorMessage}>
            <div className='message-body is-size-7 has-text-centered'>
              {this.state.error}
            </div>
          </div>

          <div className='field is-grouped'>
            <div className='control'>
              <button className='button is-primary'>Save</button>
            </div>
          </div>
        </form>

      </div>

    )
  }
}

export default ForecastForm
