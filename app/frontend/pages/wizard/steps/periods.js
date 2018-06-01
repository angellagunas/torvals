import React, { Component } from 'react'
import Select from '../../projects/detail-tabs/select'
import DatePicker from 'react-datepicker'
import moment from 'moment'
import 'react-datepicker/dist/react-datepicker.css'
import CalendarRules from './calendar-rules';

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
        takeStart: rules.takeStart || true,
        cyclesAvailable: rules.cyclesAvailable || 2,
        season: rules.season || 4,
        startDate: moment(rules.startDate) || moment()
      },
      help: {
        cyclesAvailable: 'is-hidden'
      }
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
    })
  }

  handleInputChange(name, value) {
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
            value = 53
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
          if (Number(value) > 5) {
            value = 5
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

    this.setState({
      timesSelected: aux
    })
  }

  blurDefault (name, value){
    if(value === ''){
      this.handleInputChange(name, '1')
    }
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
                    </div>


                    <div className='field has-addons'>
                      <div className='control'>
                        <div className='field'>
                          <label className='label'>Ciclos disponibles </label>
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
                            <a className="button is-static">
                              {this.state.timesSelected.season} ciclos
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className='field has-addons'>
                      <div className='control'>
                        <label className='label'>Inicio del ciclo</label>
                        <div className='control'>
                          <input className='input' type='text' placeholder='Text input'
                            value={moment(this.state.timesSelected.startDate).format('DD-MMM-YYYY')} readOnly />
                        </div>
                      </div>
                    </div>
                    <br/>
                    
                      <p className='control'>
                        <label className='radio'>
                          <input type='radio' name='takeStart' checked={this.state.timesSelected.takeStart}
                            onChange={(e) => this.setState({
                              timesSelected: {
                                ...this.state.timesSelected,
                                takeStart: true
                              }
                            })} />
                        <span>Usar la fecha de <strong className='has-text-info'>inicio</strong> del periodo para determinar el ciclo al que pertenece</span>
                        </label>
                      </p>

                      <p className='control'>

                        <label className='radio'>
                          <input type='radio' name='takeStart' checked={!this.state.timesSelected.takeStart}
                            onChange={(e) => this.setState({
                              timesSelected: {
                                ...this.state.timesSelected,
                                takeStart: false
                              }
                            })} />
                        <span>Usar la fecha <strong className='has-text-info'>final</strong> del periodo para determinar el ciclo al que pertenece</span>
                        </label>
                      </p>
                    

                  </div>
                </div>
              </div>
            </div>
          </div>

    

          
          <div className='column is-offset-1'>

            <CalendarRules
              date={moment(this.state.timesSelected.startDate)}
              today={moment(this.state.timesSelected.startDate)}
              onChange={this.handleDateChange} />
          </div>
          </div>




        <br />
        <center>
        
        <button disabled={this.state.disableBtn} onClick={() => this.props.nextStep(this.state.timesSelected)} 
        className='button is-primary'>Guardar</button>
          </center>
      
      </div>
    )
  }
}

export default Periods
