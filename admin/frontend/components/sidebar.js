import React, { Component } from 'react'
import SidebarItem from '~components/sidebar-item'
import classNames from 'classnames'

import Dashboard from '../pages/dashboard'
import Users from '../pages/users/list'
import DeletedUsers from '../pages/users/list-deleted'
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
import Channels from '../pages/channels/list'
import DeletedChannels from '../pages/channels/deleted-list'

class Sidebar extends Component {
  constructor (props) {
    super(props)
    this.state = {
      dropdown: true,
      active: '',
      activePath: '',
      collapsed: false,
      menuItems: []
    }
    this.handleActiveLink = this.handleActiveLink.bind(this)
  }

  componentWillMount () {
    const activeItem = window.location.pathname.split('/').filter(String).join('')
    const menuItems = this.handleOpenDropdown(this.getMenuItems(), activeItem)
    this.setState({ menuItems }, function () {
      this.handleActiveLink(activeItem)
    })
  }

  componentWillReceiveProps (nextProps) {
    if (this.state.collapsed !== nextProps.collapsed) {
      this.setState({
        collapsed: !this.state.collapsed,
        menuItems: JSON.parse(JSON.stringify(this.state.menuItems)).filter(Boolean).map(this.resetDoropdownItem)
      })
    }
    if (nextProps.activePath !== this.state.activePath) {
      const active = nextProps.activePath.split('/').filter(String).join('')
      const menuItems = this.handleOpenDropdown(this.state.menuItems, active)
      this.setState({
        activePath: nextProps.activePath,
        menuItems,
        active
      })
    }
  }

  handleOpenDropdown (menuItems, activeItem) {
    if (!this.state.collapsed) {
      const IndexOfActive = menuItems.filter(Boolean).findIndex(item => {
        const mainPath = new RegExp(item.to.replace(/\//g, ''))
        if (!item.hasOwnProperty('dropdown')) return false
        return mainPath.test(activeItem)
      })
      if (IndexOfActive >= 0) {
        menuItems[IndexOfActive].opened = true
      }
    }
    return menuItems
  }

  resetDoropdownItem (item) {
    item.opened = false
    return item
  }

  getMenuItems () {
    return [
      Dashboard.asSidebarItem(),
      {
        title: 'Administra tu equipo',
        icon: 'users',
        to: '/manage',
        opened: false,
        dropdown: [
          Users.asSidebarItem(),
          DeletedUsers.asSidebarItem(),
          Organizations.asSidebarItem(),
          Roles.asSidebarItem(),
          Groups.asSidebarItem()
        ]
      },
      {
        title: 'Proyectos',
        icon: 'cog',
        to: '/projects',
        opened: false,
        dropdown: [
          Projects.asSidebarItem(),
          DeletedProjects.asSidebarItem()
        ]
      },
      {
        title: 'Datasets',
        icon: 'file',
        to: '/datasets',
        opened: false,
        dropdown: [
          DataSets.asSidebarItem(),
          ReadyDataSets.asSidebarItem(),
          DeletedDataSets.asSidebarItem()
        ]
      },
      {
        title: 'Centros de Venta',
        icon: 'credit-card-alt',
        to: '/salesCenters',
        opened: false,
        dropdown: [
          SalesCenters.asSidebarItem(),
          DeletedSalesCenters.asSidebarItem()
        ]
      },
      {
        title: 'Productos',
        icon: 'dropbox',
        to: '/products',
        opened: false,
        dropdown: [
          Products.asSidebarItem(),
          DeletedProducts.asSidebarItem()
        ]
      },
      {
        title: 'Canales',
        icon: 'filter',
        to: '/channels',
        opened: false,
        dropdown: [
          Channels.asSidebarItem(),
          DeletedChannels.asSidebarItem()
        ]
      },
      {
        title: 'Developer Tools',
        icon: 'github-alt',
        to: '/devtools',
        opened: false,
        dropdown: [
          RequestLogs.asSidebarItem()
        ]
      }
    ]
  }

  handleActiveLink (item, title) {
    if (title && this.props.handleBurguer) {
      this.props.handleBurguer()
    }
    this.setState({active: item})
  }

  handleCollapse () {
    const menuItems = [...this.state.menuItems]
    this.setState({
      collapsed: !this.state.collapsed,
      menuItems: menuItems.map(item => {
        item.open = false
        return item
      })
    })
  }

  handleToggle (index) {
    const menuItems = [...this.state.menuItems]
    menuItems[index].opened = !menuItems[index].opened
    this.setState({menuItems})
  }

  render () {
    let divClass = 'offcanvas column is-narrow is-narrow-mobile is-narrow-tablet is-narrow-desktop  is-paddingless'
    const menuClass = classNames('menu', {
      'menu-collapsed': this.state.collapsed
    })

    return (<div className={divClass}>
      <aside className={menuClass}>
        <ul className='menu-list'>
          {this.state.menuItems.map((item, index) => {
            if (!item) { return }
            return <SidebarItem
              title={item.title}
              index={index}
              status={item.opened}
              collapsed={this.state.collapsed}
              icon={item.icon}
              to={item.to}
              dropdown={item.dropdown}
              onClick={this.handleActiveLink}
              dropdownOnClick={(i) => this.handleToggle(i)}
              activeItem={this.state.active}
              key={item.title.toLowerCase().replace(/\s/g, '')} />
          })}
        </ul>
      </aside>
    </div>)
  }
}

export default Sidebar
