import React, { Component } from 'react'
import moment from 'moment'
import Cal from '../../cal'
import { toast } from 'react-toastify'

const colors = {
  1: {
    rangeClass: 'calendar-range-forecast',
    rangeClassStart: 'limit-forecast',
    tooltip: 'generar predicción'
  },
  2: {
    rangeClass: 'calendar-range-sales',
    rangeClassStart: 'limit-sales',
    tooltip: 'subir ventas'
  },
  3: {
    rangeClass: 'calendar-range-adjustments',
    rangeClassStart: 'limit-adjustments',
    tooltip: 'realizar ajustes'
  },
  4: {
    rangeClass: 'calendar-range-approve',
    rangeClassStart: 'limit-approve',
    tooltip: 'aprobar ajustes'
  },
  5: {
    rangeClass: 'calendar-range-consolidate',
    rangeClassStart: 'limit-consolidate',
    tooltip: 'concentrar información'
  }
}

class DeadLines extends Component {
  constructor (props) {
    super(props)
    this.state = {
      data: {
        salesUpload: this.props.rules.salesUpload || 1,
        forecastCreation: this.props.rules.forecastCreation || 1,
        rangeAdjustment: this.props.rules.rangeAdjustment || 1,
        rangeAdjustmentRequest: this.props.rules.rangeAdjustmentRequest || 1,
        consolidation:
          moment.utc(this.props.rules.startDate)
            .add(this.props.rules.cycleDuration, this.props.rules.cycle)
            .add(-1, 'days').diff(moment.utc(this.props.rules.startDate), 'days')
      },
      startDate: moment.utc(this.props.rules.startDate) || moment.utc(),
      endDate: moment.utc(this.props.rules.startDate)
      .add(this.props.rules.cycleDuration, this.props.rules.cycle)
      .add(-1, 'days') || moment.utc().add(1, 'M')
    }
  }

  componentWillMount () {
    this.verifyCycle()
  }

  verifyCycle () {
    let cycleDays = moment.utc(this.props.rules.startDate)
      .add(this.props.rules.cycleDuration, this.props.rules.cycle)
      .add(-1, 'days').diff(moment.utc(this.props.rules.startDate), 'days')

    let d = this.state.data

    let totalDays = d.salesUpload + d.forecastCreation + d.rangeAdjustment + d.rangeAdjustmentRequest

    if (totalDays > cycleDays) {
      this.notify(
        'El ciclo cambió, debe establecer los ciclos de operación.',
        5000,
        toast.TYPE.INFO
      )
      this.setState({
        data: {
          step: 3,
          salesUpload: 1,
          forecastCreation: 1,
          rangeAdjustment: 1,
          rangeAdjustmentRequest: 1,
          consolidation:
            moment.utc(this.props.rules.startDate)
              .add(this.props.rules.cycleDuration, this.props.rules.cycle)
              .add(-5, 'days').diff(moment.utc(this.props.rules.startDate), 'days')
        }
      }, () => {
        this.daysLeft()
      })
    } else {
      this.daysLeft()
    }
  }

  handleInputChange (name, value) {
    let aux = this.state.data
    value = value.replace(/\D/, '')

    aux[name] = Number(value)

    this.setState({
      data: aux
    }, () => {
      this.daysLeft()
    })
  }

  componentWillReceiveProps (next) {
    if (next.rules !== this.state.rules) {
      this.setState({
        data: {
          salesUpload: next.rules.salesUpload || 1,
          forecastCreation: next.rules.forecastCreation || 1,
          rangeAdjustment: next.rules.rangeAdjustment || 1,
          rangeAdjustmentRequest: next.rules.rangeAdjustmentRequest || 1,
          consolidation:
            moment.utc(next.rules.startDate)
              .add(next.rules.cycleDuration, next.rules.cycle)
              .add(-1, 'days').diff(moment.utc(next.rules.startDate), 'days')
        },
        startDate: moment.utc(next.rules.startDate) || moment.utc(),
        endDate: moment.utc(next.rules.startDate)
          .add(next.rules.cycleDuration, next.rules.cycle)
          .add(-1, 'days') || moment.utc().add(1, 'M')

      }, () => {
        this.verifyCycle()
      })
    }
  }

  blurDefault (name, value) {
    if (value === '' || value === '0') {
      this.handleInputChange(name, '1')
    }
  }

