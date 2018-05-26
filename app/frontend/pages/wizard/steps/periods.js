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
        cicle: rules.cicle || 'm',
        periodDuration: rules.periodDuration || 1,
        cicleDuration: rules.cicleDuration || 1,
        takeStart: rules.takeStart || true,
        ciclesAvailable: rules.ciclesAvailable || 6,
        season: rules.season || 'y',
        seasonDuration: rules.seasonDuration || 1,
        startDate: moment(rules.startDate) || moment()
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
        value: 'm'
      },
      {
        name: 'Año',
        value: 'y'
      }
    ]
  }

  async selectChangeHandler(name, value) {
    let aux = this.state.timesSelected
    aux[name] = value
    this.setState({
      timesSelected: aux
    })
  }

  getTimes(value) {
    let values = []
    for (let i = 0; i < this.times.length; i++) {
      if (this.times[i].value === value) {
        break
      }
      values.push(this.times[i])
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
    aux[name] = value
    aux['seasonDuration'] = aux.ciclesAvailable * 2

    this.setState({
      timesSelected: aux
    })
  }

  render() {
    return (
      <div className='section'>
        <h1 className='title is-4'> Debe seleccionar su ciclo y periodos de negocio</h1>

<div className='columns'>
<div className='column'>
            <div className='field has-addons'>
              <p className='control'>
                <div className='field'>
                  <label className='label'>Duración de ciclo</label>
                  <div className='control'>
                    <input className='input' type='text' placeholder='Text input'
                      name='cicleDuration'
                      value={this.state.timesSelected.cicleDuration}
                      onChange={(e) => { this.handleInputChange(e.target.name, e.target.value) }} />
                  </div>
                </div>
              </p>

              <p className='control'>

                <Select
                  label='Ciclo'
                  name='cicle'
                  value={this.state.timesSelected.cicle}
                  optionValue='value'
                  optionName='name'
                  options={this.times}
                  onChange={(name, value) => { this.selectChangeHandler(name, value) }}
                />

              </p>
            </div>

            <div className='field has-addons'>
              <p className='control'>
                <div className='field'>
                  <label className='label'>Duración de periodo</label>
                  <div className='control'>
                    <input className='input' type='text' placeholder='Text input'
                      name='periodDuration'
                      value={this.state.timesSelected.periodDuration}
                      onChange={(e) => { this.handleInputChange(e.target.name, e.target.value) }} />
                  </div>
                </div>

              </p>
              <p className='control'>
                <Select
                  label='Periodo'
                  name='period'
                  value={this.state.timesSelected.period}
                  optionValue='value'
                  optionName='name'
                  options={this.getTimes(this.state.timesSelected.cicle)}
                  onChange={(name, value) => { this.selectChangeHandler(name, value) }}
                />
              </p>
            </div>


            <div className='field has-addons'>
              <p className='control'>
                <div className='field'>
                  <label className='label'>Ciclos disponibles </label>
                  <div className='control'>
                    <input className='input' type='text' placeholder='Text input'
                      name='ciclesAvailable'
                      value={this.state.timesSelected.ciclesAvailable}
                      onChange={(e) => { this.handleInputChange(e.target.name, e.target.value) }} />
                  </div>
                </div>
              </p>
              <p className='control'>
                <div className='field'>
                  <label className='label'>Temporada</label>
                  <div className='control'>
                    <input className='input' type='text' placeholder='Text input'
                      value={this.state.timesSelected.seasonDuration} disabled />
                  </div>
                </div>
              </p>


            </div>

            <div className='field has-addons'>
              <div className='control'>
              <label className='label'>Inicio del ciclo</label>
              <div className='control'>
                <input className='input' type='text' placeholder='Text input'
                    value={moment(this.state.timesSelected.startDate).format('DD-MMM-YYYY')} readonly />
              </div>
              </div>
            </div>

            <div className='field has-addons'>
              <p className='control'>
                <label className='radio'>
                  <input type='radio' name='takeStart' checked={this.state.timesSelected.takeStart}
                    onChange={(e) => this.setState({
                      timesSelected: {
                        ...this.state.timesSelected,
                        takeStart: true
                      }
                    })} />
                  <span>Inicio de periodo</span>
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
                  <span>Final de periodo</span>
                </label>
              </p>
            </div>

</div>
          <div className='column'>

            <CalendarRules 
              date={moment(this.state.timesSelected.startDate)}
              onChange={this.handleDateChange} />
          </div>
</div>
        



        <br />
        <button onClick={() => this.props.nextStep(this.state.timesSelected)} className='button is-primary is-pulled-right'>Continuar</button>
      </div>
    )
  }
}

export default Periods
