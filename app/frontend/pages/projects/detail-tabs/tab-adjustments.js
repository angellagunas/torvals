import React, { Component } from 'react'
import FontAwesome from 'react-fontawesome'
import api from '~base/api'
import { ToastContainer, toast } from 'react-toastify'
import { EditableTable } from '~base/components/base-editableTable'
import Loader from '~base/components/spinner'
import {
  BaseForm,
  SelectWidget
} from '~base/components/base-form'
import CreateAdjustmentRequest from '../../forecasts/create-adjustmentRequest'
import tree from '~core/tree'

const generalAdjustment = 0.1
var currentRole

class TabAdjustment extends Component {
  constructor (props) {
    super(props)
    this.state = {
      dataRows: [],
      isFiltered: false,
      isLoading: '',
      selectedRows: {},
      selectedAll: false,
      filters: {
        channels: [],
        products: [],
        salesCenters: [],
        semanasBimbo: []
      },
      formData: {
        semanasBimbo: 0
      }
    }
    currentRole = tree.get('user').currentRole.slug
  }
  componentWillMount () {
    this.getFilters()
  }

  async getFilters () {
    console.log(this.props)
    const url = '/app/rows/filters/dataset/'
    let res = await api.get(url + this.props.project.activeDataset.uuid)

    this.setState({
      filters: {
        channels: res.channels,
        products: res.products,
        salesCenters: res.salesCenters,
        semanasBimbo: res.semanasBimbo
      },
      formData: {
        semanasBimbo: res.semanasBimbo[0]
      }
    })
  }

  async filterChangeHandler (e) {
    this.setState({
      formData: {
        semanasBimbo: e.formData.semanasBimbo,
        products: e.formData.products,
        channels: e.formData.channels,
        salesCenters: e.formData.salesCenters
      }
    })
  }

  async filterErrorHandler (e) {

  }

  async getDataRows (e) {
    this.setState({
      isLoading: ' is-loading'
    })
    const url = '/app/rows/dataset/'
    let data = await api.get(url + this.props.project.activeDataset.uuid,
      {
        semanaBimbo: e.formData.semanasBimbo,
        product: e.formData.products,
        channel: e.formData.channels,
        salesCenter: e.formData.salesCenters
      })

    this.setState({
      dataRows: data.data,
      isFiltered: true,
      isLoading: ''
    })
  }

  getColumns () {
    return [
      {
        'title': 'checker',
        'abbreviate': true,
        'abbr': (() => {
          return (<div className='field'>
            <div className='control has-text-centered'>
              <label className='checkbox'>
                <input
                  type='checkbox'
                  checked={this.state.selectedAll}
                  onChange={(e) => this.selectRows(!this.state.selectedAll)} />
              </label>
            </div>
          </div>)
        })(),
        'property': 'checkbox',
        'default': 'N/A',
        formatter: (row, state) => {
          return (<div className='field'>
            <div className='control has-text-centered'>
              <label className='checkbox'>
                <input
                  type='checkbox'
                  checked={state.isRowSelected || false} />
              </label>
            </div>
          </div>)
        }
      },
      {
        'title': 'Product Id',
        'abbreviate': true,
        'abbr': 'P. Id',
        'property': 'productId',
        'default': 'N/A',
        formatter: (row) => {
          return String(row.productId)
        }
      },
      {
        'title': 'Product Name',
        'abbreviate': true,
        'abbr': 'P. Name',
        'property': 'productNamed',
        'default': 'N/A',
        formatter: (row) => {
          return String(row.productName)
        }
      },
      {
        'title': 'Centro de venta',
        'abbreviate': true,
        'abbr': 'C. Venta',
        'property': 'salesCenter',
        'default': 'N/A',
        formatter: (row) => {
          return String(row.salesCenter)
        }
      },
      {
        'title': 'Canal',
        'abbreviate': true,
        'abbr': 'Canal',
        'property': 'channel',
        'default': 'N/A',
        formatter: (row) => {
          return String(row.channel)
        }
      },
      {
        'title': 'Semana',
        'property': 'semanaBimbo',
        'default': 'N/A',
        formatter: (row) => {
          return String(row.semanaBimbo)
        }
      },
      {
        'title': 'Predicción',
        'property': 'prediction',
        'default': 0,
        formatter: (row) => {
          return String(row.prediction)
        }
      },
      {
        'title': 'Ajuste Anterior',
        'property': 'lastAdjustment',
        'default': 0,
        formatter: (row) => {
          if (row.lastAdjustment) {
            return row.lastAdjustment
          }
        }
      },
      {
        'title': 'Ajuste',
        'property': 'adjustment',
        'default': 0,
        'editable': true,
        'type': 'number',
        formatter: (row) => {
          if (!row.adjustment) {
            row.adjustment = 0
          }
          return row.adjustment
        }
      },
      {
        'title': 'Rango',
        'property': 'percentage',
        'default': 0,
        'type': 'number',
        formatter: (row) => {
          if (row.percentage) {
            return `${row.percentage.toFixed(2)} %`
          }
          else {
            row.percentage = (row.adjustment - row.prediction) * 100 / row.prediction
            return `${row.percentage.toFixed(2)} %`
          }
        }
      },
      {
        'title': '',
        'property': 'isLimit',
        'default': '',
        formatter: (row) => {
          if (
            currentRole !== 'analyst' &&
            currentRole !== 'enterprisemanager'
          ) {
            if (row.isLimit && !row.adjustmentRequest) {
              return (
                <span
                  className='icon'
                  title='No es posible ajustar más allá al límite!'
                  onClick={() => {
                    this.showModalAdjustmentRequest(row)
                  }}
                >
                  <FontAwesome name='warning' />
                </span>
              )
            }

            if (row.isLimit && row.adjustmentRequest) {
              return (
                <span
                  className='icon has-text-warning'
                  title='Ya se ha pedido un cambio a esta predicción!'
                  onClick={() => {
                    this.showModalAdjustmentRequest(row)
                  }}
                >
                  <FontAwesome name='warning' />
                </span>
              )
            }
          }
          return ''
        }
      }
    ]
  }


