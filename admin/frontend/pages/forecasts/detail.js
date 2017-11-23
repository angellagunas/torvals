import React, { Component } from 'react'
import Link from '~base/router/link'
import api from '~base/api'
import Loader from '~base/components/spinner'
import moment from 'moment'

import { BaseTable } from '~base/components/base-table'
// import GroupForm from './form'

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
    // this.context.tree.set('groups', {
    //   page: 1,
    //   totalItems: 0,
    //   items: [],
    //   pageLength: 10
    // })
    // this.context.tree.commit()
    this.load()
    // this.loadOrgs()
  }

  async load () {
    var url = '/admin/forecasts/' + this.props.match.params.uuid
    const body = await api.get(url)

    this.setState({
      loading: false,
      loaded: true,
      forecast: body.data
    })
  }

  async loadPredictions () {
    var url = '/admin/predictions/' + this.props.match.params.uuid
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
                      Forecast | {moment.utc(forecast.dateStart).local().format('DD/MM/YYYY')} - {moment.utc(forecast.dateEnd).local().format('DD/MM/YYYY')}
                    </p>
                  </header>
                  <div className='card-content'>
                    <div className='columns'>
                      <div className='column'>
                        <BaseTable
                          branchName='users'
                          baseUrl='/admin/users'
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
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default ForecastDetail
