import React, { Component } from 'react'
import { SelectWidget } from '~base/components/base-form'
import classNames from 'classnames'

class FiltersForecast extends Component {
  constructor (props) {
    super(props)
    console.log(props)
  }
  selectWeek (e) {
    console.log(e)
    let handleWeek = this.props.handleWeek
    if (handleWeek) {
      handleWeek({e: e})
    }
  }
  handleFilters (e, name) {
    let handleFilters = this.props.handleFilters
    if (handleFilters) {
      handleFilters(e, name)
    }
  }
  selectDay (e) {
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
        return (<li onClick={(e) => this.selectDay(e)} className={tabClass} key={index}>
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
                          onChange={(e) => this.selectWeek(e)}
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
                        <select className='is-fullwidth' value={this.props.salesCenters.value} onChange={(e) => this.handleFilters(e, 'salesCentersSelected')}>
                          <option value='' />
                          {
                            this.props.salesCenters.options.map((item, index) => {
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
                        <select className='is-fullwidth' value={this.props.category.value} onChange={(e) => this.handleFilters(e, 'productsSelected')}>
                          <option value='' />
                          {
                            this.props.category.options.map((item, index) => {
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
                        <select className='is-fullwidth' value={this.props.channel.value} onChange={(e) => this.handleFilters(e, 'channelSelected')}>
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
