import React, { Component } from 'react'
import Link from '~base/router/link'
import FontAwesome from 'react-fontawesome'
import tree from '~core/tree'

class SidebarItem extends Component {
  constructor (props) {
    super(props)
    this.state = {
      open: false,
      active: false
    }

    this.getDropdownButton = this.getDropdownButton.bind(this)
    this.onToggle = this.onToggle.bind(this)
    this.getItemLink = this.getItemLink.bind(this)
  }

  getItemLink (to, icon, title, onClick) {
    let activeLink = to.replace(/\//g, '')
    return (<Link className={this.props.activeItem === activeLink ? 'is-active' : ''} to={to} onClick={() => onClick(activeLink)}>
      <span className='icon'>
        <FontAwesome name={icon} />
      </span>
      <span>{title}</span>
    </Link>)
  }

  getDropdownButton (to, icon, title, toggle) {
    var mainPath = new RegExp(to)
    return (<a href='javascript:void(0)' className={mainPath.test(this.props.activeItem) ? 'is-active' : ''} onClick={() => toggle()}>
      <span className='icon'>
        <FontAwesome name={icon} />
      </span>
      <span>{title}</span>
      <span className='icon is-pulled-right'>
        <FontAwesome name={this.state.open ? 'angle-down' : 'angle-right'} />
      </span>
    </a>)
  }

  onToggle () {
    this.setState({open: !this.state.open})
  }

  testRoles (roles) {
    if (!roles) return true
    let rolesList = roles.split(',')
    let user = tree.get('user')
    let test = false

    for (var role of rolesList) {
      role = role.trim()
      if (role && user && user.role && user.role.slug === role) {
        test = true
      }
    }

    return test
  }

  render () {
    let {title, icon, to, dropdown, onClick, roles} = this.props
    let mainLink = this.getItemLink(to, icon, title, onClick)
    let ulDropdown

    if (!this.testRoles(roles)) return null

    if (dropdown) {
      mainLink = this.getDropdownButton(to, icon, title, this.onToggle)
      ulDropdown = (<ul className={this.state.open ? '' : 'is-hidden'}>
        {dropdown.map((e, i) => {
          if (!this.testRoles(e.roles)) return null

          return (
            <li key={e.title.toLowerCase().replace(/\s/g, '')}>
              {this.getItemLink(e.to, e.icon, e.title, onClick)}
            </li>
          )
        })}
      </ul>)
    }

    return (<li>
      {mainLink}
      {ulDropdown}
    </li>)
  }
}

export default SidebarItem
