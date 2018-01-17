import React, { Component } from 'react'
import api from '~base/api'
import moment from 'moment'
import Link from '~base/router/link'

import Page from '~base/page'
import {loggedIn, verifyRole} from '~base/middlewares/'
import Loader from '~base/components/spinner'
import ProjectForm from './create-form'
import Multiselect from '~base/components/base-multiselect'
import { BranchedPaginatedTable } from '~base/components/base-paginatedTable'
import DeleteButton from '~base/components/base-deleteButton'

class SalesCenterDetail extends Component {
  constructor (props) {
    super(props)
    this.state = {
      loading: true,
      loaded: false,
      salesCenter: {},
      groups: []
    }
  }

  componentWillMount () {
    this.load()
    this.loadGroups()
  }

  async load () {
    var url = '/app/salesCenters/' + this.props.match.params.uuid
    const body = await api.get(url)

    this.setState({
      loading: false,
      loaded: true,
      salesCenter: body.data
    })
  }

  async loadGroups () {
    var url = '/app/groups/'
    const body = await api.get(
      url,
      {
        start: 0,
        limit: 0
      }
    )

    this.setState({
      ...this.state,
      groups: body.data
    })
  }

  async availableGroupOnClick (uuid) {
    var url = '/app/salesCenters/' + this.props.match.params.uuid + '/add/group'
    await api.post(url,
      {
        group: uuid
      }
    )

    this.load()
    this.loadGroups()
  }

  async assignedGroupOnClick (uuid) {
    var url = '/app/salesCenters/' + this.props.match.params.uuid + '/remove/group'
    await api.post(url,
      {
        group: uuid
      }
    )

    this.load()
    this.loadGroups()
  }

  async deleteObject () {
    var url = '/app/salesCenters/' + this.props.match.params.uuid
    await api.del(url)
    this.props.history.push('/salesCenters')
  }

  compareArrays (first, second) {
    var third = []
    for (var i = 0; i < first.length; i++) {
      var available = true
      for (var j = 0; j < second.length; j++) {
        if (first[i]._id === second[j]._id) {
          available = false
        }
      }
      if (available) {
        third.push(first[i])
      }
    }

    return third
  }

  getColumns () {
    return [
      {
        'title': 'Status',
        'property': 'status',
        'default': 'N/A',
        'sortable': true
      },
      {
        'title': 'Start date',
        'property': 'dateStart',
        'default': 'N/A',
        'sortable': true,
        formatter: (row) => {
          return (
            moment.utc(row.dateStart).local().format('DD/MM/YYYY')
          )
        }
      },
      {
        'title': 'End date',
        'property': 'dateEnd',
        'default': 'N/A',
        'sortable': true,
        formatter: (row) => {
          return (
            moment.utc(row.dateEnd).local().format('DD/MM/YYYY')
          )
        }
      },
      {
        'title': 'Actions',
        formatter: (row) => {
          return (
            <Link className='button' to={'/forecasts/' + row.uuid}>
              Detalle
            </Link>
          )
        }
      }
    ]
  }

  render () {
    if (!this.state.loaded) {
      return <Loader />
    }

    return (
      <div className='columns c-flex-1 is-marginless'>
        <div className='column is-paddingless'>
          <div className='section'>
            <div className='columns'>
              <div className='column has-text-right'>
                <div className='field is-grouped is-grouped-right'>
                  <div className='control'>
                    <DeleteButton
                      titleButton={'Delete'}
                      objectName='Sales Center'
                      objectDelete={this.deleteObject.bind(this)}
                      message={`Are you sure you want to delete the sales center ${this.state.salesCenter.name}?`}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className='columns'>
              <div className='column'>
                <div className='card'>
                  <header className='card-header'>
                    <p className='card-header-title'>
                      Sales Center
                    </p>
                  </header>
                  <div className='card-content'>
                    <div className='columns'>
                      <div className='column'>
                        <ProjectForm
                          baseUrl='/app/salesCenters'
                          url={'/app/salesCenters/' + this.props.match.params.uuid}
                          initialState={this.state.salesCenter}
                          load={this.load.bind(this)}
                        >
                          <div className='field is-grouped'>
                            <div className='control'>
                              <button className='button is-primary'>Save</button>
                            </div>
                          </div>
                        </ProjectForm>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className='column'>
                <div className='card'>
                  <header className='card-header'>
                    <p className='card-header-title'>
                      Groups
                    </p>
                  </header>
                  <div className='card-content'>
                    <Multiselect
                      assignedList={this.state.salesCenter.groups}
                      availableList={this.compareArrays(this.state.groups, this.state.salesCenter.groups)}
                      dataFormatter={(item) => { return item.name }}
                      availableClickHandler={this.availableGroupOnClick.bind(this)}
                      assignedClickHandler={this.assignedGroupOnClick.bind(this)}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className='columns'>
              <div className='column'>
                <div className='columns'>
                  <div className='column'>
                    <div className='card'>
                      <header className='card-header'>
                        <p className='card-header-title'>
                          Forecasts
                        </p>
                      </header>
                      <div className='card-content'>
                        <div className='columns'>
                          <div className='column'>
                            <BranchedPaginatedTable
                              branchName='forecasts'
                              baseUrl='/app/forecasts/'
                              columns={this.getColumns()}
                              filters={{salesCenter: this.state.salesCenter.uuid}}
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
        </div>
      </div>
    )
  }
}

export default Page({
  path: '/salesCenters/:uuid',
  title: 'Sales center detail',
  exact: true,
  roles: 'enterprisemanager, analyst, orgadmin, admin, localmanager, opsmanager',
  validate: [loggedIn, verifyRole],
  component: SalesCenterDetail
})
