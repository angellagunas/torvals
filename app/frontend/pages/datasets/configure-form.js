import React, { Component } from 'react'
import api from '~base/api'
import Loader from '~base/components/spinner'
import lov from 'lov'

class ConfigureDatasetForm extends Component {
  constructor (props) {
    super(props)
    const posColumn = this.props.initialState.columns.findIndex(e => {
      return (
        e['isDate'] === true
      )
    })
    if (posColumn >= 0) {
      var checkProductName = this.props.initialState.columns.find((item) => { return item.isProductName })
      var checkSalesCenterName = this.props.initialState.columns.find((item) => { return item.isSalesCenterName })
      var checkChannelName = this.props.initialState.columns.find((item) => { return item.isChannelName })
      this.state = {
        formData: {
          columns: this.props.initialState.columns,
          groupings: this.props.initialState.groupings
        },
        isDate: this.props.initialState.columns.find((item) => { return item.isDate }).name,
        isAnalysis: this.props.initialState.columns.find((item) => { return item.isAnalysis }).name,
        isProduct: this.props.initialState.columns.find((item) => { return item.isProduct }).name,
        isProductName: checkProductName ? checkProductName.name : '',
        isSalesCenter: this.props.initialState.columns.find((item) => { return item.isSalesCenter }).name,
        isSalesCenterName: checkSalesCenterName ? checkSalesCenterName.name : '',
        isChannel: this.props.initialState.columns.find((item) => { return item.isChannel }).name,
        isChannelName: checkChannelName ? checkChannelName.name : '',
        apiCallMessage: 'is-hidden',
        apiCallErrorMessage: 'is-hidden'
      }
    } else {
      this.state = {
        formData: {
          columns: this.props.columns,
          groupings: []
        },
        isDate: '',
        isAnalysis: '',
        isProduct: '',
        isProductName: '',
        isSalesCenter: '',
        isSalesCenterName: '',
        isChannel: '',
        isChannelName: '',
        apiCallMessage: 'is-hidden',
        apiCallErrorMessage: 'is-hidden'
      }
    }
  }

  errorHandler (e) {}

  changeHandler ({formData}) {
    this.setState({
      formData,
      apiCallMessage: 'is-hidden',
      apiCallErrorMessage: 'is-hidden'
    })
  }

  handleChangeCheckbox (type, event) {
    const column = type.split('|')
    const valueColumn = event.currentTarget.checked
    var posColumn = this.state.formData.columns.findIndex(e => {
      return (
        String(e.name) === String(column[0])
      )
    })

    this.setState({
      ...this.state.formData.columns[posColumn][column[1]] = valueColumn
    })
  }

  async submitHandler (event) {
    event.preventDefault()
    const formData = {
      ...this.state.formData,
      isDate: this.state.isDate,
      isAnalysis: this.state.isAnalysis,
      isProduct: this.state.isProduct,
      isProductName: this.state.isProductName,
      isSalesCenter: this.state.isSalesCenter,
      isSalesCenterName: this.state.isSalesCenterName,
      isChannel: this.state.isChannel,
      isChannelName: this.state.isChannelName
    }

    const schema = {
      isDate: lov.string().trim().required(),
      isAnalysis: lov.string().trim().required(),
      isProduct: lov.string().trim().required(),
      isProductName: lov.string(),
      isSalesCenter: lov.string().trim().required(),
      isSalesCenterName: lov.string(),
      isChannel: lov.string().trim().required(),
      isChannelName: lov.string()
    }

    let values = {
      isDate: this.state.isDate,
      isAnalysis: this.state.isAnalysis,
      isProduct: this.state.isProduct,
      isProductName: this.state.isProductName,
      isSalesCenter: this.state.isSalesCenter,
      isSalesCenterName: this.state.isSalesCenterName,
      isChannel: this.state.isChannel,
      isChannelName: this.state.isChannelName
    }

    let result = lov.validate(values, schema)

    if (result.error === null) {
      try {
        var response = await api.post(this.props.url, formData)
        this.props.changeHandler(response.data)
      } catch (e) {
        return this.setState({
          ...this.state,
          error: e.message,
          apiCallErrorMessage: 'message is-danger'
        })
      }
    } else {
      return this.setState({
        ...this.state,
        error: result.error.message,
        apiCallErrorMessage: 'message is-danger'
      })
    }
  }

  handleColumnsValues (event) {
    if (!this.state.groupingColumn) {

    } else {
      this.setState({
        ...this.state.formData.groupings.push({
          column: this.state.groupingColumn,
          inputValue: this.state.groupingInput,
          outputValue: this.state.groupingOutput
        }),
        ...this.state.groupingColumn = '',
        ...this.state.groupingInput = '',
        ...this.state.groupingOutput = ''
      })
    }
    event.preventDefault()
  }

