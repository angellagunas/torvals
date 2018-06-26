import React, { Component } from 'react'
import Select from '../../projects/detail-tabs/select'
import DatePicker from 'react-datepicker'
import moment from 'moment'
import 'react-datepicker/dist/react-datepicker.css'
import CalendarRules from './calendar-rules';
import { toast } from 'react-toastify'
import Cal from '../../cal';
import Checkbox from '~base/components/base-checkbox'

const colors = {
  1: {
    rangeClass: 'calendar-range-forecast',
    rangeClassStart: 'limit-forecast'
  },
  2: {
    rangeClass: 'calendar-range-sales',
    rangeClassStart: 'limit-sales'
  },
  3: {
    rangeClass: 'calendar-range-adjustments',
    rangeClassStart: 'limit-adjustments'
  },
  4: {
    rangeClass: 'calendar-range-approve',
    rangeClassStart: 'limit-approve'
  },
  5: {
    rangeClass: 'calendar-range-consolidate',
    rangeClassStart: 'limit-consolidate'
  },
  6: {
    rangeClass: 'calendar-range-lime',
    rangeClassStart: 'limit-lime'
  },
  7: {
    rangeClass: 'calendar-range-orange',
    rangeClassStart: 'limit-orange'
  },
  8: {
    rangeClass: 'calendar-range-teal',
    rangeClassStart: 'limit-teal'
  },
  9: {
    rangeClass: 'calendar-range-pink',
    rangeClassStart: 'limit-pink'
  },
  10: {
    rangeClass: 'calendar-range-grey',
    rangeClassStart: 'limit-grey'
  },
  11: {
    rangeClass: 'calendar-range-yellow',
    rangeClassStart: 'limit-yellow'
  },
  12: {
    rangeClass: 'calendar-range-cyan',
    rangeClassStart: 'limit-cyan'
  }

}

class Periods extends Component {
  constructor(props) {
    super(props)
    let rules = this.props.rules
    this.state = {
      timesSelected: {
        period: rules.period || 'w',
        cycle: rules.cycle || 'M',
        periodDuration: rules.periodDuration || 1,
        cycleDuration: rules.cycleDuration || 1,
        takeStart: rules.takeStart !== undefined ? rules.takeStart : true,
        cyclesAvailable: rules.cyclesAvailable || 2,
        season: rules.season || 4,
        startDate: moment.utc(rules.startDate) || moment.utc(),
        hasAnomalies: true
      },
      help: {
        cyclesAvailable: 'is-hidden'
      },
      calendar: {}
    }
    this.times = [
      {
        name: 'Día',
        value: 'd'
      },
      {
        name: 'Semana',
        value: 'w'
      },
      {
        name: 'Mes',
        value: 'M'
      },
      {
        name: 'Año',
        value: 'y'
      }
    ]
    this.color = 0

  }

  componentWillMount(){
    this.makePreview()
  }

  async selectChangeHandler(name, value) {
    let aux = this.state.timesSelected
    aux.periodDuration = 1
    aux.cycleDuration = 1
    if(name === 'cycle'){
      if(value === 'd'){
        aux.period = 'd'
      }
      else{
      let times = this.getTimes(value)
        aux.period = times[times.length - 2].value
      }
    }
    aux[name] = value
    this.setState({
      timesSelected: aux
    }, () => {
      this.makePreview()
    })
  }

  getTimes(value) {
    let values = []
    for (let i = 0; i < this.times.length; i++) {
      values.push(this.times[i])
      if (this.times[i].value === value) {
        break
      }
      
    }
    return values
  }

  handleDateChange = (date) => {
    this.setState({
      timesSelected: {
        ...this.state.timesSelected,
        startDate: date
      }
    }, () => {
      this.makePreview()
    })
  }