  makeStartDate (date) {
    let d = {}
    d[moment.utc(date).format('YYYY-MM-DD')] = {
      date: moment.utc(date),
      isRange: false,
      isRangeEnd: false,
      isRangeStart: false,
      isToday: true,
      isActive: false,
      isTooltip: true,
      tooltipText: 'Inicio del primer ciclo'
    }
    return d
  }

  makeEndDate (date) {
    let d = {}
    d[moment.utc(date).format('YYYY-MM-DD')] = {
      date: moment.utc(date),
      isRange: false,
      isRangeEnd: false,
      isRangeStart: false,
      isToday: true,
      isActive: false,
      isTooltip: true,
      tooltipText: 'Fin del ciclo'
    }
    return d
  }

  makeRange (start, end, key) {
    let s = moment.utc(start)
    let e = moment.utc(end)
    let range = {}

    while (s.format('YYYY-MM-DD') !== e.format('YYYY-MM-DD')) {
      s = s.add(1, 'day')
      range[s.format('YYYY-MM-DD')] = {
        date: s,
        isRange: true,
        isRangeEnd: false,
        isRangeStart: false,
        isToday: false,
        isActive: false,
        isTooltip: true,
        tooltipText: colors[key].tooltip,
        rangeClass: colors[key].rangeClass
      }
    }

    range[e.format('YYYY-MM-DD')] = {
      date: s,
      isRange: true,
      isRangeEnd: true,
      isRangeStart: false,
      isToday: false,
      isActive: true,
      isTooltip: true,
      rangeClass: colors[key].rangeClass,
      rangeClassEnd: colors[key].rangeClassStart,
      tooltipText: 'Límite para ' + colors[key].tooltip
    }
    return range
  }

  makeDates () {
    let data = this.state.data
    let dates = {}

    let start = this.makeStartDate(this.state.startDate)
    dates[Object.keys(start)[0]] = Object.values(start)[0]
    let end = this.makeEndDate(this.state.endDate)
    dates[Object.keys(end)[0]] = Object.values(end)[0]

    let saleDate = this.state.startDate.clone()
      .add(Number(data.salesUpload), 'days')
    let forecastDate = this.state.startDate.clone()
      .add(Number(data.salesUpload) + Number(data.forecastCreation), 'days')
    let adjusmentDate = this.state.startDate.clone()
      .add(Number(data.salesUpload) + Number(data.forecastCreation) + Number(data.rangeAdjustment), 'days')

    let approveDate = this.state.startDate.clone()
      .add(Number(data.salesUpload) + Number(data.forecastCreation) +
      Number(data.rangeAdjustment) + Number(data.rangeAdjustmentRequest), 'days')

    let sales = this.makeRange(this.state.startDate, saleDate, 2)
    let forecast = this.makeRange(saleDate, forecastDate, 1)
    let adjusment = this.makeRange(forecastDate, adjusmentDate, 3)
    let approve = this.makeRange(adjusmentDate, approveDate, 4)
    let consolidation = this.makeRange(approveDate, this.state.endDate.clone(), 5)

    dates = {
      ...dates,
      ...consolidation,
      ...approve,
      ...adjusment,
      ...forecast,
      ...sales
    }

    this.setState({
      dates
    })
  }

  daysLeft () {
    let data = this.state.data
    let c = moment.utc(this.props.rules.startDate)
      .add(this.props.rules.cycleDuration, this.props.rules.cycle)
      .add(-1, 'days').diff(moment.utc(this.props.rules.startDate), 'days')

    data.consolidation = c - data.salesUpload -
    data.forecastCreation - data.rangeAdjustment -
    data.rangeAdjustmentRequest

    this.setState({ data }, () => {
      if (data.consolidation > 0) {
        this.setState({
          disableBtn: false
        })
        this.makeDates()
      } else {
        this.notify(
          'Error: No puedes tomar más días de los que dura el ciclo.',
          5000,
          toast.TYPE.ERROR
        )
        this.setState({
          disableBtn: true
        })
      }
    })
  }

  notify (message = '', timeout = 5000, type = toast.TYPE.INFO) {
    let className = ''
    if (type === toast.TYPE.WARNING) {
      className = 'has-bg-warning'
    }
    if (!toast.isActive(this.toastId)) {
      this.toastId = toast(message, {
        autoClose: timeout,
        type: type,
        hideProgressBar: true,
        closeButton: false,
        className: className
      })
    } else {
      toast.update(this.toastId, {
        render: message,
        type: type,
        autoClose: timeout,
        closeButton: false,
        className: className
      })
    }
  }