  handleChangeDateAnalyze (type, event) {
    const state = this.state
    const column = event.currentTarget.value
    var actualColumnIndex = state.formData.columns.findIndex(e => {
      return (
        String(e.name) === String(column)
      )
    })

    const previousColumn = state.formData.columns.find((item) => { return item[type] })

    if (previousColumn) {
      var posNameColumn = state.formData.columns.findIndex(e => {
        return (
          String(e.name) === String(previousColumn.name)
        )
      })
      state.formData.columns[posNameColumn][type] = false
    }

    if (actualColumnIndex >= 0) {
      state.formData.columns[actualColumnIndex][type] = true
      state[type] = state.formData.columns[actualColumnIndex].name
    } else {
      state[type] = ''
    }

    this.setState(state)
  }

  clearState () {
    this.setState({
      apiCallMessage: 'is-hidden',
      formData: this.props.initialState
    })
  }

  removeColumn (index) {
    this.setState({
      ...this.state.formData.groupings.splice(index, 1)
    })
  }

  getColumnForValue (type) {
    var posColumn = this.state.formData.columns.findIndex(e => {
      return (
        e[type] === true
      )
    })

    if (posColumn < 0) {
      return ''
    } else {
      return this.state.formData.columns[posColumn].name
    }
  }

  getValueForColumn (type) {
    const column = type.split('|')
    var posColumn = this.state.formData.columns.findIndex(e => {
      return (
        String(e.name) === String(column[0])
      )
    })

    if (posColumn < 0) {
      return false
    } else {
      return this.state.formData.columns[posColumn][column[1]]
    }
  }

