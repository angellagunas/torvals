import React, { Component } from 'react'
import SidebarItem from '~components/sidebar-item'
import tree from '~core/tree'
import classNames from 'classnames'

import Dashboard from '../pages/dashboard'
import Users from '../pages/users/list'
import Groups from '../pages/groups/list'
import Projects from '../pages/projects/list'
import SalesCenters from '../pages/salesCenters/list'
import Products from '../pages/products/list'
import Channels from '../pages/channel/list'
import SelectOrg from '../pages/select-org'
import Calendar from '../pages/calendar'
import Prices from '../pages/prices/list'

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
    if (tree.get('organization')) {
      return [

        Dashboard.asSidebarItem(),
        {
          title: 'Administra tu equipo',
          icon: 'users',
          to: '/manage',
          roles: 'orgadmin, admin, analyst, consultor, manager-level-2',
          opened: false,
          dropdown: [
            {
              title: 'Mi Organización',
              icon: 'user',
              roles: 'orgadmin, admin, analyst',
              to: '/manage/organizations/' + tree.get('organization').uuid
            },
            Groups.asSidebarItem(),
            Users.asSidebarItem()
          ]
        },
        Projects.asSidebarItem(),
        Calendar.asSidebarItem(),
        {
          title: 'Catálogos',
          icon: 'file',
          to: '/catalogs',
          roles: 'consultor, analyst, orgadmin, admin, manager-level-2',
          opened: false,
          dropdown: [
            Prices.asSidebarItem(),
            SalesCenters.asSidebarItem(),
            Products.asSidebarItem(),
            Channels.asSidebarItem()
          ]
        }
      ]
    }

    return [
      Dashboard.asSidebarItem(),
      {
        title: 'Administra tu equipo',
        icon: 'users',
        to: '/manage',
        roles: 'orgadmin, admin',
        dropdown: [
          Users.asSidebarItem(),
          Groups.asSidebarItem()
        ]
      }]
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
    const menuClass = classNames('menu', {
      'menu-collapsed': this.state.collapsed
    })
    return (<div className='offcanvas column is-narrow is-paddingless'>
      <aside className={menuClass}>
        <ul className='menu-list'>
          <SelectOrg collapsed={this.state.collapsed} />
          {this.state.menuItems.map((item, index) => {
            if (item) {
              return <SidebarItem
                title={item.title}
                index={index}
                status={item.opened}
                collapsed={this.state.collapsed}
                icon={item.icon}
                to={item.to}
                dropdown={item.dropdown}
                roles={item.roles}
                onClick={this.handleActiveLink}
                dropdownOnClick={(i) => this.handleToggle(i)}
                activeItem={this.state.active}
                key={item.title.toLowerCase().replace(/\s/g, '')} />
            }
          })}
        </ul>
      </aside>
    </div>)
  }
}

export default Sidebar
