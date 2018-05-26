import React, { Component } from 'react'
import CalendarRules from './calendar-rules'
import moment from 'moment'
class DeadLines extends Component {
  constructor (props) {
    super(props)
    this.state = {
      data: {
        sales_upload: this.props.rules.sales_upload || 0,
        forecast_creation: this.props.rules.forecast_creation || 0,
        range_adjustment: this.props.rules.range_adjustment || 0,
        range_adjustmentRequest: this.props.rules.range_adjustmentRequest || 0,
        consolidation: this.props.rules.consolidation || 0
      }
    }
  }

  handleInputChange (name, value) {
    let aux = this.state.data
    aux[name] = value

    this.setState({
      data: aux
    })
  }

  render () {
    const deadlines = [
      {
        title: 'ventas',
        name: 'sales_upload'
      },
      {
        title: 'forecast',
        name: 'forecast_creation'
      },
      {
        title: 'ajustes',
        name: 'range_adjustment'
      },
      {
        title: 'aprobar',
        name: 'range_adjustmentRequest'
      },
      {
        title: 'consolidar',
        name: 'consolidation'
      }
    ]

    return (
      <div className='section'>

        <h1 className='title is-4'> Debes definir el fechas para el ciclo de operación a partir de la fecha de inicio.</h1>

        <br />
        <div className='columns'>
          <div className='column'>
            {
              deadlines.map((item) => {
                return (
                  <div className='field has-addons' key={item.name}>
                    <p className='control'>
                      <a className='button is-capitalized'>
                        {item.title}
                      </a>
                    </p>
                    <p className='control'>
                      <input className='input' type='text' placeholder='dias' name={item.name}
                        value={this.state.data[item.name]}
                        onChange={(e) => { this.handleInputChange(e.target.name, e.target.value) }}
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
          <div className='column'>
            <CalendarRules
              disabled
              date={moment(this.props.startDate)}
              limits={this.state.data}
              />
          </div>
        </div>

        <br />

        <button onClick={() => this.props.nextStep({ ...this.state.data })} className='button is-primary is-pulled-right'>Continuar</button>
      </div>
    )
  }
}

export default DeadLines
