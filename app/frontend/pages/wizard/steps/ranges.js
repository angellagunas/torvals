import React, { Component, Fragment } from 'react'
import { FormattedMessage } from 'react-intl'

function DangerText() {
  return (
    <p className='has-text-danger'>
      * <FormattedMessage
        id='wizard.rangesWarningMsg'
        defaultMessage={`En el ciclo actual no se permite realizar ajustes`}
      />
    </p>
  )
}

class Ranges extends Component {
  constructor (props) {
    super(props)
    this.state = {
      ranges: Array.from(this.props.rules.ranges) || Array.apply(null, { length: this.props.rules.cyclesAvailable }).map(function () { return 0 }),
      rangesLvl2: this.props.rules.rangesLvl2
      ? Array.from(this.props.rules.rangesLvl2) : Array.apply(null, { length: this.props.rules.cyclesAvailable }).map(function () { return 0 })
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
    if (this.props.rules.rangesLvl2 && this.props.rules.rangesLvl2.length !== Number(this.props.rules.cyclesAvailable)) {
      this.setState({
        rangesLvl2: Array.apply(null, { length: this.props.rules.cyclesAvailable }).map(function () { return 0 })
      })
    } else {
      this.setState({
        rangesLvl2: this.props.rules.rangesLvl2
          ? Array.from(this.props.rules.rangesLvl2) : Array.apply(null, { length: this.props.rules.cyclesAvailable }).map(function () { return 0 })
      })
    }
  }

  handleInputChange (index, value, role) {
    let ranges
    if (value === '') {
      value = null
    } else {
      value = Number(value.replace(/\D/, ''))
    }

    if (!role) {
      ranges = this.state.ranges
      ranges[index] = value
      this.setState({
        ranges: ranges
      })
    } else {
      ranges = this.state.rangesLvl2
      ranges[index] = value
      this.setState({
        rangesLvl2: ranges
      })
    }
  }

  createInputs (role) {
    let inputs = []

    for (let i = 0; i < this.props.rules.cyclesAvailable; i++) {
      if (!role) {
        inputs.push(
          <div className='field has-addons' key={i}>
            <p className='control'>
              <a className='button is-capitalized'>
                <FormattedMessage
                  id='wizard.rangesCycle'
                  defaultMessage={`Ciclo`}
                />&nbsp; {i + 1} {i === 0 && <Fragment><FormattedMessage
                  id='wizard.rangesActual'
                  defaultMessage={`(Actual)`}
                /> <span className='has-text-danger'>*</span></Fragment>}
              </a>
            </p>
            <p className='control'>
              <input className='input' type='text' placeholder='Ilimitado'
                value={i === 0 ? 0 : this.state.ranges[i]}
                onChange={(e) => { this.handleInputChange(i, e.target.value) }}
                disabled={i === 0}
              />
            </p>
            <p className='control'>
              <a className='button is-static'>
                % &nbsp; <FormattedMessage
                  id='wizard.rangesPercentage'
                  defaultMessage={`de ajuste`}
                />
              </a>
            </p>
          </div>
      )
      } else {
        inputs.push(
          <div className='field has-addons' key={i}>
            <p className='control'>
              <a className='button is-capitalized'>
                <FormattedMessage
                  id='wizard.rangesCycle'
                  defaultMessage={`Ciclo`}
                />&nbsp; {i + 1} {i === 0 && <Fragment><FormattedMessage
                  id='wizard.rangesActual'
                  defaultMessage={`(Actual)`}
                /> <span className='has-text-danger'>*</span></Fragment>}
              </a>
            </p>
            <p className='control'>
              <input className='input' type='text' placeholder='Ilimitado'
                value={i === 0 ? 0 : this.state.rangesLvl2[i]}
                onChange={(e) => { this.handleInputChange(i, e.target.value, role) }}
                disabled={i === 0} />
            </p>
            <p className='control'>
              <a className='button is-static'>
                % &nbsp;<FormattedMessage
                  id='wizard.rangesPercentage'
                  defaultMessage={`de ajuste`}
                />
              </a>
            </p>
          </div>
        )
      }
    }

    return inputs
  }

  next () {
    if (this.props.org && !this.props.org.isConfigured &&
      this.props.completed && this.props.completed.length < 4) {
      this.props.nextStep({ ranges: this.state.ranges, rangesLvl2: this.state.rangesLvl2 }, 4)
    } else {
      this.props.nextStep({ ranges: this.state.ranges, rangesLvl2: this.state.rangesLvl2 }, 1)
    }
  }

  render () {
    let rules = this.props.rules
    return (
      <div className='section pad-sides has-20-margin-top'>
        <h1 className='title is-5'>
          <FormattedMessage
            id='wizard.rangesAdjustment'
            defaultMessage={`Rangos de ajuste`}
          />
        </h1>
        <p className='subtitle is-6'>
          <FormattedMessage
            id='wizard.rangesDescription1'
            defaultMessage={`Asigna el porcentaje de ajuste para cada ciclo disponible.`}
          /> <br />
          <FormattedMessage
            id='wizard.rangesDescription2'
            defaultMessage={`Si ingresas "0" no se permitirá ajustar en ese ciclo, mientras que si dejas vacío no habrá límite de ajuste.`}
          />
        </p>
        <div className='columns is-centered'>
          <div className='column'>
            <div className='card'>
              <header className='card-header'>
                <p className='card-header-title'>
                  <FormattedMessage
                    id='wizard.rangesManager1'
                    defaultMessage={`Ajustes para Manager Level 1`}
                  />
                </p>
              </header>
              <div className='card-content'>
                {rules && rules.cyclesAvailable &&
                  this.createInputs()
                }
                <DangerText />
              </div>
            </div>
          </div>

          <div className='column'>
            <div className='card'>
              <header className='card-header'>
                <p className='card-header-title'>
                  <FormattedMessage
                    id='wizard.rangesManager2'
                    defaultMessage={`Ajustes para Manager Level 2`}
                  />
                </p>
              </header>
              <div className='card-content'>
                {rules && rules.cyclesAvailable &&
                  this.createInputs('lvl2')
                }
                <DangerText />
              </div>
            </div>
          </div>
        </div>

        <div className='buttons wizard-steps'>
          {this.props.org && !this.props.org.isConfigured &&
            this.props.completed && this.props.completed.length < 4
            ? <button onClick={() => this.props.setStep(2)} className='button is-primary'>
              <FormattedMessage
                id='wizard.btnPrev'
                defaultMessage={`Atrás`}
              />
            </button>
            : <button onClick={() => this.props.setStep(1)} className='button is-danger'>
              <FormattedMessage
                id='wizard.rangesBtnCancel'
                defaultMessage={`Cancelar`}
              />
            </button>
          }
          <button
            onClick={() => this.next()}
            className='button is-primary'>
            {this.props.org && !this.props.org.isConfigured &&
              this.props.completed && this.props.completed.length < 4
              ? <FormattedMessage
                id='wizard.rangesBtnNext'
                defaultMessage={`Siguente`}
              />
              : <FormattedMessage
                id='wizard.rangesBtnSave'
                defaultMessage={`Guardar`}
              />
            }
          </button>
        </div>

      </div>
    )
  }
}

export default Ranges
