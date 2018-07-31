import React, { Component } from 'react'
import Tabs from '~base/components/base-tabs'
import { loggedIn, verifyRole } from '~base/middlewares/'
import Page from '~base/page'
import tree from '~core/tree'
import UsersDetail from './users/users-detail'
import GroupsDetail from './groups/groups-detail'

class UsersGroups extends Component {
  render () {
    let org = tree.get('user').currentOrganization
    let tabs = [{
      name: 'users',
      title: 'Usuarios', //TODO: translate
      hide: false,
      reload: true,
      content: (
        <UsersDetail />
            )
    },
    {
      name: 'groups',
      title: 'Grupos', //TODO: translate
      hide: false,
      reload: true,
      content: (
        <GroupsDetail />
        )
    }
    ]
    return (
      <div>
        <Tabs
          tabTitle={org.name}
          tabs={tabs}
          selectedTab={'users'}
          className='is-fullwidth'
          />
      </div>
    )
  }
}

export default Page({
  path: '/manage/users-groups',
  title: 'Usuarios y Grupos', //TODO: translate
  icon: 'users',
  roles: 'admin, orgadmin, analyst, consultor-level-3, consultor-level-2, manager-level-2, manager-level-3',
  canCreate: 'admin, orgadmin, analyst, manager-level-2, manager-level-3',
  exact: true,
  validate: [loggedIn, verifyRole],
  component: UsersGroups
})
