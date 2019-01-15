import React, { Component } from 'react'
import { FormattedMessage } from 'react-intl'
import moment from 'moment'

export class Timer extends Component {
  state = {
    days: 0,
    hours: 0,
    minutes: 0
  }

  interval = null

  componentDidMount() {
    this.getTimeRemaining()
    this.initInterval()
  }

  componentWillReceiveProps(nextProps){
    if (this.props.timerStart !== nextProps.timerStart || this.props.timerEnd !== nextProps.timerEnd) {
      setTimeout(() => this.getTimeRemaining(), 500)
      this.initInterval()
    }
  }

  componentWillUnmount() {
    clearInterval(this.interval)
  }

  initInterval() {
    if (this.interval) {
      clearInterval(this.interval)
    }

    this.interval = setInterval(() => {
      this.getTimeRemaining()
    }, 60000)
  }

  getTimeRemaining() {
    const {
      timerStart='2018-12-12',
      timerEnd='2018-12-20'
    } = this.props

    const start = moment(timerStart, 'YYYY-MM-DD').utc()
    const end = moment(timerEnd, 'YYYY-MM-DD').utc()

    let now = moment().utc()

    if (now.month() === end.month() && now.date() > end.date()) {
      now = end
    } else if (now.month() === start.month()) {
      now = now.date() >= start.date() ? now : start
    } else {
      now = end
    }

    const diff = moment.duration(end.diff(now))
    const days = parseInt(diff.asDays())
    const hours = parseInt(diff.asHours()) - days * 24
    const minutes = parseInt(diff.asMinutes()) - (days * 24 * 60 + hours * 60)

    this.setState({
      days,
      hours,
      minutes
    })
  }

  render() {
    const { days, hours, minutes } = this.state

    return (
      <div className="column is-narrow is-half-mobile">
        <div className="time has-text-centered">
          <p className="desc">
            <FormattedMessage
              id="report.adjustmentTimeLeft"
              defaultMessage="Tiempo restante para ajustar"
            />
          </p>
          <div className="columns is-mobile">
            <div className="column">
              <p className="num">{days}</p>
              <p className="desc">
                &nbsp;
                <FormattedMessage
                  id="report.days"
                  defaultMessage="Días"
                />
              </p>
            </div>
            <div className="column">
              <p className="num">{hours}</p>
              <p className="desc">
                &nbsp;
                <FormattedMessage
                  id="report.hours"
                  defaultMessage="Horas"
                />
              </p>
            </div>
            <div className="column">
              <p className="num">:</p>
              <p className="desc">&nbsp;</p>
            </div>
            <div className="column">
              <p className="num">{minutes}</p>
              <p className="desc">
                &nbsp;
                <FormattedMessage
                  id="report.minutes"
                  defaultMessage="Min."
                />
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default Timer