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

  componentWillMount () {
    this.getDataRows()
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
              { this.state.rows.length > 0 ?
                <div>
                  <section className='section'>
                  <h1 className='period-info'>
                    <span className='has-text-weight-semibold is-capitalized'>{this.formatTitle('adjustments.cycle')} {'Lunes'} - </span>
                    <span className='has-text-info has-text-weight-semibold'> {this.setAlertMsg()}</span>
                  </h1>
                </section>
                  {
                    !this.state.byWeek ?

                      this.state.rows && this.state.rows.length > 0 ?
                        <StickyTable>
                          {this.state.rows}
                        </StickyTable>
                        :
                        <div className='section has-text-centered subtitle has-text-primary'>
                          {this.formatTitle('dashboard.productEmptyMsg')}
                        </div>
                      :

                      this.state.rows && this.state.rows.length > 0 ?
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
