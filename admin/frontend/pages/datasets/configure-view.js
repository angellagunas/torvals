import React, { Component } from 'react'
import Loader from '~base/components/spinner'

class ConfigureViewDataset extends Component {
  constructor (props) {
    super(props)

    this.state = {
      formData: {
        columns: this.props.initialState.columns,
        groupings: this.props.initialState.groupings
      }
    }
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
      <div>
        <table className='table is-fullwidth'>
          <tbody>
            <tr>
              <td><label className='label'>Fecha</label></td>
              <td>{this.getColumnForValue('isDate')}</td>
            </tr>
            <tr>
              <td><label className='label'>Análisis</label></td>
              <td>{this.getColumnForValue('isAnalysis')}</td>
            </tr>
            <tr>
              <td><label className='label'>Producto</label></td>
              <td>{this.getColumnForValue('isProduct')}</td>
            </tr>
            <tr>
              <td><label className='label'>Centro de Venta</label></td>
              <td>{this.getColumnForValue('isSalesCenter')}</td>
            </tr>
            <tr>
              <td><label className='label'>Canal</label></td>
              <td>{this.getColumnForValue('isChannel')}</td>
            </tr>
          </tbody>
        </table>

        <div className='columns'>
          <div className='column'>
            <table className='table is-fullwidth'>
              <thead>
                <tr>
                  <th>Filtro de Operación</th>
                </tr>
              </thead>
              <tbody >
                {columnsOperationFilter}
              </tbody>
            </table>
          </div>
          <div className='column'>
            <table className='table is-fullwidth'>
              <thead>
                <tr>
                  <th>Filtro de Análisis</th>
                </tr>
              </thead>
              <tbody >
                {columnsAnalysisFilter}
              </tbody>
            </table>
          </div>
        </div>

        <label className='label'>Agrupaciones</label>
        <table className='table is-fullwidth'>
          <thead>
            <tr>
              <th>Columna</th>
              <th>Valor 1</th>
              <th>Valor 2</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {this.state.formData.groupings.length === 0 ? (
              <tr>
                <td colSpan='2'>No hay agrupaciones que mostrar</td>
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
