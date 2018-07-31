import React, { Component } from 'react'
import { FormattedMessage } from 'react-intl'
import api from '~base/api'
import Loader from '~base/components/spinner'
import lov from 'lov'
import s from 'underscore.string'

class ConfigureDatasetForm extends Component {
  constructor (props) {
    super(props)

    this.getValue = this.getValue.bind(this)
    const posColumn = this.props.initialState.columns.findIndex(e => {
      return (
        e['isDate'] === true
      )
    })
    if (posColumn >= 0) {
      var checkIsAdjustment = this.props.initialState.columns.find((item) => {
        return item.isAdjustment
      })
      var checkIsPrediction = this.props.initialState.columns.find((item) => {
        return item.isPrediction
      })
      var checkSales = this.props.initialState.columns.find((item) => {
        return item.isSales
      })

      this.state = {
        dataset: this.props.initialState,
        rules: this.props.initialState.rule,
        formData: {
          columns: this.props.initialState.columns,
          groupings: this.props.initialState.groupings
        },
        isDate: this.props.initialState.columns.find((item) => {
          return item.isDate
        }).name,
        isAnalysis: this.props.initialState.columns.find((item) => {
          return item.isAnalysis
        }).name,
        isPrediction: checkIsPrediction ? checkIsPrediction.name : '',
        isAdjustment: checkIsAdjustment ? checkIsAdjustment.name : '',
        isSales: checkSales ? checkSales.name : '',
        apiCallMessage: 'is-hidden',
        apiCallErrorMessage: 'is-hidden',
        groupingColumn: '',
        groupingInput: '',
        groupingOutput: '',
        isLoading: '',
        catalogsColumns: [],
        errors: {}
      }
    } else {
      this.state = {
        dataset: this.props.initialState,
        rules: this.props.initialState.rule,
        formData: {
          columns: this.props.columns,
          groupings: []
        },
        isDate: '',
        isAnalysis: '',
        isAdjustment: '',
        isPrediction: '',
        isSales: '',
        groupingColumn: '',
        groupingInput: '',
        groupingOutput: '',
        apiCallMessage: 'is-hidden',
        apiCallErrorMessage: 'is-hidden',
        isLoading: '',
        catalogColumns: [],
        errors: {}
      }
    }
  }

  componentWillMount () {
    this.getCatalogColumns()
  }

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
    const formData = this.state.formData
    var posColumn = this.state.formData.columns.findIndex(e => {
      return (
        String(e.name) === String(column[0])
      )
    })

