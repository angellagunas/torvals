import React, { Component } from 'react'

class Ranges extends Component {
  constructor (props) {
    super(props)
    this.state = {
      ranges: this.props.rules.ranges || Array.apply(null, { length: this.props.rules.ciclesAvailable }).map(function () { return 0 })
    }
  }

  componentWillMount () {
    if (this.props.rules.ranges && this.props.rules.ranges.length !== Number(this.props.rules.ciclesAvailable)) {
      this.setState({
        ranges: Array.apply(null, { length: this.props.rules.ciclesAvailable }).map(function () { return 0 })
      })
    } else {
      this.setState({
        ranges: this.props.rules.ranges || Array.apply(null, { length: this.props.rules.ciclesAvailable }).map(function () { return 0 })
      })
    }
  }

  handleInputChange (index, value) {
    let ranges = this.state.ranges
    ranges[index] = value
    this.setState({
      ranges: ranges
    })
  }

  createInputs () {
    let inputs = []

    for (let i = 0; i < this.props.rules.ciclesAvailable; i++) {
      inputs.push(
        <div className='field' key={i}>
          <label className='label'>Ciclo {i + 1}</label>
          <div className='control'>
            <input className='input' type='text' placeholder='Text input'
              value={this.state.ranges[i]}
              onChange={(e) => { this.handleInputChange(i, e.target.value) }} />
          </div>
        </div>
      )
    }

    return inputs
  }
  render () {
    let rules = this.props.rules
    return (
      <div>
        Debe asignar el porcentaje de ajuste de cada ciclo disponible.
        0 - No permitido, -1 - Ilimitado
        <br />
        {rules && rules.ciclesAvailable &&
          this.createInputs()
        }
        <br />
        <button onClick={() => this.props.nextStep({ranges: this.state.ranges})} className='button is-primary'>Continuar</button>
      </div>
    )
  }
}

export default Ranges
