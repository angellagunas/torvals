import React, { Component } from 'react'
import { SelectWidget } from '~base/components/base-form'
import classNames from 'classnames'
import api from '~base/api'

class FiltersForecast extends Component {
  constructor (props) {
    super(props)
    this.state = {
      productsSelected: '',
      productsOptions: {
        enumOptions: []
      },
      salesCentersSelected: '',
      salesCentersOptions: {
        enumOptions: []
      }
    }
  }

  componentWillMount () {
    this.load()
  }
  async load () {
    this.loadSalesCenters()
    this.loadProducts()
  }
  async loadSalesCenters () {
    let url = '/admin/salesCenters'
    let body = await api.get(url, {limit: 0,
      organization: this.props.forecast.organization.uuid,
      predictions: this.props.forecast.uuid})

    if (body.data) {
      body.data = body.data.sort(this.sortByName)
    }
    this.setState({
      loading: false,
      loaded: true,
      salesCentersOptions: {
        enumOptions: body.data
      }
    })
  }

  async loadProducts () {
    let url = '/admin/products/categories'
    let body = await api.get(url, {limit: 0, predictions: this.props.forecast.uuid})

    this.setState({
      loading: false,
      loaded: true,
      productsOptions: {
        enumOptions: body
      }
    })
  }

  sortByName (a, b) {
    if (a.name < b.name) return -1
    if (a.name > b.name) return 1
    return 0
  }

  handleWeek (e) {
    let handleWeek = this.props.handleWeek
    if (handleWeek) {
      handleWeek(e)
    }
  }

  handleFilters (e, name) {
    let obj = {}
    obj[name] = e.target.value
    this.setState(obj)

    let handleFilters = this.props.handleFilters
    if (handleFilters) {
      handleFilters(e, name)
    }
  }

  handleDays (e) {
    let handleDays = this.props.handleDays
    if (handleDays) {
      handleDays(e)
    }
  }

  getDays () {
    if (!this.props.days.options) {
      return <div />
    }
    return (<ul>
      {this.props.days.options.map((item, index) => {
        const tabClass = classNames('', {
          'is-active': this.props.days.daySelected === item
        })
        return (<li onClick={(e) => this.handleDays(e)} className={tabClass} key={index}>
          <a onClick={(e) => { e.preventDefault() }} >
            <span className='is-size-7'>{item}</span>
          </a>
        </li>)
      })}
    </ul>)
  }

  render () {
    return (<header className='card-header'>
      <div className='card-header-title'>
        <form className='is-fullwidth'>
          <div className='columns is-multiline'>
            <div className='column is-4'>
              <div className='field is-horizontal'>
                <div className='field-label'>
                  <label className='label'>Semanas</label>
                </div>
                <div className='field-body'>
                  <div className='field'>
                    <div className='control'>
                      <div className='select'>
                        <SelectWidget
                          id='root_weeks'
                          schema={this.props.weeks.schema}
                          options={this.props.weeks.options}
                          required={this.props.weeks.required}
                          value={this.props.weeks.value}
                          disabled={false}
                          readonly={false}
                          onChange={(e) => this.handleWeek(e)}
                          autofocus='false' />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className='column is-8'>
              <div className='field is-horizontal'>
                <div className='field-label'>
                  <label className='label'>Centro de Ventas</label>
                </div>
                <div className='field-body'>
                  <div className='field'>
                    <div className='control'>
                      <div className='select is-fullwidth'>
                        <select className='is-fullwidth' value={this.state.salesCentersSelected}
                          onChange={(e) => this.handleFilters(e, 'salesCentersSelected')}>
                          <option value='' />
                          {
                            this.state.salesCentersOptions.enumOptions.map((item, index) => {
                              return (<option key={index} value={item.uuid}>{item.name}</option>)
                            })
                          }
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className='field is-horizontal'>
                <div className='field-label is-normal'>
                  <label className='label'>Categoría</label>
                </div>
                <div className='field-body'>
                  <div className='field'>
                    <div className='control'>
                      <div className='select is-fullwidth'>
                        <select className='is-fullwidth' value={this.state.productsSelected}
                          onChange={(e) => this.handleFilters(e, 'productsSelected')}>
                          <option value='' />
                          {
                            this.state.productsOptions.enumOptions.map((item, index) => {
                              return (<option key={index} value={item}>{item}</option>)
                            })
                          }
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className='field is-horizontal'>
                <div className='field-label is-normal'>
                  <label className='label'>Canal</label>
                </div>
                <div className='field-body'>
                  <div className='field'>
                    <div className='control'>
                      <div className='select is-fullwidth'>
                        <select className='is-fullwidth' value={this.props.channel.value}
                          onChange={(e) => this.handleFilters(e, 'channelSelected')}>
                          <option value='' />
                          {
                            this.props.channel.options.map((item, index) => {
                              return (<option key={index} value={item}>{item}</option>)
                            })
                          }
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className='column is-12'>
              <div className='tabs is-boxed'>
                {this.getDays()}
              </div>
            </div>
          </div>
        </form>
      </div>
    </header>)
  }
}
export default FiltersForecast