    formData.columns[posColumn][column[1]] = valueColumn
    this.setState({
      formData: formData
    })
  }

  handleChangeGroupings (type, event) {
    const value = event.currentTarget.value

    this.setState({
      [type]: value
    })
  }

  handleColumnsValues (event) {
    if (!this.state.groupingColumn) {

    } else {
      const formData = this.state.formData
      formData.groupings.push({
        column: this.state.groupingColumn,
        inputValue: this.state.groupingInput,
        outputValue: this.state.groupingOutput
      })

      this.setState({
        formData: formData,
        groupingColumn: '',
        groupingInput: '',
        groupingOutput: ''
      })
    }
    event.preventDefault()
  }

  handleChangeSelect (type, event) {
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

  getValue (type) {
    let item = this.state.formData.columns.find((item) => { return item[type] })

    if (!item) return ''

    return item.name
  }

  clearState () {
    this.setState({
      apiCallMessage: 'is-hidden',
      formData: this.props.initialState
    })
  }

  removeColumn (index) {
    const formData = this.state.formData
    formData.groupings.splice(index, 1)

    this.setState({
      formData: formData
    })
  }

  testAllConditions (column) {
    for (let key of Object.keys(column)) {
      if (key === 'name' || key === '_id') continue
      if (column[key]) return true
    }

    return false
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

  getCatalogColumns () {
    let cols = []
    let rules = this.state.rules

    for (let col of rules.catalogs) {
      if (col.slug === 'precio') continue
      cols.push({
        id: {
          label: `${col.name} Id *`,
          name: `is_${col.slug}_id`
        },
        name: {
          label: `${col.name} Nombre`,
          name: `is_${col.slug}_name`
        }
      })
    }

    this.setState({catalogColumns: cols})
  }

  async submitHandler (event) {
    event.preventDefault()
    this.setState({isLoading: ' is-loading'})
    let rules = this.state.rules

    const formData = {
      ...this.state.formData,
      isDate: this.getValue('isDate'),
      isAnalysis: this.getValue('isAnalysis')
    }

    const schema = {
      isDate: true,
      isAnalysis: true
    }

    let values = {
      isDate: this.getValue('isDate'),
      isAnalysis: this.getValue('isAnalysis')
    }

    for (let col of rules.catalogs) {
      if (col.slug === 'precio') continue
      let idStr = `is_${col.slug}_id`
      let nameStr = `is_${col.slug}_name`
      schema[idStr] = true

      values[idStr] = this.getValue(idStr)
    }

    for (let key of Object.keys(schema)) {
      if (!values[key] || typeof values[key] !== 'string' || values[key].trim() === '') {
        this.setState({isLoading: ''})
        //TODO: translate
        return this.setState({
          error: `¡Ha habido errores al procesar el formulario!`,
          apiCallErrorMessage: 'message is-danger',
          errors: {
            [key]: '¡Valor requerido!'
          }
        })
      }
    }

    try {
      var response = await api.post(this.props.url, formData)
      this.props.changeHandler(response.data)
      this.setState({isLoading: ''})
    } catch (e) {
      this.setState({isLoading: ''})
      return this.setState({
        error: e.message,
        apiCallErrorMessage: 'message is-danger'
      })
    }
  }

  render () {
    if (this.props.columns.length === 0) {
      return <Loader />
    }

    return (
      <div className='configure-dataset'>
        <form onSubmit={(e) => { this.submitHandler(e) }}>
          <div className='columns'>
            <div className='column'>
              <div className='field'>
                <label className='label'>
                  <FormattedMessage
                    id="datasets.date"
                    defaultMessage={`Fecha`}
                  /> *
                </label>
                <div className='control'>
                  <div className='select is-fullwidth'>
                    <select type='text'
                      name='isDate'
                      value={this.state.isDate}
                      className={this.state.errors['isDate'] ? 'is-fullwidth select-is-danger' : 'is-fullwidth'}
                      onChange={(e) => { this.handleChangeSelect('isDate', e) }}
                    >
                      <option value=''>
                        <FormattedMessage
                          id="datasets.selectOption"
                          defaultMessage={`Selecciona una opción`}
                        />
                      </option>
                      {
                        this.state.formData.columns.map(function (item, key) {
                          return <option key={key}
                            value={item.name}>{item.name}</option>
                        })
                      }
                    </select>
                  </div>
                </div>
                { this.state.errors['isDate'] &&
                  <p className='help is-danger'>{this.state.errors['isDate']}</p>
                }
              </div>
            </div>
            <div className='column'>

              <div className='field'>
                <label className='label'>
                  <FormattedMessage
                    id="datasets.analysis"
                    defaultMessage={`Análisis`}
                  /> *
                </label>
                <div className='control'>
                  <div className='select is-fullwidth'>
                    <select type='text'
                      name='isAnalysis'
                      value={this.state.isAnalysis}
                      className={this.state.errors['isAnalysis'] ? 'is-fullwidth select-is-danger' : 'is-fullwidth'}
                      onChange={(e) => { this.handleChangeSelect('isAnalysis', e) }}
                    >
                      <option value=''>
                        <FormattedMessage
                          id="datasets.selectOption"
                          defaultMessage={`Selecciona una opción`}
                        />
                      </option>
                      {
                        this.state.formData.columns.map(function (item, key) {
                          return <option key={key}
                            value={item.name}>{item.name}</option>
                        })
                      }
                    </select>
                  </div>
                </div>
                { this.state.errors['isAnalysis'] &&
                  <p className='help is-danger'>{this.state.errors['isAnalysis']}</p>
                }
              </div>
            </div>
          </div>

          <div className='columns'>
            <div className='column'>
              <div className='field'>
                <label className='label'>
                  <FormattedMessage
                    id="datasets.adjustment"
                    defaultMessage={`Ajuste`}
                  />
                </label>
                <div className='control'>
                  <div className='select is-fullwidth'>
                    <select type='text'
                      className='is-fullwidth'
                      name='isAdjustment'
                      value={this.state.isAdjustment}
                      onChange={(e) => { this.handleChangeSelect('isAdjustment', e) }}>
                      <option value=''>
                        <FormattedMessage
                          id="datasets.selectOption"
                          defaultMessage={`Selecciona una opción`}
                        />
                      </option>
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
                <label className='label'>
                  <FormattedMessage
                    id="datasets.prediction"
                    defaultMessage={`Predicción`}
                  />
                </label>
                <div className='control'>
                  <div className='select is-fullwidth'>
                    <select type='text'
                      className='is-fullwidth'
                      name='isPrediction'
                      value={this.state.isPrediction}
                      onChange={(e) => { this.handleChangeSelect('isPrediction', e) }}>
                      <option value=''>
                        <FormattedMessage
                          id="datasets.selectOption"
                          defaultMessage={`Selecciona una opción`}
                        />
                      </option>
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
          <div className='field'>
            <label className='label'>
              <FormattedMessage
                id="datasets.sale"
                defaultMessage={`Venta`}
              />
            </label>
            <div className='control'>
              <div className='select is-fullwidth'>
                <select type='text'
                  className='is-fullwidth'
                  name='isSales'
                  value={this.state.isSales}
                  onChange={(e) => { this.handleChangeSelect('isSales', e) }}>
                  <option value=''>
                    <FormattedMessage
                      id="datasets.selectOption"
                      defaultMessage={`Selecciona una opción`}
                    />
                  </option>
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

          {this.state.catalogColumns.map((item, index) => {
            return (
              <div className='columns' key={index}>
                <div className='column'>
                  <div className='field'>
                    <label className='label'>{item.id.label}</label>
                    <div className='control'>
                      <div className='select is-fullwidth'>
                        <select type='text'
                          className={this.state.errors[item.id.name] ? 'is-fullwidth select-is-danger' : 'is-fullwidth'}
                          name={item.id.name}
                          value={this.getValue(item.id.name)}
                          onChange={(e) => { this.handleChangeSelect(item.id.name, e) }}>
                          <option value=''>
                            <FormattedMessage
                              id="datasets.selectOption"
                              defaultMessage={`Selecciona una opción`}
                            />
                          </option>
                          {
                            this.state.formData.columns.map(function (item, key) {
                              return <option key={key}
                                value={item.name}>{item.name}</option>
                            })
                          }
                        </select>
                      </div>
                    </div>
                    { this.state.errors[item.id.name] &&
                      <p className='help is-danger'>{this.state.errors[item.id.name]}</p>
                    }
                  </div>
                </div>

                <div className='column'>
                  <div className='field'>
                    <label className='label'>{item.name.label}</label>
                    <div className='control'>
                      <div className='select is-fullwidth'>
                        <select type='text'
                          className='is-fullwidth'
                          name={item.name.name}
                          value={this.getValue(item.name.name)}
                          onChange={(e) => { this.handleChangeSelect(item.name.name, e) }}>
                          <option value=''>
                            <FormattedMessage
                              id="datasets.selectOption"
                              defaultMessage={`Selecciona una opción`}
                            />
                          </option>
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
            )
          })}

          <div className='columns has-borders'>
            <div className='column is-6' />
            <div className='column is-3 has-text-centered'>
              <label className='label'>
                <FormattedMessage
                  id="datasets.operationFilter"
                  defaultMessage={`Filtro de Operación`}
                />
              </label>
            </div>
            <div className='column is-3 has-text-centered'>
              <label className='label'>
                <FormattedMessage
                  id="datasets.analysisFilter"
                  defaultMessage={`Filtro de Análisis`}
                />
              </label>
            </div>
          </div>

          {
          this.state.formData.columns.map((item, key) => {
            if (this.testAllConditions(item)) return null

            return (
              <div key={key} className='columns has-borders'>
                <div className='column is-6'>
                  <label className='label is-capitalized'>{item.name}</label>
                </div>
                <div className='column is-3 has-text-centered'>
                  <label className='checkbox'>
                    <input
                      type='checkbox'
                      checked={this.getValueForColumn(item.name + '|isOperationFilter')}
                      onChange={(e) => { this.handleChangeCheckbox(item.name + '|isOperationFilter', e) }}
                    />
                  </label>
                </div>
                <div className='column is-3 has-text-centered'>
                  <label className='checkbox'>
                    <input
                      checked={this.getValueForColumn(item.name + '|isAnalysisFilter')}
                      onChange={(e) => { this.handleChangeCheckbox(item.name + '|isAnalysisFilter', e) }}
                      type='checkbox'
                    />
                  </label>
                </div>
              </div>

            )
          })
          }

          <div className='field is-horizontal has-20-margin-top'>
            <div className='field-body'>
              <div className='field is-narrow'>
                <div className='control'>
                  <div className='select is-fullwidth'>
                    <select onChange={(e) => { this.handleChangeGroupings('groupingColumn', e) }}>
                      <option value='' >
                        <FormattedMessage
                          id="datasets.selectOption"
                          defaultMessage={`Selecciona una opción`}
                        />
                      </option>
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
                <p className='control is-expanded'>
                  <input
                    className='input'
                    type='text'
                    value={this.state.groupingInput}
                    onChange={(e) => { this.handleChangeGroupings('groupingInput', e) }}
                  />
                </p>
              </div>
              <div className='field'>
                <p className='control is-expanded'>
                  <input
                    className='input'
                    type='text'
                    value={this.state.groupingOutput}
                    onChange={(e) => { this.handleChangeGroupings('groupingOutput', e) }}
                  />
                </p>
              </div>
              <div className='field'>
                <p className='control'>
                  <button
                    className='button is-light'
                    onClick={(e) => this.handleColumnsValues(e)}
                    type='button'
                  >
                    <FormattedMessage
                      id="datasets.btnAdd"
                      defaultMessage={`Agregar`}
                    />
                  </button>
                </p>
              </div>
            </div>
          </div>

          <table className='table is-fullwidth is-narrow'>
            <thead>
              <tr>
                <th>
                  <FormattedMessage
                    id="datasets.column"
                    defaultMessage={`Columna`}
                  />
                </th>
                <th>
                  <FormattedMessage
                    id="datasets.value1"
                    defaultMessage={`Valor 1`}
                  />
                </th>
                <th colSpan='2'>
                  <FormattedMessage
                    id="datasets.value2"
                    defaultMessage={`Valor 2`}
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {this.state.formData.groupings.length === 0 ? (
                <tr>
                  <td colSpan='4'>
                    <FormattedMessage
                      id="datasets.emptyGroups"
                      defaultMessage={`No hay agrupaciones que mostrar`}
                    />
                  </td>
                </tr>
                ) : (
                  this.state.formData.groupings.map((item, key) => {
                    return (
                      <tr key={key}>
                        <td>{item.column}</td>
                        <td>{item.inputValue}</td>
                        <td>{item.outputValue}</td>
                        <td className='has-text-centered'>
                          <button
                            className='button is-danger icon-btn'
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
              <FormattedMessage
                id="datasets.emptyGroups"
                defaultMessage={`configuredMsg`}
              />
            </div>
          </div>
          <div className={this.state.apiCallErrorMessage}>
            <div className='message-body is-size-7 has-text-centered'>
              {this.state.error}
            </div>
          </div>

          <div className='field is-grouped'>
            <div className='control'>
              <button
                className={'button is-primary' + this.state.isLoading}
                disabled={!!this.state.isLoading}
              >
                <FormattedMessage
                  id="datasets.btnProcess"
                  defaultMessage={`Procesar`}
                />
              </button>
            </div>
          </div>
        </form>

      </div>

    )
  }
}

export default ConfigureDatasetForm
