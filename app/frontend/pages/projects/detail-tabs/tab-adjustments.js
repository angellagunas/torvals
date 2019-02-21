import React, { Component, Fragment } from 'react'
import { FormattedMessage, injectIntl } from 'react-intl'
import FontAwesome from 'react-fontawesome'
import moment from 'moment'
import _ from 'lodash'
import tree from '~core/tree'
import { toast } from 'react-toastify'
import { defaultCatalogs } from '~base/tools'

import api from '~base/api'
import { validateRegText } from '~base/tools'
import Loader from '~base/components/spinner'
import Editable from '~base/components/base-editable'
import Checkbox from '~base/components/base-checkbox'
import Spinner from '~base/components/spinner'

import WeekTable from './week-table'
import ProductTable from './product-table'
import Select from './select'
import Graph from '~base/components/graph'
import DatePicker from '~base/components/date-picker'
import { Timer } from '~base/components/timer'

const FileSaver = require('file-saver')

import { StickyTable, Row, Cell } from 'react-sticky-table'
import 'react-sticky-table/dist/react-sticky-table.css'
import classNames from 'classnames'

let currentRole
let Allchannels

class TabAdjustment extends Component {
  constructor (props) {
    super(props)
    var rows = [];
    this.state = {
      rows: rows,
      dataRows: [],
      isFiltered: false,
      isLoading: '',
      formData: {
        cycle: 1
      },
      error: false,
      errorMessage: ''
    }

    moment.locale(this.formatTitle('dates.locale'))
  }

  async getDataRows () {
    this.setState({
      isLoading: 'is-loading',
      isFiltered: false
    })

    try{
      let data = await api.get('/v2/datasetrows', {...this.state.formData})

      this.setState({
        dataRows: data.results,
        isFiltered: true,
        isLoading: ''
      })

      let newRows = [];
      for (var i=0; i<10; i++) {
        newRows.push((<Row><Cell>a {i}</Cell><Cell>b {i}</Cell></Row>));
      }
  
      this.setState({
        rows: newRows
      });
    }catch(e){
      console.log(e)
      this.setState({
        dataRows: [],
        isFiltered: true,
        isLoading: ''
      })
    }
  }

  changeAdjustment = async (value, row) => {
    row.lastLocalAdjustment = row.adjustmentForDisplay
    row.newAdjustment = value
    const res = await this.handleChange(row)
    if (!res) {
      return false
    }
    return res
  }

  async handleChange(obj) {
    let rowAux = []
    let isLimited = false
    let limitedRows = []
    let pendingDataRows = {}
    if (obj instanceof Array) {
      rowAux = obj
    } else {
      rowAux.push(obj)
    }

    for (let row of rowAux) {
      let base
      if(row.lastAdjustment){
        base = row.lastAdjustment
      }else{
        base = row.prediction
      }

      let maxAdjustment = Math.ceil(base * (1 + this.state.generalAdjustment))
      let minAdjustment = Math.floor(base * (1 - this.state.generalAdjustment))

      row.newAdjustment = Math.round(row.newAdjustment)
      row.adjustmentForDisplay = Math.round(row.adjustmentForDisplay)
      row.adjustmentForDisplayAux = row.adjustmentForDisplay
      row.isLimitAux = row.isLimit

      if (this.state.generalAdjustment > 0) {
        row.isLimit = (row.newAdjustment > maxAdjustment || row.newAdjustment < minAdjustment)
      }

      if (row.isLimit && row.adjustmentRequest &&
        (row.adjustmentRequest.status === 'approved' ||
          row.adjustmentRequest.status === 'created')) {
        row.adjustmentRequest.status = 'rejected'
      }

      row.adjustmentForDisplay = row.newAdjustment

      row.edited = true
      row.wasEdited = true

      if (row.isLimit) {
        isLimited = true

        if (!pendingDataRows[row.uuid]) pendingDataRows[row.uuid] = row

        rowAux = rowAux.filter((item) => { return row.uuid !== item.uuid })
        limitedRows.push(row)
      }
    }

    try {
      var url = '/app/rows/'

      if (rowAux.length > 0) {
        const res = await api.post(url, rowAux)
      }
      if (isLimited && (currentRole === 'manager-level-1')) {
        this.notify(
          (<p>
            <span className='icon'>
              <i className='fa fa-warning fa-lg' />
            </span>
            <FormattedMessage
              id="projects.limitInfo"
              defaultMessage={`¡Debes pedir una solicitud de aprobación de ajuste haciendo click sobre el ícono rojo o el botón de finalizar!`}
            />
          </p>),
          5000,
          toast.TYPE.WARNING
        )
      } else {
        this.notify('¡' + this.formatTitle('adjustments.save')+'!', 5000, toast.TYPE.INFO)
      }
      this.props.pendingDataRows(pendingDataRows)

    } catch (e) {
      this.notify('Error ' + e.message, 5000, toast.TYPE.ERROR)

      for (let row of rowAux) {
        row.edited = false
        row.adjustmentForDisplay = row.adjustmentForDisplayAux
        if (row.isLimitAux !== row.isLimit) {
          row.isLimit = false
        }

        delete row.adjustmentForDisplayAux
        delete row.isLimitAux
      }

      for (let row of limitedRows) {
        row.edited = false
        row.adjustmentForDisplay = row.adjustmentForDisplayAux
        if (row.isLimitAux !== row.isLimit) {
          row.isLimit = false
        }

        delete row.adjustmentForDisplayAux
        delete row.isLimitAux
        delete pendingDataRows[row.uuid]
      }

      this.props.pendingDataRows(pendingDataRows)

      return false
    }

    this.props.loadCounters()

    if (currentRole !== 'manager-level-1' && limitedRows.length) {
      this.props.handleAdjustmentRequest(limitedRows)
    }

    return true
  }

