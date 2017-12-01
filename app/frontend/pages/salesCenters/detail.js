import React, { Component } from 'react'
import api from '~base/api'

import Page from '~base/page'
import {loggedIn, verifyRole} from '~base/middlewares/'
import Loader from '~base/components/spinner'
import ProjectForm from './create-form'
import Multiselect from '~base/components/base-multiselect'

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

  async deleteOnClick () {
    var url = '/app/salesCenters/' + this.props.match.params.uuid
    await api.del(url)
    this.props.history.push('/salesCenters')
  }

  compareArrays (first, second) {
    var third = first.filter(function (o1) {
      return !second.some(function (o2) {
        return o1.id === o2.id
      })
    })

    return third
  }

  render () {
    if (!this.state.loaded) {
      return <Loader />
    }
    this.compareArrays(this.state.salesCenter.groups, [])

    return (
      <div className='columns c-flex-1 is-marginless'>
        <div className='column is-paddingless'>
          <div className='section'>
            <div className='columns'>
              <div className='column has-text-right'>
                <div className='field is-grouped is-grouped-right'>
                  <div className='control'>
                    <button
                      className='button is-danger'
                      type='button'
                      onClick={() => this.deleteOnClick()}
                >
                  Delete
                </button>
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
          </div>
        </div>
      </div>
    )
  }
}

export default Page({
  path: '/salesCenter/detail/:uuid',
  title: 'Sales center detail',
  exact: true,
  roles: 'supervisor, analista, admin-organizacion, admin',
  validate: [loggedIn, verifyRole],
  component: SalesCenterDetail
})
