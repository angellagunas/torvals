import React, { Component } from 'react'
import { FormattedMessage } from 'react-intl'
import api from '~base/api'
import shortid from 'shortid'

class DatasetForm extends Component {
  constructor (props) {
    super(props)
    this.state = {
      formData: {
        dataset: {},
        columns: []
      },
      apiCallMessage: 'is-hidden',
      apiCallErrorMessage: 'is-hidden',
      datasets: [],
      disabledControls: true,
      newName: '',
      oldName: '',
      dataset: {
        columns: []
      }
    }
  }

  errorHandler (e) {}

  handleChange (type, event) {
    const data = {
      apiCallMessage: 'is-hidden',
      apiCallErrorMessage: 'is-hidden'
    }

    data[type] = event.currentTarget.value

    if (type === 'dataset') {
      var posDataset = this.props.datasets.findIndex(e => {
        return (
        String(e.uuid) === String(data[type])
        )
      })

      data[type] = this.props.datasets[posDataset]
      data['disabledControls'] = false
    }

    this.setState(data)
  }

  handleColumnNames (event) {
    event.preventDefault()
    if (!this.state.newName || !this.state.oldName) {
      return false
    }

    var auxColumns = this.state.formData.columns
    auxColumns.push({
      name_dataset: this.state.oldName,
      name_project: this.state.newName
    })

    this.setState({
      formData: {
        columns: auxColumns
      },
      oldName: '',
      newName: ''
    })
  }

  clearState () {
    this.setState({
      apiCallMessage: 'is-hidden',
      apiCallErrorMessage: 'is-hidden',
      formData: {
        dataset: {},
        columns: []
      }
    })
  }

  async submitHandler (event) {
    event.preventDefault()
    let {dataset, formData} = this.state

    formData.dataset = dataset.uuid

    try {
      var data = await api.post(this.props.url, formData)
      if (this.props.load) {
        await this.props.load()
      }
      this.clearState()
      this.setState({apiCallMessage: 'message is-success'})
      if (this.props.finishUp) this.props.finishUp(data.data)

      setTimeout(() => {
        this.setState({apiCallMessage: 'is-hidden'})
      }, 2000)

      return
    } catch (e) {
      return this.setState({
        error: e.message,
        apiCallErrorMessage: 'message is-danger'
      })
    }
  }

  removeColumn (index) {
    this.setState({
      ...this.state.formData.columns.splice(index, 1)
    })
  }

  render () {
    if (this.props.datasets.length === 0) {
      return (
        <div>
          <h4>
            <FormattedMessage
              id="projects.emtyProcessed"
              defaultMessage={`No hay datasets procesados que seleccionar!`}
            />
          </h4>
        </div>
      )
    }

    return (
      <div>
        <form onSubmit={(e) => { this.submitHandler(e) }}>
          <div className='field'>
            <label className='label'>
              <FormattedMessage
                id="projects.selectDataset"
                defaultMessage={`Selecciona un dataset`}
              />*
            </label>
            <div className='control'>
              <div className='select'>
                <select
                  type='text'
                  name='dataset'
                  onChange={(e) => { this.handleChange('dataset', e) }}
                >
                  <option value=''>
                    <FormattedMessage
                      id="projects.selectOption"
                      defaultMessage={`Selecciona una opcion`}
                    />
                  </option>
                  {
                    this.props.datasets.map(function (item) {
                      return <option key={item.uuid}
                        value={item.uuid}>{item.name}</option>
                    })
                  }
                </select>
              </div>
            </div>
          </div>
          <div className='field'>
            <label className='label'>
              <FormattedMessage
                id="projects.columns"
                defaultMessage={`Columnas`}
              />
            </label>
          </div>
          <div className='field is-horizontal'>
            <div className='field-body'>
              <div className='field'>
                <div className='control'>
                  <div className='select'>
                    <select
                      type='text'
                      name='oldName'
                      value={this.state.oldName}
                      onChange={(e) => { this.handleChange('oldName', e) }}
                      readOnly={this.state.disabledControls}
                      disabled={this.state.disabledControls}
                    >
                      <option value=''>
                        <FormattedMessage
                          id="projects.selectOption"
                          defaultMessage={`Selecciona una opcion`}
                        />
                      </option>
                      {
                        this.state.dataset.columns.map(function (item) {
                          return <option key={shortid.generate()}
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
                    value={this.state.newName}
                    onChange={(e) => { this.handleChange('newName', e) }}
                    readOnly={this.state.disabledControls}
                    disabled={this.state.disabledControls}
                  />
                </p>
              </div>
              <div className='field'>
                <p className='control is-expanded'>
                  <button
                    className='button is-primary'
                    onClick={(e) => this.handleColumnNames(e)}
                    type='button'
                    disabled={this.state.disabledControls}
                  >
                    <FormattedMessage
                      id="projects.add"
                      defaultMessage={`Agregar`}
                    />
                  </button>
                </p>
              </div>
            </div>
          </div>

          <table className='table is-fullwidth'>
            <thead>
              <tr>
                <th>
                  <FormattedMessage
                    id="projects.datasetName"
                    defaultMessage={`Nombre del dataset`}
                  />
                </th>
                <th>
                  <FormattedMessage
                    id="projects.projectName"
                    defaultMessage={`Nombre del proyecto`}
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {this.state.formData.columns.length === 0 ? (
                <tr>
                  <td colSpan='3'>
                    <FormattedMessage
                      id="projects.emtyRows"
                      defaultMessage={`No hay filas para mostrar`}
                    />
                  </td>
                </tr>
                ) : (
                  this.state.formData.columns.map((item, index) => {
                    return (
                      <tr key={shortid.generate()}>
                        <td>{item.name_dataset}</td>
                        <td>{item.name_project}</td>
                        <td>
                          <button
                            className='button is-danger'
                            type='button'
                            onClick={() => this.removeColumn(index)}
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
                id="projects.datasetSaveMsg"
                defaultMessage={`El dataset se ha agregado con éxito`}
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
              <button className='button is-primary' type='submit'>
                <FormattedMessage
                  id="projects.btnSave"
                  defaultMessage={`Guardar`}
                />
              </button>
            </div>
          </div>
        </form>
      </div>
    )
  }
}

export default DatasetForm
