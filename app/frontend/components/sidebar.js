import React, { Component } from 'react'
import SidebarItem from '~components/sidebar-item'
import tree from '~core/tree'

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
      return [{
        title: 'Dashboard',
        icon: 'github',
        to: '/'
      },
      {
        title: 'Manage Your Team',
        icon: 'users',
        to: '/manage',
        roles: 'admin-organizacion, admin',
        dropdown: [
          {
            title: 'Groups',
            icon: 'users',
            to: '/manage/groups'
          },
          {
            title: 'Users',
            icon: 'user',
            to: '/manage/users'
          },
          {
            title: 'My Organization',
            icon: 'user',
            to: '/manage/organizations/' + tree.get('organization').uuid
          }
        ]
      },
      {
        title: 'DataSets',
        icon: 'file',
        to: '/datasets',
        roles: 'supervisor, analista, admin-organizacion, admin'
      }]
    }

    return [{
      title: 'Dashboard',
      icon: 'github',
      to: '/'
    },
    {
      title: 'Manage Your Team',
      icon: 'users',
      to: '/manage',
      roles: 'admin-organizacion, admin',
      dropdown: [
        {
          title: 'Groups',
          icon: 'users',
          to: '/manage/groups'
        },
        {
          title: 'Users',
          icon: 'user',
          to: '/manage/users'
        }
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
            return <SidebarItem
              title={e.title}
              icon={e.icon}
              to={e.to}
              dropdown={e.dropdown}
              roles={e.roles}
              onClick={this.handleActiveLink}
              activeItem={this.state.active}
              key={e.title.toLowerCase().replace(/\s/g, '')} />
          })}
        </ul>
      </aside>
    </div>)
  }
}

export default Sidebar