  async handleInputChange(name, value) {
    let aux = this.state.timesSelected
    value = value.replace(/\D/, '')

    if (name === 'cyclesAvailable') {
      if (Number(value) < 2) {
        this.setState({
          help: {
            ...this.state.help,
            cyclesAvailable: 'help is-danger'
          },
          disableBtn: true
        })
      }
      else if (Number(value) > 12) {
        value = 12
      }
      else {
        if (value !== '' && Number(value) !== Number(this.props.rules.cycleDuration)) {
          this.notify(
            'El número de ciclos disponibles cambió, debe establecer los rangos de ajuste nuevamente.',
            5000,
            toast.TYPE.INFO
          )
        }

        this.setState({
          help: {
            ...this.state.help,
            cyclesAvailable: 'is-hidden'
          },
          disableBtn: false
        })
      }
    }
    else if (name === 'cycleDuration') {
      if(value !== '' && Number(value) !== Number(this.props.rules.cycleDuration)){
        this.notify(
          'El ciclo cambió, debe establecer los ciclos de operación nuevamente.',
          5000,
          toast.TYPE.INFO
        )
      }
      if (this.state.timesSelected.cycle === 'y') {
        if(Number(value) > 12){
          value = 12
        }
      }
      else if (this.state.timesSelected.cycle === 'M') {
        if (Number(value) > 144) {
          value = 144
        }
      }
      else if (this.state.timesSelected.cycle === 'w') {
        if (Number(value) > 624) {
          value = 624
        }
      }
      else if (this.state.timesSelected.cycle === 'd') {
        if (Number(value) > 4380) {
          value = 4380
        }
      }
    }
    else if (name === 'periodDuration') {
      if (this.state.timesSelected.cycle === this.state.timesSelected.period) {
        if (Number(value) > Number(this.state.timesSelected.cycleDuration)) {
          value = Number(this.state.timesSelected.cycleDuration)
        }
      }
      else if (this.state.timesSelected.cycle === 'y') {
        if (this.state.timesSelected.period === 'M') {
          if (Number(value) > 12) {
            value = 12
          }
        }
        else if (this.state.timesSelected.period === 'w') {
          if (Number(value) > 52) {
            value = 52
          }
        }
        else if (this.state.timesSelected.period === 'd') {
          if (Number(value) > 365) {
            value = 365
          }
        }
      }
      else if (this.state.timesSelected.cycle === 'M') {
        if (this.state.timesSelected.period === 'w') {
          if (Number(value) > 4) {
            value = 4
          }
        }
        else if (this.state.timesSelected.period === 'd') {
          if (Number(value) > 31) {
            value = 31
          }
        }
      }
      else if (this.state.timesSelected.cycle === 'w') {
        if (this.state.timesSelected.period === 'd') {
          if (Number(value) > 7) {
            value = 7
          }
        }
      }
    }

    aux[name] = value
    aux['season'] = aux.cyclesAvailable * 2

    await this.setState({
      timesSelected: aux
    })
  }

  async blurDefault (name, value){
    if(value === ''){
      await this.handleInputChange(name, '1')
    }
    this.makePreview()
  }


  next() {
    if (this.props.org && !this.props.org.isConfigured
      && this.props.completed && this.props.completed.length < 4) {
      this.props.nextStep(this.state.timesSelected, 3)
    }
    else {
      this.props.nextStep(this.state.timesSelected, 1)
    }
  }

  notify(message = '', timeout = 5000, type = toast.TYPE.INFO) {
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

  makeStartDate(date) {
    let d = {}
    d[moment.utc(date).format('YYYY-MM-DD')] = {
      date: moment.utc(date),
      isRange: false,
      isRangeEnd: false,
      isRangeStart: false,
      isToday: true,
      isActive: false,
      isTooltip: true,
      tooltipText: 'Inicio del ciclo'
    }
    return d
  }

  makeRange(start, end, key) {
    let s = moment.utc(start)
    let e = moment.utc(end)
    key = Number(key)

    if (key <= 12) {
      this.color = key
    }
    if (this.color === 12) {
      this.color = 1
    } else {
      this.color++
    }

    let range = {}
    range[s.format('YYYY-MM-DD')] = {
      date: s,
      isRange: true,
      isRangeEnd: false,
      isRangeStart: true,
      isToday: false,
      isActive: true,
      isTooltip: true,
      tooltipText: 'Inicio de periodo ' + (Number(key) + 1),
      rangeClass: colors[this.color].rangeClass,
      rangeClassStart: colors[this.color].rangeClassStart
    }

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
        tooltipText: 'Periodo ' + (Number(key) + 1),
        rangeClass: colors[this.color].rangeClass
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
      rangeClass: colors[this.color].rangeClass,
      rangeClassEnd: colors[this.color].rangeClassStart,
      tooltipText: 'Fin de periodo ' + (Number(key) + 1)
    }
    return range
  }

