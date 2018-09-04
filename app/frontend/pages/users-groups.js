import React, { Component } from 'react';
import Tabs from '~base/components/base-tabs';
import { loggedIn, verifyRole } from '~base/middlewares/';
import Page from '~base/page';
import tree from '~core/tree';
import UsersDetail from './users/users-detail';
import GroupsDetail from './groups/groups-detail';

class UsersGroups extends Component {
  constructor(props) {
    super(props);
    this.state = {
      tab: 'users',
    };
  }

  changeTab(tab) {
    this.setState({ tab: tab });
  }

  render() {
    let org = tree.get('user').currentOrganization;
    let tabs = [
      {
        name: 'users',
        title: 'Usuarios',
        hide: false,
        reload: true,
        content: <UsersDetail changeTab={tab => this.changeTab(tab)} />,
      },
      {
        name: 'groups',
        title: 'Grupos',
        hide: false,
        reload: true,
        content: <GroupsDetail changeTab={tab => this.changeTab(tab)} />,
      },
    ];
    return (
      <div>
        <Tabs
          tabTitle={org.name}
          tabs={tabs}
          selectedTab={this.state.tab}
          className="is-fullwidth"
          onChangeTab={tab => this.setState({ tab: tab })}
        />
      </div>
    );
  }
}

export default Page({
  path: '/manage/users-groups',
  title: 'Usuarios y Grupos',
  icon: 'users',
  roles:
    'admin, orgadmin, analyst, consultor-level-3, consultor-level-2, manager-level-2, manager-level-3',
  canCreate: 'admin, orgadmin, analyst, manager-level-2, manager-level-3',
  exact: true,
  validate: [loggedIn, verifyRole],
  component: UsersGroups,
});
