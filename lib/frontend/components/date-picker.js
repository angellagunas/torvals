import React, { Component } from 'react'
import moment from 'moment'
import { injectIntl } from 'react-intl'
import { DateRangePicker } from 'react-dates'

class DatePicker extends Component {
	state = {
		startDate: moment(),
		endDate: moment(),
		focusedInput: null
  }

	formatTitle = (id) => {
		return this.props.intl.formatMessage({ id: id })
	}

	onFocusChange = (focusedInput) => {
		this.setState({ focusedInput })
	}

	onDatesChange = ({ startDate, endDate }) => {
		const { onChange } = this.props

		this.setState({ startDate, endDate })

		if (onChange) onChange({ startDate, endDate })
	}

	isOutsideRange = (day) => {
		const {
			minDate=moment(),
			maxDate=moment()
		} = this.props

	  return day.isAfter(maxDate) || day.isBefore(minDate)
	}

	render () {
		const {
			startDate,
			endDate,
			focusedInput
		} = this.state

		const {
			initialStartDate,
			initialEndDate,
      displayFormat='DD-MM-YYYY',
      openDirection='down',
			settings={}
		} = this.props

		return (
      <div>
        <label className="label">{this.props.label}</label>
        <DateRangePicker
        openDirection={openDirection}
        displayFormat={displayFormat}
        startDate={initialStartDate || startDate}
        startDateId="startDate"
        startDatePlaceholderText={this.formatTitle('dashboard.initialMonth')}
        endDate={initialEndDate || endDate}
        endDateId="endDate"
        endDatePlaceholderText={this.formatTitle('dashboard.lastMonth')}
        onDatesChange={this.onDatesChange}
        focusedInput={focusedInput}
        onFocusChange={this.onFocusChange}
        isOutsideRange={this.isOutsideRange}
        {...settings}
			  />
      </div>
		)
	}
}

export default injectIntl(DatePicker)