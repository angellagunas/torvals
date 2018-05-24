import React, { Component } from 'react'
import Select from '../../projects/detail-tabs/select'
import DatePicker from 'react-datepicker'
import moment from 'moment'
import 'react-datepicker/dist/react-datepicker.css'

class Periods extends Component {
  constructor (props) {
    super(props)
    this.state = {
      timesSelected: {
        period: 'w',
        cicle: 'm',
        periodDuration: 1,
        cicleDuration: 1,
        takeStart: true,
        ciclesAvailable: 6,
        season: 'y',
        seasonDuration: 1,
        startDate: moment()
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

  async selectChangeHandler (name, value) {
    let aux = this.state.timesSelected
    aux[name] = value
    this.setState({
      timesSelected: aux
    })
  }

  getTimes (value) {
    let values = []
    for (let i = 0; i < this.times.length; i++) {
      if (this.times[i].value === value) {
        break
      }
      values.push(this.times[i])
    }
    return values
  }

  handleChange = (date) => {
    this.setState({
      timesSelected: {
        ...this.state.timesSelected,
        startDate: date
      }
    })
  }

  render () {
    return (
      <div>
        Debe seleccionar su ciclo y periodos de negocio
        <Select
          label='Ciclo'
          name='cicle'
          value={this.state.timesSelected.cicle}
          optionValue='value'
          optionName='name'
          options={this.times}
          onChange={(name, value) => { this.selectChangeHandler(name, value) }}
        />
        <div className='field'>
          <label className='label'>Duración de ciclo</label>
          <div className='control'>
            <input className='input' type='text' placeholder='Text input'
              value={this.state.timesSelected.cicleDuration} />
          </div>
        </div>

        <Select
          label='Periodo'
          name='period'
          value={this.state.timesSelected.period}
          optionValue='value'
          optionName='name'
          options={this.getTimes(this.state.timesSelected.cicle)}
          onChange={(name, value) => { this.selectChangeHandler(name, value) }}
        />
        <div className='field'>
          <label className='label'>Duración de periodo</label>
          <div className='control'>
            <input className='input' type='text' placeholder='Text input'
              value={this.state.timesSelected.periodDuration} />
          </div>
        </div>

        <Select
          label='Temporada'
          name='season'
          value={this.state.timesSelected.season}
          optionValue='value'
          optionName='name'
          options={this.times}
          onChange={(name, value) => { this.selectChangeHandler(name, value) }}
        />
        <div className='field'>
          <label className='label'>Duración de temporada</label>
          <div className='control'>
            <input className='input' type='text' placeholder='Text input'
              value={this.state.timesSelected.seasonDuration} />
          </div>
        </div>

        <div className='field'>
          <label className='label'>Ciclos disponibles por temporada</label>
          <div className='control'>
            <input className='input' type='text' placeholder='Text input'
              value={this.state.timesSelected.ciclesAvailable} />
          </div>
        </div>

        <div className='field'>
          <label className='label'>Inicio del ciclo</label>
          <div className='control'>
            <DatePicker
              selected={this.state.timesSelected.startDate}
              onChange={this.handleChange}
            />
          </div>
        </div>

        <div className='control'>
          <label className='radio'>
            <input type='radio' name='takeStart' checked={this.state.timesSelected.takeStart}
            onChange={(e) => this.setState({
              timesSelected: {
                ...this.state.timesSelected,
                takeStart: true
              }
            })} />
              Tomar Inicio de periodo
          </label>
            <label className='radio'>
            <input type='radio' name='takeStart' checked={!this.state.timesSelected.takeStart}
              onChange={(e) => this.setState({
                timesSelected: {
                  ...this.state.timesSelected,
                  takeStart: false
                }
              })} />
               Tomar Final de periodo
          </label>
        </div>
        
        <br />
        <button onClick={() => this.props.nextStep(this.state.timesSelected)} className='button is-primary'>Continuar</button>
      </div>
    )
  }
}

export default Periods
