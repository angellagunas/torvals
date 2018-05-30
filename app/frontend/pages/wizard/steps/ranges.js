import React, { Component } from 'react'

class Ranges extends Component {
  constructor (props) {
    super(props)
    this.state = {
      ranges: Array.from(this.props.rules.ranges) || Array.apply(null, { length: this.props.rules.cyclesAvailable }).map(function () { return 0 })
    }
  }

  componentWillMount () {
    if (this.props.rules.ranges && this.props.rules.ranges.length !== Number(this.props.rules.cyclesAvailable)) {
      this.setState({
        ranges: Array.apply(null, { length: this.props.rules.cyclesAvailable }).map(function () { return 0 })
      })
    } else {
      this.setState({
        ranges: Array.from(this.props.rules.ranges) || Array.apply(null, { length: this.props.rules.cyclesAvailable }).map(function () { return 0 })
      })
    }
  }

  handleInputChange (index, value) {
    let ranges = this.state.ranges
    value = value.replace(/\D/, '')
    ranges[index] = value
    this.setState({
      ranges: ranges
    })
  }

  createInputs () {
    let inputs = []

    for (let i = 0; i < this.props.rules.cyclesAvailable; i++) {
      inputs.push(
        <div className='field has-addons' key={i}>
          <p className='control'>
            <a className='button is-capitalized'>
              Ciclo {i + 1} {i === 0 && '(Actual)'}
            </a>
          </p>
          <p className='control'>
            <input className='input' type='text' placeholder='Ilimitado'
              value={i === 0 ? 0 : this.state.ranges[i]}
              onChange={(e) => { this.handleInputChange(i, e.target.value) }}
              disabled={i === 0} />
          </p>
          <p className='control'>
            <a className='button is-static'>
              % de ajuste
            </a>
          </p>
        </div>
      )
    }

    return inputs
  }
  render () {
    let rules = this.props.rules
    return (
      <div className='section pad-sides has-20-margin-top'>
        <h1 className='title is-5'> Rangos de ajuste</h1>
        <p className='subtitle is-6'>Asigna el porcentaje de ajuste para cada ciclo disponible.</p>
        <div className='columns is-centered'>
          <div className='column is-6'>
            <div className='card'>
              <header className='card-header'>
                <p className='card-header-title'>
                  Ingresa tu ajuste
                </p>
              </header>
              <div className='card-content'>
                {rules && rules.cyclesAvailable &&
                  this.createInputs()
                }
              </div>
            </div>
          </div>

          <div className='column'>
            <p className='has-text-danger'>
              * En el ciclo actual no se permite realizar ajustes
            </p>
            <p>
              0  No permitido <br /> Dejar en blanco para ajuste Ilimitado
            </p>
          </div>

        </div>

        <center>
          <button onClick={() => this.props.nextStep({ ranges: this.state.ranges })} className='button is-primary'>Siguiente</button>
        </center>

      </div>
    )
  }
}

export default Ranges
