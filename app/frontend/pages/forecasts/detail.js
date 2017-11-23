import React, { Component } from 'react'
import api from '~base/api'
import Loader from '~base/components/spinner'
import moment from 'moment'
import FontAwesome from 'react-fontawesome'

import Page from '~base/page'
import {loggedIn} from '~base/middlewares/'
import {
  BaseTable,
  SimpleTable,
  TableBody,
  TableHeader,
  TableData,
  BodyRow
} from '~base/components/base-table'

class ForecastDetail extends Component {
  constructor (props) {
    super(props)
    this.state = {
      loading: true,
      loaded: false,
      predictions: [],
      forecast: {}
    }
  }

  componentWillMount () {
    this.load()
  }

  async load () {
    var url = '/app/forecasts/' + this.props.match.params.uuid
    const body = await api.get(url)

    this.setState({
      loading: false,
      loaded: true,
      forecast: body.data
    })
  }

  async loadPredictions () {
    var url = '/app/predictions/' + this.props.match.params.uuid
    const body = await api.get(url)

    this.setState({
      loading: false,
      loaded: true,
      predictions: body.data
    })
  }

  getColumns () {
    return [
      {
        'title': 'Column A',
        'property': 'columna',
        'default': 'N/A',
        'sortable': true
      },
      {
        'title': 'Column B',
        'property': 'columnb',
        'default': 'N/A',
        'sortable': true
      },
      {
        'title': 'Column C',
        'property': 'columnc',
        'default': 'N/A',
        'sortable': true
      },
      {
        'title': 'Column D',
        'property': 'columnd',
        'default': 'N/A',
        'sortable': true
      },
      {
        'title': 'Column E',
        'property': 'columne',
        'default': 'N/A',
        'sortable': true
      },
      {
        'title': 'Column F',
        'property': 'columnf',
        'default': 'N/A',
        'sortable': true
      },
      {
        'title': 'Column G',
        'property': 'columng',
        'default': 'N/A',
        'sortable': true
      },
      {
        'title': 'Column H',
        'property': 'columnh',
        'default': 'N/A',
        'sortable': true
      },
      {
        'title': 'Column I',
        'property': 'columni',
        'default': 'N/A',
        'sortable': true
      },
      {
        'title': 'Column J',
        'property': 'columnj',
        'default': 'N/A',
        'sortable': true
      }
    ]
  }

  getFrequency () {
    let forecast = this.state.forecast
    let freqDict = {
      B: 'Business day frequency',
      D: 'Calendar day frequency',
      W: 'Weekly frequency',
      M: 'Month end frequency'
    }

    return freqDict[forecast.frequency]
  }

  getTable () {
    let forecast = this.state.forecast
    if (forecast.status === 'done') {
      return (
        <div className='card'>
          <header className='card-header'>
            <p className='card-header-title'>
              Predictions
            </p>
          </header>
          <div className='card-content'>
            <div className='columns'>
              <div className='column'>
                <BaseTable
                  branchName='predictions'
                  baseUrl='/app/predictions'
                  columns={this.getColumns()}
                  data={
                  [
                    {
                      columna: 'column a',
                      columnb: 'column b',
                      columnc: 'column c',
                      columnd: 'column d',
                      columne: 'column e',
                      columnf: 'column f',
                      columng: 'column g',
                      columnh: 'column h',
                      columni: 'column i',
                      columnj: 'column j'
                    }
                  ]
                  }
                  filters={{group: this.props.match.params.uuid}}
                 />
              </div>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className='card'>
        <header className='card-header'>
          <p className='card-header-title'>
            Predictions
          </p>
        </header>
        <div className='card-content'>
          <div className='message is-success'>
            <div className='message-body is-large has-text-centered'>
              <div className='columns'>
                <div className='column'>
                  <span className='icon is-large'>
                    <FontAwesome className='fa-3x fa-spin' name='cog' />
                  </span>
                </div>
              </div>
              <div className='columns'>
                <div className='column'>
                  The predictions will appear shortly...
                  They are being generated as we speak
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  render () {
    const { forecast } = this.state

    if (!forecast.uuid) {
      return <Loader />
    }

    return (
      <div className='columns c-flex-1 is-marginless'>
        <div className='column is-paddingless'>
          <div className='section'>
            <div className='columns'>
              <div className='column'>
                <div className='card'>
                  <header className='card-header'>
                    <p className='card-header-title'>
                      Forecast
                    </p>
                  </header>
                  <div className='card-content'>
                    <div className='columns'>
                      <div className='column'>
                        <SimpleTable>
                          <TableBody>
                            <BodyRow>
                              <TableHeader>
                                Status
                              </TableHeader>
                              <TableData>
                                {forecast.status}
                              </TableData>
                            </BodyRow>
                            <BodyRow>
                              <TableHeader>
                                Start Date
                              </TableHeader>
                              <TableData>
                                {moment.utc(forecast.dateStart).format('DD/MM/YYYY')}
                              </TableData>
                            </BodyRow>
                            <BodyRow>
                              <TableHeader>
                                End Date
                              </TableHeader>
                              <TableData>
                                {moment.utc(forecast.dateEnd).format('DD/MM/YYYY')}
                              </TableData>
                            </BodyRow>
                            <BodyRow>
                              <TableHeader>
                                Organization
                              </TableHeader>
                              <TableData>
                                {forecast.organization.name}
                              </TableData>
                            </BodyRow>
                            <BodyRow>
                              <TableHeader>
                                Frequency
                              </TableHeader>
                              <TableData>
                                {this.getFrequency()}
                              </TableData>
                            </BodyRow>
                            <BodyRow>
                              <TableHeader>
                                Holidays
                              </TableHeader>
                              <TableData>
                                {forecast.holidays.map((item) => {
                                  return `${item.name} (${moment.utc(item.date).format('DD/MM/YYYY')})`
                                }).join(', ')}
                              </TableData>
                            </BodyRow>
                            <BodyRow>
                              <TableHeader>
                                Change points
                              </TableHeader>
                              <TableData>
                                {forecast.changePoints.map((item) => {
                                  return `${moment.utc(item).format('DD/MM/YYYY')}`
                                }).join(', ')}
                              </TableData>
                            </BodyRow>
                            <BodyRow>
                              <TableHeader>
                                Created By
                              </TableHeader>
                              <TableData>
                                {`${forecast.createdBy.name}`}
                              </TableData>
                            </BodyRow>
                            <BodyRow>
                              <TableHeader>
                                External ID
                              </TableHeader>
                              <TableData>
                                {forecast.externalId}
                              </TableData>
                            </BodyRow>
                            <BodyRow>
                              <TableHeader>
                                Date Created
                              </TableHeader>
                              <TableData>
                                {moment.utc(forecast.dateCreated).format('DD/MM/YYYY')}
                              </TableData>
                            </BodyRow>
                          </TableBody>
                        </SimpleTable>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className='column'>
                {this.getTable()}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default Page({
  path: '/forecasts/detail/:uuid',
  title: 'Forecast detail',
  icon: 'check',
  exact: true,
  validate: loggedIn,
  component: ForecastDetail
})