  makeCalendar () {
    let cal = {}
    for (let i = 1; i <= 12; i++) {
      for (const key in this.state.dates) {
        const element = this.state.dates[key]
        let obj = {
          ...element,
          date: moment.utc(key).add(this.props.rules.cycleDuration * i, this.props.rules.cycle)
        }
        cal[obj.date.format('YYYY-MM-DD')] = obj
      }
    }
    this.setState({
      dates: {
        ...this.state.dates,
        ...cal
      }
    })
  }

  next () {
    if (this.props.org && !this.props.org.isConfigured &&
      this.props.completed && this.props.completed.length < 4) {
      this.props.nextStep({ ...this.state.data, dates: this.state.dates }, 5)
    } else {
      this.props.nextStep({ ...this.state.data, dates: this.state.dates }, 1)
    }
  }

  render () {
    const deadlines = [
      {
        title: 'Actualizar datos de ventas',
        name: 'salesUpload',
        color: 'deadline-sales'
      },
      {
        title: 'Generar Predicción',
        name: 'forecastCreation',
        color: 'deadline-forecast'
      },
      {
        title: 'Realizar Ajustes',
        name: 'rangeAdjustment',
        color: 'deadline-adjustments'
      },
      {
        title: 'Aprobar Ajustes',
        name: 'rangeAdjustmentRequest',
        color: 'deadline-approve'
      },
      {
        title: 'Concentrar Información',
        name: 'consolidation',
        color: 'deadline-consolidate'
      }
    ]

    if (this.props.hideInputs && this.state.dates) {
      return (
        <Cal
          showWeekNumber={this.state.showWeekNumbers}
          date={this.state.startDate.clone()}
          minDate={this.state.startDate.clone().startOf('month')}
          maxDate={this.state.endDate.clone().endOf('month')}
          dates={this.state.dates} />
      )
    }

    return (
      <div className='section pad-sides has-20-margin-top'>
        <h1 className='title is-5'> Ciclos de operación</h1>
        <p className='subtitle is-6'>Define las fechas para el ciclo de operación a partir de la fecha de inicio.</p>
        <div className='columns is-centered'>

          <div className='column is-6'>
            <div className='card'>
              <header className='card-header'>
                <p className='card-header-title'>
                  Fechas para operar
                </p>
              </header>
              <div className='card-content'>
                <div>
                  {
                    deadlines.map((item) => {
                      return (
                        <div className='field has-addons' key={item.name}>
                          <p className='control'>
                            <a className={'button is-capitalized ' + item.color}>
                              {item.title}
                            </a>
                          </p>
                          <p className='control'>
                            <input className='input' type='text' placeholder='dias' name={item.name}
                              value={this.state.data[item.name]}
                              onChange={(e) => { this.handleInputChange(e.target.name, e.target.value) }}
                              onBlur={(e) => { this.blurDefault(e.target.name, e.target.value) }}
                            />
                          </p>
                          <p className='control'>
                            <a className='button is-static'>
                              Días
                            </a>
                          </p>
                        </div>
                      )
                    })
                  }
                </div>
              </div>
            </div>
          </div>

          <div className='column is-offset-1'>
            {this.state.dates &&
            <Cal
              showWeekNumber={this.state.showWeekNumbers}
              date={this.state.startDate.clone()}
              minDate={this.state.startDate.clone().startOf('month')}
              maxDate={this.state.endDate.clone().endOf('month')}
              dates={this.state.dates} />
          }
          </div>

        </div>

        <div className='buttons wizard-steps'>
          {this.props.org && !this.props.org.isConfigured &&
            this.props.completed && this.props.completed.length < 4
            ? <button onClick={() => this.props.setStep(3)} className='button is-primary'>Atrás</button>
            : <button onClick={() => this.props.setStep(1)} className='button is-danger'>Cancelar</button>
          }
          <button
            disabled={this.state.disableBtn}
            onClick={() => this.next()}
            className='button is-primary'>
            {this.props.org && !this.props.org.isConfigured &&
              this.props.completed && this.props.completed.length < 4
              ? 'Siguente' : 'Guardar'
            }
          </button>
        </div>
      </div>
    )
  }
}

export default DeadLines