  render () {
    let checkboxLabelwidth = { flexGrow: 4 }

    if (this.props.columns.length === 0) {
      return <Loader />
    }

    return (
      <div>
        <form onSubmit={(e) => { this.submitHandler(e) }}>
          <div className='field'>
            <label className='label'>Fecha*</label>
            <div className='control'>
              <div className='select is-fullwidth'>
                <select type='text'
                  name='isDate'
                  value={this.state.isDate}
                  onChange={(e) => { this.handleChangeDateAnalyze('isDate', e) }}
                >
                  <option value=''>Selecciona una opción</option>
                  {
                    this.state.formData.columns.map(function (item, key) {
                      return <option key={key}
                        value={item.name}>{item.name}</option>
                    })
                  }
                </select>
              </div>
            </div>
          </div>

          <div className='field'>
            <label className='label'>Análisis*</label>
            <div className='control'>
              <div className='select is-fullwidth'>
                <select type='text'
                  name='isAnalysis'
                  value={this.state.isAnalysis}
                  onChange={(e) => { this.handleChangeDateAnalyze('isAnalysis', e) }}
                >
                  <option value=''>Selecciona una opción</option>
                  {
                    this.state.formData.columns.map(function (item, key) {
                      return <option key={key}
                        value={item.name}>{item.name}</option>
                    })
                  }
                </select>
              </div>
            </div>
          </div>

          <div className='columns'>
            <div className='column'>
              <div className='field'>
                <label className='label'>Producto*</label>
                <div className='control'>
                  <div className='select is-fullwidth'>
                    <select type='text'
                      className='is-fullwidth'
                      name='isProduct'
                      value={this.state.isProduct}
                      onChange={(e) => { this.handleChangeDateAnalyze('isProduct', e) }}>
                      <option value=''>Selecciona una opción</option>
                      {
                        this.state.formData.columns.map(function (item, key) {
                          return <option key={key}
                            value={item.name}>{item.name}</option>
                        })
                      }
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className='column'>
              <div className='field'>
                <label className='label'>Producto Nombre*</label>
                <div className='control'>
                  <div className='select is-fullwidth'>
                    <select type='text'
                      className='is-fullwidth'
                      name='isProductName'
                      value={this.state.isProductName}
                      onChange={(e) => { this.handleChangeDateAnalyze('isProductName', e) }}>
                      <option value=''>Selecciona una opción</option>
                      {
                        this.state.formData.columns.map(function (item, key) {
                          return <option key={key}
                            value={item.name}>{item.name}</option>
                        })
                      }
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className='columns'>
            <div className='column'>
              <div className='field'>
                <label className='label'>Centro de venta*</label>
                <div className='control'>
                  <div className='select is-fullwidth'>
                    <select type='text'
                      className='is-fullwidth'
                      name='isSalesCenter'
                      value={this.state.isSalesCenter}
                      onChange={(e) => { this.handleChangeDateAnalyze('isSalesCenter', e) }}>
                      <option value=''>Selecciona una opción</option>
                      {
                        this.state.formData.columns.map(function (item, key) {
                          return <option key={key}
                            value={item.name}>{item.name}</option>
                        })
                      }
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className='column'>
              <div className='field'>
                <label className='label'>Centro de venta Nombre*</label>
                <div className='control'>
                  <div className='select is-fullwidth'>
                    <select type='text'
                      className='is-fullwidth'
                      name='isSalesCenterName'
                      value={this.state.isSalesCenterName}
                      onChange={(e) => { this.handleChangeDateAnalyze('isSalesCenterName', e) }}>
                      <option value=''>Selecciona una opción</option>
                      {
                        this.state.formData.columns.map(function (item, key) {
                          return <option key={key}
                            value={item.name}>{item.name}</option>
                        })
                      }
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className='columns'>
            <div className='column'>
              <div className='field'>
                <label className='label'>Canal*</label>
                <div className='control'>
                  <div className='select is-fullwidth'>
                    <select type='text'
                      className='is-fullwidth'
                      name='isChannel'
                      value={this.state.isChannel}
                      onChange={(e) => { this.handleChangeDateAnalyze('isChannel', e) }}>
                      <option value=''>Selecciona una opción</option>
                      {
                        this.state.formData.columns.map(function (item, key) {
                          return <option key={key}
                            value={item.name}>{item.name}</option>
                        })
                      }
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className='column'>
              <div className='field'>
                <label className='label'>Canal Nombre*</label>
                <div className='control'>
                  <div className='select is-fullwidth'>
                    <select type='text'
                      className='is-fullwidth'
                      name='isChannelName'
                      value={this.state.isChannelName}
                      onChange={(e) => { this.handleChangeDateAnalyze('isChannelName', e) }}>
                      <option value=''>Selecciona una opción</option>
                      {
                        this.state.formData.columns.map(function (item, key) {
                          return <option key={key}
                            value={item.name}>{item.name}</option>
                        })
                      }
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className='field is-horizontal'>
            <div className='field-label is-normal' style={checkboxLabelwidth}>
              <label className='label' />
            </div>
            <div className='field-body'>
              <div className='field'>
                <div className='field-label has-text-centered'>
                  <label className=''>
                    Filtro de Operación
                  </label>
                </div>
              </div>
              <div className='field'>
                <div className='field-label has-text-centered'>
                  <label className=''>
                    Filtro de Análisis
                  </label>
                </div>
              </div>
            </div>
          </div>

          {
          this.state.formData.columns.map((item, key) => {
            return (
              <div key={key} className='field is-horizontal'>
                <div className='field-label is-normal has-text-left' style={checkboxLabelwidth}>
                  <label className='label'>{item.name}</label>
                </div>
                <div className='field-body'>
                  <div className='field'>
                    <div className='control box has-text-centered'>
                      <label className='checkbox'>
                        <input type='checkbox' checked={this.getValueForColumn(item.name + '|isOperationFilter')} onChange={(e) => { this.handleChangeCheckbox(item.name + '|isOperationFilter', e) }} />
                      </label>
                    </div>
                  </div>
                  <div className='field'>
                    <div className='control box has-text-centered'>
                      <label className='checkbox'>
                        <input checked={this.getValueForColumn(item.name + '|isAnalysisFilter')} onChange={(e) => { this.handleChangeCheckbox(item.name + '|isAnalysisFilter', e) }} type='checkbox' />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
          }

          <div className='field is-horizontal'>
            <div className='field-body'>
              <div className='field is-narrow'>
                <div className='control'>
                  <div className='select is-fullwidth'>
                    <select onChange={(e) => { this.handleChange('groupingColumn', e) }}>
                      <option value='' >Selecciona una opción</option>
                      {
                    this.state.formData.columns.map((item, key) => {
                      return <option key={key}
                        value={item.name}>{item.name}</option>
                    })
                  }
                    </select>
                  </div>
                </div>
              </div>
              <div className='field'>
                <p className='control is-expanded'>
                  <input className='input' type='text' value={this.state.groupingInput} onChange={(e) => { this.handleChange('groupingInput', e) }} />
                </p>
              </div>
              <div className='field'>
                <p className='control is-expanded'>
                  <input className='input' type='text' value={this.state.groupingOutput} onChange={(e) => { this.handleChange('groupingOutput', e) }} />
                </p>
              </div>
              <div className='field'>
                <p className='control is-expanded'>
                  <button className='button is-primary' onClick={(e) => this.handleColumnsValues(e)} type='button'>Add</button>
                </p>
              </div>
            </div>
          </div>

          <table className='table is-fullwidth'>
            <thead>
              <tr>
                <th>Columna</th>
                <th>Valor 1</th>
                <th>Valor 2</th>
              </tr>
            </thead>
            <tbody>
              {this.state.formData.groupings.length === 0 ? (
                <tr>
                  <td colSpan='3'>No hay agrupaciones que mostrar</td>
                </tr>
                ) : (
                  this.state.formData.groupings.map((item, key) => {
                    return (
                      <tr key={key}>
                        <td>{item.column}</td>
                        <td>{item.inputValue}</td>
                        <td>{item.outputValue}</td>
                        <td>
                          <button
                            className='button is-danger'
                            type='button'
                            onClick={() => this.removeColumn(key)}
                          >
                            <i className='fa fa-times' aria-hidden='true' />
                          </button>
                        </td>
                      </tr>
                    )
                  })

                )}
            </tbody>
          </table>

          <div className={this.state.apiCallMessage}>
            <div className='message-body is-size-7 has-text-centered'>
              Se ha configurado al Dataset correctamente
            </div>
          </div>
          <div className={this.state.apiCallErrorMessage}>
            <div className='message-body is-size-7 has-text-centered'>
              {this.state.error}
            </div>
          </div>

          <div className='field is-grouped'>
            <div className='control'>
              <button className='button is-primary'>Configurar</button>
            </div>
          </div>
        </form>

      </div>

    )
  }
}

export default ConfigureDatasetForm
