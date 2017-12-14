import React, { Component } from 'react'
import SidebarItem from '~components/sidebar-item'
import tree from '~core/tree'

import Dashboard from '../pages/dashboard'
import Users from '../pages/users/list'
import Groups from '../pages/groups/list'
import DataSets from '../pages/datasets/list'
import ReadyDataSets from '../pages/datasets/list-ready'
import Projects from '../pages/projects/list'
import SalesCenters from '../pages/salesCenters/list'
import Products from '../pages/products/list'
import Forecasts from '../pages/forecasts/list'

class Sidebar extends Component {
  constructor (props) {
    super(props)
    this.state = {
      dropdown: true,
      active: ''
    }
    this.handleActiveLink = this.handleActiveLink.bind(this)
  }

  componentWillMount () {
    this.handleActiveLink(window.location.pathname.split('/').splice(-1, 1).pop())
  }

  getMenuItems () {
    if (tree.get('organization')) {
      return [
        Dashboard.asSidebarItem(),
        {
          title: 'Manage Your Team',
          icon: 'users',
          to: '/manage',
          roles: 'admin-organizacion, admin',
          dropdown: [
            Users.asSidebarItem(),
            Groups.asSidebarItem(),
            {
              title: 'My Organization',
              icon: 'user',
              to: '/manage/organizations/' + tree.get('organization').uuid
            }
          ]
        },
        {
          title: 'Datasets',
          icon: 'file',
          to: '/datasets',
          roles: 'supervisor, analista, admin-organizacion, admin',
          dropdown: [
            DataSets.asSidebarItem(),
            ReadyDataSets.asSidebarItem()
          ]
        },
        Projects.asSidebarItem(),
        SalesCenters.asSidebarItem(),
        Products.asSidebarItem(),
        Forecasts.asSidebarItem()
      ]
    }

    return [
      Dashboard.asSidebarItem(),
      {
        title: 'Manage Your Team',
        icon: 'users',
        to: '/manage',
        roles: 'admin-organizacion, admin',
        dropdown: [
          Users.asSidebarItem(),
          Groups.asSidebarItem()
        ]
      }]
  }

  handleActiveLink (item) {
    this.setState({active: item})
  }

  render () {
    return (<div className='offcanvas column is-narrow is-paddingless'>
      <aside className='menu'>
        <ul className='menu-list'>
          {this.getMenuItems().map(e => {
            if (e) {
              return <SidebarItem
                title={e.title}
                icon={e.icon}
                to={e.to}
                dropdown={e.dropdown}
                roles={e.roles}
                onClick={this.handleActiveLink}
                activeItem={this.state.active}
                key={e.title.toLowerCase().replace(/\s/g, '')} />
            }
          })}
        </ul>
      </aside>
    </div>)
  }
}

export default Sidebar