  makeEndDate(date) {
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

  makeCycle(start, end) {
    let times = this.state.timesSelected
    let periodStart = start.clone()
    let periodEnd = periodStart.clone().add(times.periodDuration, times.period).add(-1, 'days')
    let i = 0

    let calendar = this.makeRange(periodStart, periodEnd, i)

    while (periodEnd.isBefore(end, 'days')) {
      i++
      periodStart = periodStart.add(times.periodDuration, times.period)
      periodEnd = periodStart.clone().add(times.periodDuration, times.period).add(-1, 'days')

      if (this.state.timesSelected.takeStart && periodStart.isBefore(end, 'days')) {
        calendar = {
          ...calendar,
          ...this.makeRange(periodStart, periodEnd, i)
        }
      }
      else if (!this.state.timesSelected.takeStart && periodEnd.isBefore(end, 'days')) {
        calendar = {
          ...calendar,
          ...this.makeRange(periodStart, periodEnd, i)
        }
      }
    }

    calendar = {
      ...calendar,
      ...this.makeStartDate(start),
      ...this.makeEndDate(end)
    }

    return calendar
  }

  makePreview(){
    let times = this.state.timesSelected
    let start = moment.utc(this.state.timesSelected.startDate)
    let end = moment.utc(this.state.timesSelected.startDate).add(times.cycleDuration, times.cycle).add(-1, 'days')
    let calendar = {}
    let seasonEnd = start.clone().add(times.season, times.cycle)

    while(start.isBefore(seasonEnd, 'days')){
      calendar = {
        ...calendar,
        ...this.makeCycle(start, end)
      }
      start = start.add(times.cycleDuration,times.cycle)
      end = start.clone().add(times.cycleDuration, times.cycle).add(-1, 'days')
    }

    this.setState({
      calendar
    })
  }

  hasAnomalies(value){
    this.setState({
      timesSelected: {
        ...this.state.timesSelected,
        hasAnomalies: value
      }
    })
  }

  render() {
    return (
      <div className='section pad-sides has-20-margin-top'>
        <h1 className='title is-5'> Ciclo y periodos</h1>
        <p className='subtitle is-6'>Completa los campos  con la duración  y ciclos acorde a tus necesidades.</p>
        <div className='columns is-centered'>
          <div className='column is-6'>
            <div className='card'>
              <header className='card-header'>
                <p className='card-header-title'>
                  Elige tu duración
                </p>
              </header>
              <div className='card-content'>
                <div className='columns'>
                  <div className='column'>
                    <div className='field has-addons'>
                      <div className='control'>
                        <div className='field'>
                          <label className='label'>Duración de ciclo</label>
                          <div className='control'>
                            <input className='input' type='text' placeholder='Ejem. 1'
                              name='cycleDuration'
                              value={this.state.timesSelected.cycleDuration}
                              onChange={(e) => { this.handleInputChange(e.target.name, e.target.value) }}
                              onBlur={(e) => { this.blurDefault(e.target.name, e.target.value) }} />
                          </div>
                        </div>
                      </div>

                      <div className='control'>

                        <Select
                          label='Ciclo'
                          name='cycle'
                          value={this.state.timesSelected.cycle}
                          optionValue='value'
                          optionName='name'
                          options={this.times}
                          onChange={(name, value) => { this.selectChangeHandler(name, value) }}
                        />

                      </div>
                      <div className='control help'>
                        <button className='button is-static tooltip' data-tooltip='Agrupador de periodos'> ? </button>
                      </div>
                          
                    </div>

                    <div className='field has-addons'>
                      <div className='control'>
                        <div className='field'>
                          <label className='label'>Duración de periodo</label>
                          <div className='control'>
                            <input className='input' type='text' placeholder='Ejem. 1'
                              name='periodDuration'
                              value={this.state.timesSelected.periodDuration}
                              onChange={(e) => { this.handleInputChange(e.target.name, e.target.value) }} 
                              onBlur={(e) => { this.blurDefault(e.target.name, e.target.value) }}/>
                          </div>
                        </div>

                      </div>
                      <div className='control'>
                        <Select
                          label='Periodo'
                          name='period'
                          value={this.state.timesSelected.period}
                          optionValue='value'
                          optionName='name'
                          options={this.getTimes(this.state.timesSelected.cycle)}
                          onChange={(name, value) => { this.selectChangeHandler(name, value) }}
                        />
                      </div>

                      <div className='control help'>
                        <button className='button is-static tooltip' data-tooltip='Unidad mínima de predicción'> ? </button>
                      </div>
                    </div>


                    <div className='field has-addons'>
                      <div className='control'>
                        <div className='field'>
                          <label className='label'>Ciclos de ajuste disponibles </label>
                          <div className='control'>
                            <input className='input' type='text' placeholder='Text input'
                              name='cyclesAvailable'
                              value={this.state.timesSelected.cyclesAvailable}
                              onChange={(e) => { this.handleInputChange(e.target.name, e.target.value) }} />
                          </div>
                          <p className={this.state.help.cyclesAvailable}>Deben ser al menos 2 ciclos disponibles</p>
                        </div>
                      </div>
                      <div className='control'>
                        <div className='field'>
                          <label className='label'>Temporada</label>
                          <div className='control'>
                            <div className='field has-addons'>
                              <div className='control'>
                                <a className="button is-static">
                                  {this.state.timesSelected.season} ciclos
                            </a>
                              </div>
                              <div className='control help-btn'>
                                <button className='button is-static tooltip' data-tooltip='Ciclos de ajuste, el primero siempre es el actual'> ? </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className='field has-addons'>
                      <div className='control'>
                        <label className='label'>Fecha de inicio del primer ciclo</label>
                        <div className='control'>
                          <input className='input' type='text' placeholder='Text input'
                            value={moment.utc(this.state.timesSelected.startDate).format('DD-MMM-YYYY')} readOnly />
                        </div>
                      </div>
                    </div>
                    <br/>
                    <Checkbox
                      label={<span title='Usar anomalias'>Usar anomalias</span>}
                      handleCheckboxChange={(e, value) => this.hasAnomalies(value)}
                      checked={this.state.timesSelected.hasAnomalies}
                    />
                    <br />

                      <p>
                        <label className='radio'>
                          <input 
                            type='radio' 
                            name='takeStart' 
                            checked={this.state.timesSelected.takeStart === true}
                            onChange={(e) => this.setState({
                              timesSelected: {
                                ...this.state.timesSelected,
                                takeStart: true
                              }
                            }, () => { this.makePreview() })
                            } />
                        <span>Usar la fecha de <strong className='has-text-info'>inicio</strong> del periodo para determinar el ciclo al que pertenece</span>
                      </label>
                    </p>
                    <br />

                    <p>
                      <label className='radio'>
                        <input 
                          type='radio' 
                          name='takeStart' 
                          checked={this.state.timesSelected.takeStart === false}
                          onChange={(e) => this.setState({
                            timesSelected: {
                              ...this.state.timesSelected,
                              takeStart: false
                            }
                          }, () => { this.makePreview() })
                          } />
                        <span>Usar la fecha <strong className='has-text-info'>final</strong> del periodo para determinar el ciclo al que pertenece</span>
                      </label>
                    </p>                    
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className='column is-offset-1'>

            <Cal
              showWeekNumber
              date={moment.utc(this.state.timesSelected.startDate)}
              dates={this.state.calendar}
              onChange={this.handleDateChange}
            />

          </div>
        </div>

        <br />
        <div className='buttons wizard-steps'>
          {this.props.org && !this.props.org.isConfigured &&
            this.props.completed && this.props.completed.length < 4
            ? 
            <button onClick={() => this.props.setStep(0)} className='button is-primary'>Atrás</button>
          :
          <button onClick={() => this.props.setStep(1)} className='button is-danger'>Cancelar</button>
          }
          <button
            disabled={this.state.disableBtn}
            onClick={() => this.next()}
            className='button is-primary'>
            {this.props.org && !this.props.org.isConfigured 
            && this.props.completed && this.props.completed.length < 4?
            'Siguente' : 'Guardar'
            }
          </button>
        </div>
  
      </div>
    )
  }
}

export default Periods
