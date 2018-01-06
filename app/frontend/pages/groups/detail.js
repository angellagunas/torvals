import React, { Component } from 'react'
import { branch } from 'baobab-react/higher-order'
import PropTypes from 'baobab-react/prop-types'
import Link from '~base/router/link'
import api from '~base/api'
import Loader from '~base/components/spinner'

import Page from '~base/page'
import {loggedIn, verifyRole} from '~base/middlewares/'
import { BranchedPaginatedTable } from '~base/components/base-paginatedTable'
import GroupForm from './form'
import DeleteButton from '~base/components/base-deleteButton'

class GroupDetail extends Component {
  constructor (props) {
    super(props)
    this.state = {
      loading: true,
      loaded: false,
      group: {}
    }
  }

  componentWillMount () {
    this.context.tree.set('groups', {
      page: 1,
      totalItems: 0,
      items: [],
      pageLength: 10
    })
    this.context.tree.commit()
    this.load()
  }

  async load () {
    var url = '/app/groups/' + this.props.match.params.uuid
    const body = await api.get(url)

    this.setState({
      loading: false,
      loaded: true,
      group: body.data
    })
  }

  getColumns () {
    return [
      {
        'title': 'Name',
        'property': 'name',
        'default': 'N/A',
        'sortable': true
      },
      {
        'title': 'Email',
        'property': 'email',
        'default': 'N/A',
        'sortable': true
      },
      {
        'title': 'Actions',
        formatter: (row) => {
          return <Link className='button' to={'/manage/users/' + row.uuid}>
            Detalle
          </Link>
        }
      }
    ]
  }

  async deleteObject () {
    var url = '/app/groups/' + this.props.match.params.uuid
    await api.del(url)
    this.props.history.push('/manage/groups')
  }

  render () {
    const { group } = this.state

    if (!group.uuid) {
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
                      objectName='Group'
                      objectDelete={this.deleteObject.bind(this)}
                      message={`Are you sure you want to delete the group ${group.name}?`}
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
                      Group
                    </p>
                  </header>
                  <div className='card-content'>
                    <div className='columns'>
                      <div className='column'>
                        <GroupForm
                          baseUrl='/app/groups'
                          url={'/app/groups/' + this.props.match.params.uuid}
                          initialState={this.state.group}
                          load={this.load.bind(this)}
                        >
                          <div className='field is-grouped'>
                            <div className='control'>
                              <button className='button is-primary'>Save</button>
                            </div>
                          </div>
                        </GroupForm>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className='column'>
                <div className='card'>
                  <header className='card-header'>
                    <p className='card-header-title'>
                      Users
                    </p>
                  </header>
                  <div className='card-content'>
                    <div className='columns'>
                      <div className='column'>
                        <BranchedPaginatedTable
                          branchName='users'
                          baseUrl='/app/users'
                          columns={this.getColumns()}
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

GroupDetail.contextTypes = {
  tree: PropTypes.baobab
}

const branchedGroupDetail = branch({groups: 'groups'}, GroupDetail)

export default Page({
  path: '/manage/groups/:uuid',
  title: 'Group details',
  exact: true,
  roles: 'admin, admin-organizacion',
  validate: [loggedIn, verifyRole],
  component: branchedGroupDetail
})
