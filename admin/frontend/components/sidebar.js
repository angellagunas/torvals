import React, { Component } from 'react'
import SidebarItem from '~components/sidebar-item'

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
    return [{
      title: 'Dashboard',
      icon: 'github',
      to: '/'
    },
    {
      title: 'Manage Users',
      icon: 'users',
      to: '/manage',
      dropdown: [
        {
          title: 'Roles',
          icon: 'address-book',
          to: '/manage/roles'
        },
        {
          title: 'Organizations',
          icon: 'address-book',
          to: '/manage/organizations'
        },
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
    },
    {
      title: 'Datasets',
      icon: 'file',
      to: '/datasets',
      dropdown: [
        {
          title: 'Active',
          icon: 'check',
          to: '/datasets'
        },
        {
          title: 'Deleted',
          icon: 'trash',
          to: '/datasets/deleted'
        }
      ]
    },
    {
      title: 'Projects',
      icon: 'cog',
      to: '/projects',
      dropdown: [
        {
          title: 'Active',
          icon: 'check',
          to: '/projects'
        },
        {
          title: 'Deleted',
          icon: 'trash',
          to: '/projects/deleted'
        }
      ]
    },
    {
      title: 'Sales Centers',
      icon: 'credit-card-alt',
      to: '/salesCenters',
      dropdown: [
        {
          title: 'Active',
          icon: 'check',
          to: '/salesCenters'
        },
        {
          title: 'Deleted',
          icon: 'trash',
          to: '/salesCenters/deleted'
        }
      ]
    },
    {
      title: 'Products',
      icon: 'dropbox',
      to: '/products',
      dropdown: [
        {
          title: 'Active',
          icon: 'check',
          to: '/products'
        },
        {
          title: 'Deleted',
          icon: 'trash',
          to: '/products/deleted'
        }
      ]
    },
    {
      title: 'Developer Tools',
      icon: 'github-alt',
      to: '/devtools',
      dropdown: [
        {
          title: 'Request Logs',
          icon: 'history',
          to: '/devtools/request-logs'
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
