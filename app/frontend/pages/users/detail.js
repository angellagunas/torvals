import React, { Component } from 'react'
import { branch } from 'baobab-react/higher-order'
import PropTypes from 'baobab-react/prop-types'
import api from '~base/api'
import moment from 'moment'

import Loader from '~base/components/spinner'
import UserForm from './form'
import Multiselect from '~base/components/base-multiselect'

class UserDetail extends Component {
  constructor (props) {
    super(props)
    this.state = {
      loaded: false,
      loading: true,
      user: {},
      roles: [],
      groups: []
    }
  }

  componentWillMount () {
    this.load()
    this.loadRoles()
    this.loadGroups()
  }

  async load () {
    var url = '/admin/users/' + this.props.match.params.uuid
    const body = await api.get(url)

    await this.setState({
      loading: false,
      loaded: true,
      user: body.data
    })
  }

  async loadRoles () {
    var url = '/admin/roles/'
    const body = await api.get(
      url,
      {
        start: 0,
        limit: 0
      }
    )

    this.setState({
      ...this.state,
      roles: body.data
    })
  }

  async loadGroups () {
    var url = '/admin/groups/'
    const body = await api.get(
      url,
      {
        user: this.props.match.params.uuid,
        start: 0,
        limit: 0
      }
    )

    this.setState({
      ...this.state,
      groups: body.data
    })
  }

  getDateCreated () {
    if (this.state.user.dateCreated) {
      return moment.utc(
        this.state.user.dateCreated
      ).format('DD/MM/YYYY hh:mm a')
    }

    return 'N/A'
  }

  async availableGroupOnClick (uuid) {
    var url = '/admin/users/' + this.props.match.params.uuid + '/add/group'
    await api.post(url,
      {
        group: uuid
      }
    )

    this.load()
    this.loadGroups()
  }

  async assignedGroupOnClick (uuid) {
    var url = '/admin/users/' + this.props.match.params.uuid + '/remove/group'
    await api.post(url,
      {
        group: uuid
      }
    )

    this.load()
    this.loadGroups()
  }

  render () {
    const { user } = this.state

    if (!user.uuid) {
      return <Loader />
    }

    return (
      <div className='columns c-flex-1 is-marginless'>
        <div className='column is-paddingless'>
          <div className='section'>
            <div className='columns is-mobile'>
              <div className='column'>
                <div className='card'>
                  <header className='card-header'>
                    <p className='card-header-title'>
                      { user.displayName }
                    </p>
                  </header>
                  <div className='card-content'>
                    <div className='columns'>
                      <div className='column'>
                        <UserForm
                          baseUrl='/admin/users'
                          url={'/admin/users/' + this.props.match.params.uuid}
                          initialState={this.state.user}
                          load={this.load.bind(this)}
                          roles={this.state.roles || []}
                        >
                          <div className='field is-grouped'>
                            <div className='control'>
                              <button className='button is-primary'>Save</button>
                            </div>
                          </div>
                        </UserForm>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className='column'>
                <div className='columns'>
                  <div className='column'>
                    <div className='card'>
                      <header className='card-header'>
                        <p className='card-header-title'>
                          Organizations
                        </p>
                      </header>
                      <div className='card-content' />

                    </div>
                  </div>
                </div>
                <div className='columns'>
                  <div className='column'>
                    <div className='card'>
                      <header className='card-header'>
                        <p className='card-header-title'>
                          Groups
                        </p>
                      </header>
                      <div className='card-content'>
                        <Multiselect
                          assignedList={user.groups}
                          availableList={this.state.groups}
                          dataFormatter={(item) => { return item.name || 'N/A' }}
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
        </div>
      </div>
    )
  }
}

UserDetail.contextTypes = {
  tree: PropTypes.baobab
}

export default branch({}, UserDetail)