  notify (message = '', timeout = 5000, type = toast.TYPE.INFO) {
    let className = ''
    if(type === toast.TYPE.WARNING){
      className = 'has-bg-warning'
    }
    if (!toast.isActive(this.toastId)) {
      this.toastId = toast(message, {
        autoClose: timeout,
        type: type,
        hideProgressBar: true,
        closeButton: false,
        className: className
      })
    } else {
      toast.update(this.toastId, {
        render: message,
        type: type,
        autoClose: timeout,
        closeButton: false,
        className: className
      })
    }
  }

  setAlertMsg() {
    return <span>
      <FormattedMessage
        id="projects.unlimitedAdjustmentMode"
        defaultMessage={'Modo Ajuste Ilimitado'}
      />
    </span>
  }

  showByWeek = () => {
    this.setState({
      byWeek: true
    })
  }

  showByProduct = () => {
    this.setState({
      byWeek: false
    })
  }

  formatTitle(id) {
    return this.props.intl.formatMessage({ id: id })
  }

  render () {
    if (this.state.isLoading==='is-loading') {
      return (
        <div className='section has-text-centered subtitle has-text-primary'>
          <FormattedMessage
            id="projects.loading"
            defaultMessage={`Cargando, un momento por favor`}
          />
          <Loader />
        </div>
      )
    }

    return (
      <div>
        <div className='section level selects'>
          <div className='columns is-multiline is-mobile'>
            <div className='column is-narrow'>
              <Select
                label={this.formatTitle('adjustments.cycle')}
                name='cycle'
                value={'ciclo'}
                optionValue='value'
                optionName='label'
                type='integer'
                options={[{'label': 'Ciclo1', value:'1'}]}
                onChange={(name, value) => { this.filterChangeHandler(name, value) }}
              />
            </div>
          </div>
        </div>

        <section>
            <div>
              { this.state.dataRows.length > 0 ?
                <div>
                  <section className='section'>
                  <h1 className='period-info'>
                    <span className='has-text-weight-semibold is-capitalized'>{this.formatTitle('adjustments.cycle')} {'Lunes'} - </span>
                    <span className='has-text-info has-text-weight-semibold'> {this.setAlertMsg()}</span>
                  </h1>
                </section>
                  {
                    !this.state.byWeek ?

                      this.state.filteredData && this.state.filteredData.length > 0 ?

                        <ProductTable
                          show={this.showByWeek}
                          currentRole={currentRole}
                          data={this.state.filteredData}
                          changeAdjustment={this.changeAdjustment}
                          generalAdjustment={this.state.generalAdjustment}
                          adjustmentRequestCount={Object.keys(this.state.pendingDataRows).length}
                          handleAdjustmentRequest={(row) => { this.props.handleAdjustmentRequest(row) }}
                          handleAllAdjustmentRequest={() => { this.props.handleAllAdjustmentRequest() }}
                          rules={this.rules}
                        />
                        :
                        <div className='section has-text-centered subtitle has-text-primary'>
                          {this.formatTitle('dashboard.productEmptyMsg')}
                        </div>
                      :

                      this.state.filteredData && this.state.filteredData.length > 0 ?
                        <StickyTable>
                          {this.state.rows}
                        </StickyTable>
                        :
                        <div className='section has-text-centered subtitle has-text-primary'>
                          {this.formatTitle('dashboard.productEmptyMsg')}
                        </div>
                  }
                </div>
                :
                <div className='section has-text-centered subtitle has-text-primary'>
                  {this.formatTitle('dashboard.productEmptyMsg')}
                </div>
              }
            </div>
        </section>
      </div>
    )
  }
}

export default injectIntl(TabAdjustment)
