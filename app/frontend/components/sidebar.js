import React, { Component } from 'react'
import SidebarItem from '~components/sidebar-item'
import tree from '~core/tree'
import classNames from 'classnames'

import Dashboard from '../pages/dashboard'
import Projects from '../pages/projects/list'
import Calendar from '../pages/calendar'
import UsersImport from '../pages/import/users'
import GroupsImport from '../pages/import/groups'
import Catalogs from '../pages/catalog/list'
import HistoricReport from '../pages/reports/historic'
import StatusReport from '../pages/reports/status'
import DownloadReport from '../pages/reports/download'
import Prices from '../pages/prices/list'
import OrgRules from '../pages/org-rules'
import UsersGroups from '../pages/users-groups'
import Roles from '../pages/roles/list'
import Forecast from '../pages/forecast/forecast'

class Sidebar extends Component {
  constructor (props) {
    super(props)
    this.state = {
      dropdown: true,
      active: '',
      activePath: '',
      collapsed: false,
      menuItems: [],
      rules: tree.get('rule') || []
    }
    this.handleActiveLink = this.handleActiveLink.bind(this)
  }

  componentWillMount () {
    const activeItem = window.location.pathname.split('/').filter(String).join('')
    const menuItems = this.handleOpenDropdown(this.getMenuItems(), activeItem)
    this.setState({ menuItems }, function () {
      this.handleActiveLink(activeItem)
    })

    var ruleCursor = tree.select('rule')

    ruleCursor.on('update', () => {
      const activeItem = window.location.pathname.split('/').filter(String).join('')
      this.setState({
        rules: tree.get('rule')
      }, () => {
        this.setState({
          menuItems: this.handleOpenDropdown(this.getMenuItems(), activeItem)
        })
      })
    })
  }

  componentWillUnmount () {
    var ruleCursor = tree.select('rule')

    ruleCursor.on('update', () => {})
  }

  componentWillReceiveProps (nextProps) {
    if (this.state.collapsed !== nextProps.collapsed) {
      this.setState({
        collapsed: !this.state.collapsed
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

  catalogs () {
    let rules = this.state.rules

    return rules.catalogs.map(item => {
      if (item.slug !== 'precio') {
        let config =
          {
            name: item.name,
            path: '/catalogs/' + item.slug,
            title: item.name,
            breadcrumbs: true,
            breadcrumbConfig: {
              path: [
                {
                  path: '/',
                  label: 'Inicio', //TODO: translate
                  current: false
                },
                {
                  path: '/catalogs/' + item.slug,
                  label: 'Catalogos', //TODO: translate
                  current: true
                }
              ],
              align: 'left'
            },
            branchName: item.slug,
            titleSingular: item.name,
            baseUrl: '/app/catalogItems/' + item.slug,
            detailUrl: '/catalogs/' + item.slug
          }

        return Catalogs.opts(config).asSidebarItem()
      }
    }).filter(item => item)
  }

  getMenuItems () {
    if (tree.get('organization')) {
      return [

        Dashboard.asSidebarItem(),
        {
          title: 'Administración', //TODO: translate
          icon: 'id-card-o',
          to: '/manage',
          roles: 'orgadmin, admin, analyst, consultor-level-3, consultor-level-2, manager-level-2, manager-level-3',
          opened: false,
          dropdown: [
            { //TODO: translate
              title: 'Organización',
              icon: 'user-circle-o',
              roles: 'orgadmin, admin, analyst, manager-level-3',
              to: '/manage/organizations/' + tree.get('organization').uuid
            },
            OrgRules.asSidebarItem(),
            UsersGroups.asSidebarItem(),
            Roles.asSidebarItem(),
            { //TODO: translate
              title: 'Catálogos',
              icon: 'book',
              to: '/catalogs',
              roles: 'consultor-level-3, analyst, orgadmin, admin, consultor-level-2, manager-level-2, manager-level-3',
              openedLvl2: false,
              dropdown: [
                Prices.asSidebarItem(),
                ...this.catalogs()
              ]
            }
          ]
        },
        Forecast.asSidebarItem(),
        Projects.asSidebarItem(),
        Calendar.asSidebarItem(),
        { //TODO: translate
          title: 'Cargar Datos',
          icon: 'upload',
          to: '/import',
          roles: 'orgadmin, admin, manager-level-3',
          dropdown: [
            UsersImport.asSidebarItem(),
            GroupsImport.asSidebarItem()
          ]
        },
        { //TODO: translate
          title: 'Reportes',
          icon: 'clipboard',
          to: '/reports',
          roles: 'consultor-level-3, analyst, orgadmin, admin, consultor-level-2, manager-level-2, manager-level-3',
          opened: false,
          dropdown: [
            StatusReport.asSidebarItem(),
            HistoricReport.asSidebarItem(),
            DownloadReport.asSidebarItem()
          ]
        }
      ]
    }

    return [
      Dashboard.asSidebarItem()
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
    const menuClass = classNames({
      'menu-collapsed': this.state.collapsed
    })

    return (
      <div className={'sidenav menu ' + menuClass}>
        <ul className='menu-list'>
          {this.state.menuItems.map((item, index) => {
            if (item) {
              return <SidebarItem
                title={item.title}
                index={index}
                status={item.opened}
                collapsed={false}
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
      </div>
    )
  }
}

export default Sidebar
