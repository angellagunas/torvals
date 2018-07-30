import React, { Component } from 'react'
import { FormattedMessage } from 'react-intl'
import Loader from '~base/components/spinner'
import s from 'underscore.string'

class ConfigureViewDataset extends Component {
  constructor (props) {
    super(props)

    this.state = {
      dataset: this.props.initialState,
      rules: this.props.initialState.rule,
      formData: {
        columns: this.props.initialState.columns,
        groupings: this.props.initialState.groupings
      },
      catalogColumns: []
    }
  }

  componentWillMount () {
    this.getCatalogColumns()
  }

  getColumnForValue (type) {
    var posColumn = this.state.formData.columns.findIndex(e => {
      return (
        e[type] === true
      )
    })

    if (posColumn < 0) {
      return 'N/A'
    } else {
      return this.state.formData.columns[posColumn].name
    }
  }

  getCatalogColumns () {
    let cols = []
    let rules = this.state.rules

    for (let col of rules.catalogs) {
      cols.push({
        id: {
          label: `${col.name} Id *`,
          name: `is_${col.slug}_id`
        },
        name: { //TODO: translate
          label: `${col.name} Nombre`,
          name: `is_${col.slug}_name`
        }
      })
    }

    this.setState({catalogColumns: cols})
  }

  render () {
    if (this.state.formData.columns.length === 0) {
      return <Loader />
    }

    var columnsOperationFilter = this.state.formData.columns.filter((item) => {
      return item.isOperationFilter
    }).map(item => {
      return (
        <tr key={item.name}>
          <td>{item.name}</td>
        </tr>
      )
    })

    var columnsAnalysisFilter = this.state.formData.columns.filter((item) => {
      return item.isAnalysisFilter
    }).map(item => {
      return (
        <tr key={item.name}>
          <td>{item.name}</td>
        </tr>
      )
    })

    return (
      <div className='configure-view'>
        {this.props.statusText &&
        <div className='columns'>
          <div className='column'>
            <div className='message is-success'>
              <div className='message-body'>
                <div className='media'>
                  <div className='media-content has-text-centered'>
                    {this.props.statusIcon &&
                    <span className='icon is-medium'>
                      <i className={this.props.statusIcon} />
                    </span>
                  }
                    <span className='msg'>{this.props.statusText}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        }
        <div className='columns has-borders'>
          <div className='column'>
            <p className='title is-7'>
              <FormattedMessage
                id="datasets.minimumDate"
                defaultMessage={`Fecha mínima`}
              />
            </p>
            <p className='subtitle is-7'>{this.props.fmin}</p>
          </div>
          <div className='column'>
            <p className='title is-7'>
              <FormattedMessage
                id="datasets.maximumDate"
                defaultMessage={`Fecha máxima`}
              />
            </p>
            <p className='subtitle is-7'>{this.props.fmax}</p>
          </div>
        </div>

        <div className='columns has-borders'>
          <div className='column'>
            <p className='title is-7'>
              <FormattedMessage
                id="datasets.date"
                defaultMessage={`Fecha`}
              /> *
            </p>
            <p className='subtitle is-7'>{this.getColumnForValue('isDate')}</p>
          </div>
          <div className='column'>
            <p className='title is-7'>
              <FormattedMessage
                id="datasets.analysis"
                defaultMessage={`Análisis`}
              /> *
            </p>
            <p className='subtitle is-7'>{this.getColumnForValue('isAnalysis')}</p>
          </div>
        </div>

        <div className='columns has-borders'>
          <div className='column'>
            <p className='title is-7'>
              <FormattedMessage
                id="datasets.adjustment"
                defaultMessage={`Ajuste`}
              />
            </p>
            <p className='subtitle is-7'>{this.getColumnForValue('isAdjustment')}</p>
          </div>
          <div className='column'>
            <p className='title is-7'>
              <FormattedMessage
                id="datasets.prediction"
                defaultMessage={`Predicción`}
              />
            </p>
            <p className='subtitle is-7'>{this.getColumnForValue('isPrediction')}</p>
          </div>
        </div>

        <div className='columns has-borders'>
          <div className='column'>
            <p className='title is-7'>
              <FormattedMessage
                id="datasets.sale"
                defaultMessage={`Venta`}
              />
            </p>
            <p className='subtitle is-7'>{this.getColumnForValue('isSales')}</p>
          </div>
          <div className='column' />
        </div>

        {this.state.catalogColumns.map((item, index) => {
          if (item.name.name !== 'is_precio_name') {
            return (
              <div className='columns has-borders' key={index}>
                <div className='column'>
                  <p className='title is-7'>{item.id.label}</p>
                  <p className='subtitle is-7'>{this.getColumnForValue(item.id.name)}</p>
                </div>
                <div className='column'>
                  <p className='title is-7'>{item.name.label}</p>
                  <p className='subtitle is-7'>{this.getColumnForValue(item.name.name)}</p>
                </div>
              </div>
            )
          }
        })}

        <div className='columns has-20-margin-top'>
          <div className='column is-paddingless'>
            <table className='table is-fullwidth'>
              <thead>
                <tr>
                  <th>
                    <FormattedMessage
                      id="datasets.operationFilter"
                      defaultMessage={`Filtro de Operación`}
                    />
                  </th>
                </tr>
              </thead>
              <tbody >
                {columnsOperationFilter}
              </tbody>
            </table>
          </div>
          <div className='column is-paddingless'>
            <table className='table is-fullwidth'>
              <thead>
                <tr>
                  <th>
                    <FormattedMessage
                      id="datasets.analysisFilter"
                      defaultMessage={`Filtro de Análisis`}
                    />
                  </th>
                </tr>
              </thead>
              <tbody >
                {columnsAnalysisFilter}
              </tbody>
            </table>
          </div>
        </div>

        <label className='label'>
          <FormattedMessage
            id="datasets.groupings"
            defaultMessage={`Agrupaciones`}
          />
        </label>
        <table className='table is-fullwidth'>
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
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    )
  }
}

export default ConfigureViewDataset
