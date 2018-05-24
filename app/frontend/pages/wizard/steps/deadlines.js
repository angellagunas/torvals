import React, { Component } from 'react'

class DeadLines extends Component {
  constructor (props) {
    super(props)
    this.state = {
      data: {
        sales_upload: 0,
        forecast_creation: 0,
        range_adjustment: 0,
        range_adjustmentRequest: 0,
        consolidation: 0
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
      <div>
        Debes definir el fechas para el ciclo de operación a partir de la fecha de inicio.
        <br />

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
                    value={this.state[item.name]}
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
        <br />

        <button onClick={() => this.props.nextStep({ ...this.state.data })} className='button is-primary'>Continuar</button>
      </div>
    )
  }
}

export default DeadLines