  getModifyButtons () {
    if (currentRole !== 'enterprisemanager') {
      return (
        <div className='columns'>
          <div className='column'>
            <h4 className='subtitle'>Resultados: {this.state.dataRows.length} </h4>
          </div>
          <div className='column'>
            <div className='field is-grouped is-grouped-right'>
              <div className='control'>
                <p style={{ paddingTop: 5 }}>Modificar porcentaje</p>
              </div>

              <div className='control'>
                <button
                  className='button is-primary is-outlined'
                  onClick={() => this.onClickButtonMinus()}
                  disabled={this.state.disableButtons}
                >
                  <span className='icon'>
                    <i className='fa fa-minus' />
                  </span>
                </button>
              </div>
              <div className='control'>
                <button
                  className='button is-primary is-outlined'
                  onClick={() => this.onClickButtonPlus()}
                  disabled={this.state.disableButtons}
                >
                  <span className='icon'>
                    <i className='fa fa-plus' />
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }
  }

  selectRows (selectAll) {
    let selectedRows = {}
    this.state.dataRows.map((item) => {
      if (selectAll) selectedRows[item.uuid] = item

      item.selected = selectAll
      return item
    })

    this.setState({selectedRows, selectedAll: !this.state.selectedAll}, function () {
      this.toggleButtons()
    })
  }

  setRowsToEdit (row, index) {
    let rows = {...this.state.selectedRows}
    let selectedAll = false

    if (rows.hasOwnProperty(row.uuid)) {
      row.selected = !row.selected
      delete rows[row.uuid]
    } else {
      row.selected = true
      rows[row.uuid] = row
    }

    if (Object.keys(rows).length === this.state.dataRows.length) {
      selectedAll = !selectedAll
    }

    this.setState({selectedRows: rows, selectedAll}, function () {
      this.toggleButtons()
    })
  }

  async onClickButtonPlus () {
    let rows = this.state.selectedRows

    for (var item in rows) {
      let toAdd = rows[item].prediction * 0.01
      if (Math.round(toAdd) === 0) {
        toAdd = 1
      }
      rows[item].edited = true
      var adjustment = rows[item].adjustment
      var newAdjustment = rows[item].adjustment + toAdd
      rows[item].adjustment = newAdjustment
      const res = await this.handleChange(rows[item])
      if (!res) {
        rows[item].adjustment = adjustment
      }
    }
  }

  async onClickButtonMinus () {
    let rows = this.state.selectedRows

    for (var item in rows) {
      let toAdd = rows[item].prediction * 0.01
      if (Math.round(toAdd) === 0) { 
        toAdd = 1
      }
      rows[item].edited = true
      var adjustment = rows[item].adjustment
      var newAdjustment = rows[item].adjustment - toAdd
      rows[item].adjustment = newAdjustment
      const res = await this.handleChange(rows[item])
      if (!res) {
        rows[item].adjustment = adjustment
      }
    }
  }

  toggleButtons () {
    let disable = true
    let rows = {...this.state.selectedRows}
    if (Object.keys(rows).length) disable = false

    this.setState({
      disableButtons: disable
    })
  }

  async handleChange (obj) {
    const row = this.state.dataRows.find((item) => { return obj.uuid === item.uuid })
    var maxAdjustment = Math.ceil(row.prediction * (1 + generalAdjustment))
    var minAdjustment = Math.floor(row.prediction * (1 - generalAdjustment))
    obj.adjustment = Math.round(obj.adjustment)
    obj.percentage = (obj.adjustment - obj.prediction) * 100 / obj.prediction
    obj.isLimit = (obj.adjustment >= maxAdjustment || obj.adjustment <= minAdjustment)

    if ((currentRole === 'opsmanager' || currentRole === 'localmanager')) {
      if (obj.adjustment > maxAdjustment || obj.adjustment < minAdjustment) {
        this.notify(' No te puedes pasar de los límites establecidos!', 3000, toast.TYPE.ERROR)
        return false
      }
    }

    var url = '/app/rows/' + obj.uuid
    const res = await api.post(url, {...obj})

    obj.lastAdjustment = res.data.data.lastAdjustment
    
    obj.edited = true

    this.notify('Ajuste guardado!', 3000, toast.TYPE.SUCCESS)

    this.selectRows(false)

    return true
  }

  notify (message = '', timeout = 3000, type = toast.TYPE.INFO) {
    if (!toast.isActive(this.toastId)) {
      this.toastId = toast(message, {
        autoClose: timeout,
        type: type,
        hideProgressBar: true,
        closeButton: false
      })
    } else {
      toast.update(this.toastId, {
        render: message,
        type: type,
        autoClose: timeout,
        closeButton: false
      })
    }
  }

  showModalAdjustmentRequest (obj) {
    obj.adjustment = '' + obj.adjustment
    this.setState({
      classNameAR: ' is-active',
      selectedAR: obj
    })
  }

  hideModalAdjustmentRequest () {
    this.setState({
      classNameAR: ''
    })
  }

  async finishUpAdjustmentRequest (obj) {
    if (this.state.selectedRows.hasOwnProperty(this.state.selectedAR.uuid)) {
      this.state.selectedAR.adjustmentRequest = true
    }
    this.setState({
      selectedAR: undefined
    })
    this.selectRows(false)
  }

  render () {
    if (!this.state.dataRows || !this.state.filters.semanasBimbo.length > 0) {
      return <Loader />
    }

    var schema = {
      type: 'object',
      title: '',
      properties: {
        semanasBimbo: {
          type: 'number',
          title: 'Semana',
          enum: []
        },
        channels: {
          type: 'string',
          title: 'Canales',
          enum: [],
          enumNames: []
        },
        products: {
          type: 'string',
          title: 'Productos',
          enum: [],
          enumNames: []
        },
        salesCenters: {
          type: 'string',
          title: 'Centros de Venta',
          enum: [],
          enumNames: []
        }
      }
    }

    const uiSchema = {
      semanasBimbo: {'ui:widget': SelectWidget, 'ui:placeholder': 'Selecciona semana'},
      channels: {'ui:widget': SelectWidget, 'ui:placeholder': 'Selecciona canal'},
      products: {'ui:widget': SelectWidget, 'ui:placeholder': 'Selecciona producto'},
      salesCenters: {'ui:widget': SelectWidget, 'ui:placeholder': 'Selecciona Centro de Venta'}
    }

    schema.properties.semanasBimbo.enum = this.state.filters.semanasBimbo

    schema.properties.channels.enum = this.state.filters.channels.map(item => { return item.uuid })
    schema.properties.channels.enumNames = this.state.filters.channels.map(item => { return item.name })

    schema.properties.products.enum = this.state.filters.products.map(item => { return item.uuid })
    schema.properties.products.enumNames = this.state.filters.products.map(item => { return item.name })

    schema.properties.salesCenters.enum = this.state.filters.salesCenters.map(item => { return item.uuid })
    schema.properties.salesCenters.enumNames = this.state.filters.salesCenters.map(item => { return item.name })

    return (
      <div className='card'>
        <header className='card-header'>
          <p className='card-header-title'> Ajustes </p>
        </header>
        <div className='card-content'>
          <ToastContainer />
          <CreateAdjustmentRequest
            className={this.state.classNameAR}
            hideModal={(e) => this.hideModalAdjustmentRequest(e)}
            finishUp={(e) => this.finishUpAdjustmentRequest(e)}
            prediction={this.state.selectedAR}
            baseUrl={'/app/rows/'}
          />
          <BaseForm
            schema={schema}
            uiSchema={uiSchema}
            formData={this.state.formData}
            onChange={(e) => { this.filterChangeHandler(e) }}
            onSubmit={(e) => { this.getDataRows(e) }}
            onError={(e) => { this.filterErrorHandler(e) }}
          >
            <div className='field is-grouped'>
              <div className='control'>
                <button className={'button is-primary is-medium' + this.state.isLoading} type='submit'>Filtrar</button>
              </div>
            </div>
          </BaseForm>
          <section className='section'>

            {!this.state.isFiltered
              ? <article className='message is-primary'>
                <div className='message-header'>
                  <p>Información</p>
                </div>
                <div className='message-body'>
                  Debe aplicar un filtro para visualizar información
                </div>
              </article>
              : <div>
                {this.getModifyButtons()}
                <EditableTable
                  columns={this.getColumns()}
                  data={this.state.dataRows}
                  handleChange={(e) => this.handleChange(e)}
                  setRowsToEdit={(e) => this.setRowsToEdit(e)}
                  selectable={currentRole !== 'enterprisemanager'}
                />
              </div>
            }
          </section>
        </div>
      </div>
    )
  }
}

export default TabAdjustment
