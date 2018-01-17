import React, { Component } from 'react'
import api from '~base/api'
import lov from 'lov'
import DatePicker from 'react-datepicker'
import moment from 'moment'

import 'react-datepicker/dist/react-datepicker.css'

class ForecastForm extends Component {
  constructor (props) {
    super(props)
    this.state = {
      formData: {
        dateStart: '',
        dateEnd: '',
        frequency: '',
        holidays: [],
        changePoints: [],
        columnsForForecast: []
      },
      columnsForecast: [],
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
      holidaysDate: undefined,
      changePointsDate: undefined,
      columnForForecast: undefined,
      apiCallMessage: 'is-hidden',
      apiCallErrorMessage: 'is-hidden'
    }
  }

  componentWillMount () {
    this.load()
  }

  async load () {
    var url = `/app/projects/${this.props.project.uuid}/columns`
    const body = await api.get(url)

    this.setState({
      loading: false,
      loaded: true,
      columnsForecast: body.data
    })
  }

  errorHandler (e) {}

  componentWillReceiveProps (next) {
    this.load()

    if (next.submit) {
      this.submitHandler()
    }
  }

  handleChange (type, value) {
    const data = {
      apiCallMessage: 'is-hidden',
      apiCallErrorMessage: 'is-hidden'
    }

    data[type] = value

    if (type === 'dateStart' && !this.state.dateEnd) {
      data['dateEnd'] = moment(value).add(1, 'months').subtract(1, 'days')
    }

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
      holidaysDate: undefined
    })
  }

  handleChangePointsValues (event) {
    event.preventDefault()
    if (!this.state.changePointsDate) {

    } else {
      this.setState({
        ...this.state.formData.changePoints.push(this.state.changePointsDate),
        changePointsDate: undefined
      })
    }
  }

  handleColumnsForForecastValues (event) {
    event.preventDefault()
    if (!this.state.columnForForecast) {

    } else {
      this.setState({
        ...this.state.formData.columnsForForecast.push(this.state.columnForForecast),
        columnForForecast: undefined
      })
    }
  }

  async submitHandler (event) {
    if (event) event.preventDefault()
    const formData = this.state.formData

    if (!this.state.dateStart || !this.state.dateEnd || !this.state.frequency) {
      return this.setState({
        ...this.state,
        error: 'Date start, Date end and Frequency are all required!',
        apiCallErrorMessage: 'message is-danger'
      })
    }

    formData.dateStart = this.state.dateStart.format('YYYY-MM-DD')
    formData.dateEnd = this.state.dateEnd.format('YYYY-MM-DD')
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

  removeColumnForForecast (index) {
    this.setState({
      ...this.state.formData.columnsForForecast.splice(index, 1)
    })
  }

  getDateEnd () {
    if (this.state.dateStart && !this.state.dateEnd) {
      return moment(this.state.dateStart).add(1, 'months').subtract(1, 'days')
    }

    return this.state.dateEnd
  }

  render () {
    return (
      <div>
        <form onSubmit={(e) => { this.submitHandler(e) }}>
          <div className='columns'>
            <div className='column'>
              <div className='field'>
                <label className='label'>Date Start*</label>
                <div className='control is-datepicker-fullwidth'>
                  <DatePicker
                    className='input'
                    name='dateStart'
                    dateFormat='YYYY-MM-DD'
                    placeholderText='Click to select a date'
                    selected={this.state.dateStart}
                    onChange={(e) => { this.handleChange('dateStart', e) }}
                  />
                </div>
              </div>
            </div>
            <div className='column'>
              <div className='field'>
                <label className='label'>Date End*</label>
                <div className='control is-datepicker-fullwidth'>
                  <DatePicker
                    className='input'
                    name='dateEnd'
                    dateFormat='YYYY-MM-DD'
                    placeholderText='Click to select a date'
                    selected={this.getDateEnd()}
                    onChange={(e) => { this.handleChange('dateEnd', e) }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className='field'>
            <label className='label'>Frequency*</label>
            <div className='control'>
              <div className='select is-fullwidth'>
                <select
                  className='is-fullwidth'
                  type='text'
                  name='frequency'
                  onChange={(e) => {
                    this.handleChange('frequency', e.currentTarget.value)
                  }}
                >
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
            <label className='label'>Columns for Forecast</label>
            <div className='control' />
          </div>

          <div className='field has-addons'>
            <div className='control is-expanded'>
              <div className='select is-fullwidth'>

                <select
                  name='columnForForecast'
                  value={this.state.columnForForecast}
                  onChange={(e) => {
                    this.handleChange('columnForForecast', e.currentTarget.value)
                  }}
                >
                  <option value=''>Select a option</option>
                  {
                    this.state.columnsForecast.map(function (item) {
                      return <option key={item}
                        value={item}>{item}</option>
                    })
                  }
                </select>

              </div>
            </div>
            <div className='control'>
              <button
                className='button is-primary'
                onClick={(e) => this.handleColumnsForForecastValues(e)}
                type='button'
              >
                Add
              </button>
            </div>
          </div>

          <table className='table is-fullwidth'>
            <thead>
              <tr>
                <th>Column</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {this.state.formData.columnsForForecast.length === 0 ? (
                <tr>
                  <td colSpan='3'>No columns to show</td>
                </tr>
                ) : (
                  this.state.formData.columnsForForecast.map((item, key) => {
                    return (
                      <tr key={key}>
                        <td>{item}</td>
                        <td>
                          <button
                            className='button is-danger'
                            type='button'
                            onClick={() => this.removeColumnForForecast(key)}
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
                    onChange={(e) => { this.handleChange('holidaysName', e.currentTarget.value) }}
                  />
                </p>
              </div>
              <div className='field has-addons'>
                <div className='control is-expanded is-datepicker-fullwidth'>
                  <DatePicker
                    className='input'
                    dateFormat='YYYY-MM-DD'
                    placeholderText='Click to select a date'
                    selected={this.state.holidaysDate}
                    onChange={(e) => { this.handleChange('holidaysDate', e) }}
                  />
                </div>
                <div className='control'>
                  <button
                    className='button is-primary'
                    onClick={(e) => this.handleHolidaysValues(e)}
                    type='button'
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>

          <table className='table is-fullwidth'>
            <thead>
              <tr>
                <th>Name</th>
                <th>Date</th>
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
                        <td>{item.date.format('YYYY-MM-DD')}</td>
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

          <div className='field has-addons'>
            <div className='control is-expanded is-datepicker-fullwidth '>
              <DatePicker
                className='input'
                dateFormat='YYYY-MM-DD'
                placeholderText='Click to select a date'
                selected={this.state.changePointsDate}
                onChange={(e) => {
                  this.handleChange('changePointsDate', e)
                }}
              />
            </div>
            <p className='control'>
              <button
                className='button is-primary'
                onClick={(e) => this.handleChangePointsValues(e)}
                type='button'
              >
                Add
              </button>
            </p>
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
                        <td>{item.format('YYYY-MM-DD')}</td>
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
        </form>
      </div>
    )
  }
}

export default ForecastForm
