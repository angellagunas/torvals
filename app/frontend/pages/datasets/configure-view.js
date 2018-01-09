import React, { Component } from 'react'
import api from '~base/api'
import Loader from '~base/components/spinner'
import lov from 'lov'

class ConfigureViewDataset extends Component {
  constructor (props) {
    super(props)

    this.state = {
      formData: {
        columns: this.props.initialState.columns,
        groupings: this.props.initialState.groupings
      },
      isDate: 'defined',
      isAnalysis: 'defined',
      isProduct: 'defined',
      isSalesCenter: 'defined',
      apiCallMessage: 'is-hidden',
      apiCallErrorMessage: 'is-hidden'
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
    var error
    if (this.state.error) {
      error = <div>
        Error: {this.state.error}
      </div>
    }

    if (this.state.formData.columns.length === 0) {
      return <Loader />
    }

    var columnsOperationFilter = this.state.formData.columns.filter((item) => {
      return item.isOperationFilter
    }).map(item => {
      return (
        <tr>
          <td>{item.name}</td>
        </tr>
      )
    })

    var columnsAnalysisFilter = this.state.formData.columns.filter((item) => {
      return item.isAnalysisFilter
    }).map(item => {
      return (
        <tr>
          <td>{item.name}</td>
        </tr>
      )
    })

    return (
      <div>
        <table className='table is-fullwidth'>
          <tbody>
            <tr>
              <td><label className='label'>Is Date</label></td>
              <td>{this.getColumnForValue('isDate')}</td>
            </tr>
            <tr>
              <td><label className='label'>Is Analysis</label></td>
              <td>{this.getColumnForValue('isAnalysis')}</td>
            </tr>
            <tr>
              <td><label className='label'>Is Product</label></td>
              <td>{this.getColumnForValue('isProduct')}</td>
            </tr>
            <tr>
              <td><label className='label'>Is Sales Center</label></td>
              <td>{this.getColumnForValue('isSalesCenter')}</td>
            </tr>
          </tbody>
        </table>

        <div className='columns'>
          <div className='column'>
            <table className='table is-fullwidth'>
              <thead>
                <tr>
                  <th>Operation Filter</th>
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
                  <th>Analysis Filter</th>
                </tr>
              </thead>
              <tbody >
                {columnsAnalysisFilter}
              </tbody>
            </table>
          </div>
        </div>

        <label className='label'>Groupings</label>
        <table className='table is-fullwidth'>
          <thead>
            <tr>
              <th>Column</th>
              <th>Value 1</th>
              <th>Value 2</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {this.state.formData.groupings.length === 0 ? (
              <tr>
                <td colSpan='2'>No groupings to show</td>
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

        <div className={this.state.apiCallMessage}>
          <div className='message-body is-size-7 has-text-centered'>
            The dataSet has been configured successfuly
          </div>
        </div>
        <div className={this.state.apiCallErrorMessage}>
          <div className='message-body is-size-7 has-text-centered'>
            {this.state.error}
          </div>
        </div>

      </div>

    )
  }
}

export default ConfigureViewDataset
