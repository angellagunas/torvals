import React, { Component } from 'react'
import api from '~base/api'
import { ToastContainer, toast } from 'react-toastify'
import FontAwesome from 'react-fontawesome'
import CreateAdjustmentRequest from '../create-adjustmentRequest'
import FiltersForecast from './filters-forecast'
import { EditableTable } from '~base/components/base-editableTable'

let schema = {
  weeks: {
    type: 'string',
    title: 'Semanas',
    enum: [],
    enumNames: []
  },
  salesCenters: {
    type: 'string',
    title: 'Semanas',
    enum: [],
    enumNames: []
  },
  products: {
    type: 'string',
    title: 'Semanas',
    enum: [],
    enumNames: []
  },
  weeksOptions: {
    enumOptions: []
  }
}

class ContainerTable extends Component {
  constructor (props) {
    super(props)
    this.state = {
      selectedRows: {},
      selectedAll: false,
      channelsOptions: [],
      weeksOptions: {
        enumOptions: []
      }
    }
  }

  componentWillMount () {
    this.load()
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.reload) {
      this.load()
    }
  }

  async load () {
    this.loadPredictions()
  }

  async loadPredictions () {
    var url = '/admin/predictions'
    const body = await api.get(url, {forecast: this.props.forecast.uuid})
    var channels = new Set(body.data.map(item => {
      return item.data.channelName
    }).filter(item => { return !!item }))

    this.setState({
      loading: false,
      loaded: true,
      channelsOptions: Array.from(channels),
      predictions: body.data,
      predictionsFormatted: body.data.map(item => {
        let data = item.data
        let percentage

        if (data.prediction !== data.adjustment) {
          percentage = (data.adjustment - data.prediction) * 100 / data.prediction
        }

        return {
          ...data,
          percentage: percentage,
          product: item.product,
          salesCenter: item.salesCenter,
          adjustmentRequest: item.adjustmentRequest,
          wasEdited: data.adjustment !== data.prediction,
          isLimit: (Math.abs(percentage) >= (this.props.forecast.project.adjustment * 100)),
          uuid: item.uuid
        }
      })
    }, function () {
      if (this.state.predictionsFormatted.length > 0) {
        let cache = {}
        this.state.predictionsFormatted
          .sort((a, b) => new Date(a.forecastDate) - new Date(b.forecastDate))
          .map(item => {
            if (!cache[item.semanaBimbo]) {
              cache[item.semanaBimbo] = []
            }
            if (cache[item.semanaBimbo].indexOf(item.forecastDate) === -1) {
              cache[item.semanaBimbo].push(item.forecastDate)
            }
            return {forecastDate: item.forecastDate, semanaBimbo: item.semanaBimbo}
          })

        schema.weeks.groupedByWeeks = cache
        schema.weeks.enum = Object.keys(cache).map(item => item)
        schema.weeks.enumNames = Object.keys(cache).map(item => 'Semana ' + item)

        this.setState({
          schema,
          predictionsFiltered: this.state.predictionsFormatted.map(item => item),
          weekSelected: schema.weeks.enum[0],
          days: this.handleDaysPerWeek(schema.weeks.groupedByWeeks[schema.weeks.enum[0]]),
          daySelected: schema.weeks.groupedByWeeks[Math.min(...Object.keys(schema.weeks.groupedByWeeks))][0],
          weeksOptions: {
            enumOptions: Object.keys(cache).map(item => {
              return {label: 'Semana ' + item, value: item}
            })
          }
        }, this.filterData)
      }
    })
  }

  handleDaysPerWeek (days) {
    const daysPerWeek = 7
    if (days.length > daysPerWeek) {
      return days.slice(0, daysPerWeek)
    }
    return days
  }

  getModifyButtons () {
    let forecast = this.props.forecast

    if (forecast.status !== 'analistReview' && forecast.status !== 'readyToOrder') {
      return (
        <div className='columns'>
          <div className='column'>
            <div className='field is-grouped is-grouped-right'>
              <div className='control'>
                <p style={{paddingTop: 5}}>Modificar porcentaje</p>
              </div>
              <div className='control'>
                <button
                  className='button'
                  onClick={() => this.onClickButtonPlus()}
                  disabled={this.state.disableButtons}
                >
                 +
                </button>
              </div>
              <div className='control'>
                <button
                  className='button'
                  style={{paddingLeft: 14, paddingRight: 14}}
                  onClick={() => this.onClickButtonMinus()}
                  disabled={this.state.disableButtons}
                >
                 -
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }
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

    if (Object.keys(rows).length === this.state.predictionsFiltered.length) {
      selectedAll = !selectedAll
    }

    this.setState({selectedRows: rows, selectedAll}, function () {
      this.toggleButtons()
    })
  }

  async onClickButtonPlus () {
    let rows = {...this.state.selectedRows}

    for (var item in rows) {
      let toAdd = (rows[item].prediction * 0.01)
      if (Math.round(toAdd) === 0) toAdd = 1
      rows[item].edited = true
      var adjustment = rows[item].adjustment
      var newAdjustment = rows[item].adjustment + toAdd
      rows[item].adjustment = newAdjustment
      const res = await this.handleChange(rows[item])
      if (!res) rows[item].adjustment = adjustment
    }
  }

  async onClickButtonMinus () {
    let rows = {...this.state.selectedRows}

    for (var item in rows) {
      let toAdd = (rows[item].prediction * 0.01)
      if (Math.round(toAdd) === 0) toAdd = 1
      rows[item].edited = true
      var adjustment = rows[item].adjustment
      var newAdjustment = rows[item].adjustment - toAdd
      rows[item].adjustment = newAdjustment
      const res = await this.handleChange(rows[item])
      if (!res) rows[item].adjustment = adjustment
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

  async handleChange (data) {
    const project = this.props.forecast.project
    const prediction = this.state.predictions.find((item) => { return data.uuid === item.uuid })

    var maxAdjustment = Math.ceil(prediction.data.prediction * (1 + project.adjustment))
    var minAdjustment = Math.floor(prediction.data.prediction * (1 - project.adjustment))
    data.adjustment = Math.round(data.adjustment)
    data.percentage = (data.adjustment - data.prediction) * 100 / data.prediction

    data.isLimit = (data.adjustment >= maxAdjustment || data.adjustment <= minAdjustment)

    var url = '/admin/predictions/' + data.uuid
    const res = await api.post(url, {...data})

    data.lastAdjustment = res.data.data.lastAdjustment
    data.edited = true
    const predictionsFormatted = this.state.predictionsFormatted.map(
      (item) => data.uuid === item.uuid ? data : item
    )

    this.notify('Ajuste guardado!', 3000, toast.TYPE.SUCCESS)

    this.setState({
      predictionsFormatted,
      success: true
    }, this.filterData())

    return true
  }

  filterData () {
    const state = this.state
    let predictionsFiltered = state.predictionsFormatted

    if (state.daySelected) {
      predictionsFiltered = predictionsFiltered.filter((item) => {
        return item.forecastDate === state.daySelected
      })
    }

    if (state.salesCentersSelected) {
      predictionsFiltered = predictionsFiltered.filter((item) => {
        return item.salesCenter.uuid === state.salesCentersSelected
      })
    }

    if (state.productsSelected) {
      predictionsFiltered = predictionsFiltered.filter((item) => {
        return item.product.category === state.productsSelected
      })
    }

    if (state.channelSelected) {
      predictionsFiltered = predictionsFiltered.filter((item) => {
        return item.channelName === state.channelSelected
      })
    }

    this.setState({predictionsFiltered})
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

  selectRows (selectAll) {
    let selectedRows = {}
    let predictionsFormatted = this.state.predictionsFiltered.map((item) => {
      if (selectAll) selectedRows[item.uuid] = item

      item.selected = selectAll
      return item
    })

    this.setState({predictionsFormatted, selectedRows, selectedAll: !this.state.selectedAll}, function () {
      this.toggleButtons()
    })
  }

  getColumns () {
    let checkboxColumn = []
    if (this.props.forecast.status === 'opsReview') {
      checkboxColumn.push({
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
                  checked={state.isRowSelected} />
              </label>
            </div>
          </div>)
        }
      })
    }

    return [
      ...checkboxColumn,
      {
        'title': 'Product Id',
        'abbreviate': true,
        'abbr': 'P. Id',
        'property': 'product_id',
        'default': 'N/A',
        formatter: (row) => {
          return String(row.product.externalId)
        }
      },
      {
        'title': 'Product Name',
        'abbreviate': true,
        'abbr': 'P. Name',
        'property': 'product_id',
        'default': 'N/A',
        formatter: (row) => {
          return String(row.product.name)
        }
      },
      {
        'title': 'Centro de venta',
        'abbreviate': true,
        'abbr': 'C. Venta',
        'property': 'agency_id',
        'default': 'N/A',
        formatter: (row) => {
          return String(row.salesCenter.name)
        }
      },
      {
        'title': 'Canal',
        'abbreviate': true,
        'abbr': 'Canal',
        'property': 'channelId',
        'default': 'N/A',
        formatter: (row) => {
          return String(row.channelName)
        }
      },
      {
        'title': 'Semana Bimbo',
        'property': 'semanaBimbo',
        'default': 'N/A'
      },
      {
        'title': 'Predicción',
        'property': 'prediction',
        'default': 0
      },
      {
        'title': 'Pedido en firme realizado en ...',
        'abbreviate': true,
        'abbr': 'Pedido',
        'property': 'lastAdjustment',
        'default': 'N/A',
        formatter: (row) => {
          if (row.lastAdjustment) {
            return row.lastAdjustment.toFixed(2)
          }
          return 'N/A'
        }
      },
      {
        'title': 'Ajuste',
        'property': 'adjustment',
        'default': 0,
        'editable': true,
        'type': 'number',
        formatter: (row) => {
          return row.adjustment.toFixed(2)
        }
      },
      {
        'title': 'Porcentaje',
        'property': 'percentage',
        'default': 0,
        'type': 'number',
        formatter: (row) => {
          if (row.percentage) {
            return `${row.percentage.toFixed(2)} %`
          }
          return '0 %'
        }
      },
      {
        'title': '',
        'property': 'isLimit',
        'default': '',
        formatter: (row) => {
          if (row.isLimit && !row.adjustmentRequest) {
            return (
              <span
                className='icon'
                title='No es posible pedir un ajuste más allá al límite!'
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
          return ''
        }
      }
    ]
  }

  showModalAdjustmentRequest (obj) {
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
    this.setState({
      selectedAR: undefined
    })
    await this.loadPredictions()
  }

  getFilters () {
    let configWeeks = {
      id: 'root_weeks',
      schema: schema.weeks,
      options: this.state.weeksOptions,
      required: true,
      value: this.state.weekSelected,
      disabled: false,
      readonly: false,
      autofocus: false
    }
    let configChannel = {
      value: this.state.channelSelected,
      options: this.state.channelsOptions
    }
    let configDays = {
      daySelected: this.state.daySelected,
      options: this.state.days
    }
    return (<FiltersForecast
      forecast={this.props.forecast}
      handleWeek={(e) => this.selectWeek()}
      handleFilters={(e, name) => this.handleFilters(e, name)}
      handleDays={(e) => this.selectDay(e)}
      weeks={configWeeks}
      channel={configChannel}
      days={configDays} />)
  }

  selectWeek (e) {
    if (e) {
      this.setState({
        days: this.handleDaysPerWeek(this.state.schema.weeks.groupedByWeeks[e]),
        weekSelected: e,
        daySelected: this.state.schema.weeks.groupedByWeeks[e][0] || ''
      }, this.filterData)
    } else {
      this.setState({
        days: '',
        weekSelected: '',
        daySelected: ''
      }, this.filterData)
    }
  }

  selectDay (e) {
    this.setState({daySelected: e.target.innerText.replace(/\s/g, '')}, this.filterData)
  }

  handleFilters (e, name) {
    let obj = {}
    obj[name] = e.target.value
    this.setState(obj, this.filterData)
  }

  render () {
    return (<div>
      <ToastContainer />
      <CreateAdjustmentRequest
        className={this.state.classNameAR}
        hideModal={(e) => this.hideModalAdjustmentRequest(e)}
        finishUp={(e) => this.finishUpAdjustmentRequest(e)}
        prediction={this.state.selectedAR}
        baseUrl={''}
      />
      {this.getFilters()}

      <div className='card-content'>
        {this.getModifyButtons()}
        <div className='columns'>
          <div className='column'>
            <EditableTable
              columns={this.getColumns()}
              data={this.state.predictionsFiltered}
              handleChange={(e) => this.handleChange(e)}
              setRowsToEdit={(e) => this.setRowsToEdit(e)}
              selectable={
                this.props.forecast.status !== 'readyToOrder'
              }
             />
          </div>
        </div>
      </div>
    </div>)
  }
}

export default ContainerTable
