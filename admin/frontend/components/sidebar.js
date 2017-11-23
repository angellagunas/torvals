import React, { Component } from 'react'
import SidebarItem from '~components/sidebar-item'

import Dashboard from '../pages/dashboard'
import Users from '../pages/users/list'
import Organizations from '../pages/organizations/list'
import Roles from '../pages/roles/list'
import Groups from '../pages/groups/list'
import DataSets from '../pages/datasets/list'
import DeletedDataSets from '../pages/datasets/list-deleted'
import ReadyDataSets from '../pages/datasets/list-ready'
import Projects from '../pages/projects/list'
import DeletedProjects from '../pages/projects/deleted-list'
import SalesCenters from '../pages/salesCenters/list'
import DeletedSalesCenters from '../pages/salesCenters/deleted-list'
import RequestLogs from '../pages/request-logs/list'
import Products from '../pages/products/list'
import DeletedProducts from '../pages/products/deleted-list'

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
    return [
      Dashboard.asSidebarItem(),
      {
        title: 'Manage Your Team',
        icon: 'users',
        to: '/manage',
        dropdown: [
          Users.asSidebarItem(),
          Organizations.asSidebarItem(),
          Roles.asSidebarItem(),
          Groups.asSidebarItem()
        ]
      },
      {
        title: 'Datasets',
        icon: 'file',
        to: '/datasets',
        dropdown: [
          DataSets.asSidebarItem(),
          ReadyDataSets.asSidebarItem(),
          DeletedDataSets.asSidebarItem()
        ]
      },
      {
        title: 'Projects',
        icon: 'cog',
        to: '/projects',
        dropdown: [
          Projects.asSidebarItem(),
          DeletedProjects.asSidebarItem()
        ]
      },
      {
        title: 'SalesCenters',
        icon: 'credit-card-alt',
        to: '/salesCenters',
        dropdown: [
          SalesCenters.asSidebarItem(),
          DeletedSalesCenters.asSidebarItem()
        ]
      },
      {
        title: 'Products',
        icon: 'dropbox',
        to: '/salesCenters',
        dropdown: [
          Products.asSidebarItem(),
          DeletedProducts.asSidebarItem()
        ]
      }, {
        title: 'Developer Tools',
        icon: 'github-alt',
        to: '/devtools',
        dropdown: [
          RequestLogs.asSidebarItem()
        ]
      }
    ]
  }

  handleActiveLink (item) {
    this.setState({active: item})
  }

  render () {
    let divClass = 'offcanvas column is-narrow is-narrow-mobile is-narrow-tablet is-narrow-desktop  is-paddingless'
    if (!this.props.burgerState) {
      divClass = divClass + ' is-hidden-touch'
    }

    return (<div className={divClass}>
      <aside className='menu'>
        <ul className='menu-list'>
          {this.getMenuItems().map(item => {
            if (!item) { return }
            return <SidebarItem
              title={item.title}
              icon={item.icon}
              to={item.to}
              dropdown={item.dropdown}
              onClick={this.handleActiveLink}
              activeItem={this.state.active}
              key={item.title.toLowerCase().replace(/\s/g, '')} />
          })}
        </ul>
      </aside>
    </div>)
  }
}

export default Sidebar
