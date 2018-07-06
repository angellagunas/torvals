import React, { Component } from 'react'
import NavLink from '~base/router/navlink'
import FontAwesome from 'react-fontawesome'
import classNames from 'classnames'
import tree from '~core/tree'

class SidebarItem extends Component {
  constructor (props) {
    super(props)
    this.state = {
      open: false,
      menuIsCollapsed: true,
      openLvl2: false,
      menuLvl2IsCollapsed: true
    }

    this.getDropdownButton = this.getDropdownButton.bind(this)
    this.getItemLink = this.getItemLink.bind(this)
  }

  componentDidMount () {
    this.setState({
      open: this.props.opened,
      openLvl2: this.props.openedLvl2
    })
  }

  componentWillReceiveProps (nextProp) {
    const { to, activeItem, dropdownOnClick, index } = this.props
    const mainPath = new RegExp(to.replace(/\//g, ''))

    if (nextProp.collapsed !== this.state.menuIsCollapsed) {
      this.setState({menuIsCollapsed: nextProp.collapsed}, function () {
        if (mainPath.test(activeItem) && !nextProp.collapsed) {
          dropdownOnClick(index)
        }
      })
    }
    if (nextProp.status !== this.state.open) {
      this.setState({open: nextProp.status})
    }
  }

  getItemLink (to, icon, title, onClick, exact) {
    return (<NavLink exact={exact}
      activeClassName='is-active'
      to={to}
    >
      <span className='icon'>
        <FontAwesome name={icon} />
      </span>
      <span className='item-link-title'> {title}</span>
    </NavLink>)
  }

  getDropdownButton (to, icon, title, toggle, dropdownItems, isLvl2, index) {
    const mainPath = new RegExp(to.replace(/\//g, ''))
    const isActive = mainPath.test(this.props.activeItem)

    const arrowColorClass = classNames('icon is-pulled-right', {
      'has-text-dark': !isActive,
      'has-text-primary': isActive
    })
    const dropdownClass = classNames('', {
      'dropdown': isLvl2 ? this.state.menuLvl2IsCollapsed : this.state.menuIsCollapsed,
      'is-active': isActive
    })

    if (this.state.menuIsCollapsed) {
      return (<div
        className={dropdownClass}
        onMouseEnter={() => toggle(this.props.index)}
        onMouseLeave={() => toggle(this.props.index)}
        href='javascript:void(0)' >
        <span className='icon'>
          <FontAwesome name={icon} />
        </span>
        {dropdownItems}
      </div>)
    }

    let open = this.state.open
    if (isLvl2) {
      open = this.state.openLvl2
    }
    return (<div>
      <a href='javascript:void(0)'
        className={isActive ? 'is-active' : ''}
        onClick={() => toggle(this.props.index, index)}>
        <span className='icon'>
          <FontAwesome name={icon} />
        </span>
        <span className='item-link-title'> {title}</span>
        <span className={arrowColorClass}>
          <FontAwesome name={open ? 'angle-down' : 'angle-right'} />
        </span>
      </a>
      {dropdownItems}
    </div>)
  }

  onToggleLvl2 = () => {
    this.setState({openLvl2: !this.state.openLvl2})
  }

  testRoles (roles) {
    if (!roles) return true
    let rolesList = roles.split(',')
    let currentRole = tree.get('role')
    let test = false

    for (var role of rolesList) {
      role = role.trim()
      if (role && currentRole && currentRole.slug === role) {
        test = true
      }
    }

    return test
  }

  getDropdownItemsLvl2 (dropdown, to, icon, title, onClick, dropdownOnClick, index) {
    let dropdownItems = (
      <ul className={this.state.openLvl2 ? '' : 'is-hidden'}>
        {dropdown.length > 0 && dropdown.map((e, i) => {
          if (!this.testRoles(e.roles)) return null
          return (
            <li key={e.title.toLowerCase().replace(/\s/g, '')}>
              {this.getItemLink(e.to, e.icon, e.title, onClick, e.exact)}
            </li>
          )
        })}
      </ul>)
    return this.getDropdownButton(to, icon, title, this.onToggleLvl2, dropdownItems, true, index)
  }

  getDropdownItems (dropdown, to, icon, title, onClick, dropdownOnClick) {
    let dropdownItems = (
      <ul className={this.state.open ? '' : 'is-hidden'}>
        {dropdown.length > 0 && dropdown.filter(item => item).map((e, i) => {
          if (!this.testRoles(e.roles)) return null
          if (e.dropdown) {
            return (
              <li key={e.title.toLowerCase().replace(/\s/g, '')}>
                {
                  this.getDropdownItemsLvl2(e.dropdown, e.to, e.icon, e.title, onClick, dropdownOnClick, i)
                }
              </li>
            )
          } else {
            return (
              <li key={e.title.toLowerCase().replace(/\s/g, '')}>
                {this.getItemLink(e.to, e.icon, e.title, onClick, e.exact)}
              </li>
            )
          }
        })}
      </ul>)
    return this.getDropdownButton(to, icon, title, dropdownOnClick, dropdownItems)
  }
  render () {
    let {title, icon, to, dropdown, onClick, dropdownOnClick, roles, exact} = this.props
    let mainLink = this.getItemLink(to, icon, title, onClick, exact)
    let dropdownItems

    if (!this.testRoles(roles)) return null

    if (dropdown) {
      /* dropdownItems = (
        <ul className={this.state.open ? '' : 'is-hidden'}>
          {dropdown.length > 0 && dropdown.map((e, i) => {
            if (!this.testRoles(e.roles)) return null
            console.log(e)

            if(e.dropdown){

            }
            return (
              <li key={e.title.toLowerCase().replace(/\s/g, '')}>
                {this.getItemLink(e.to, e.icon, e.title, onClick, e.exact)}
              </li>
            )
          })}
        </ul>)
      mainLink = this.getDropdownButton(to, icon, title, dropdownOnClick, dropdownItems) */

      mainLink = this.getDropdownItems(dropdown, to, icon, title, onClick, dropdownOnClick)
    }

    return (<li>
      {mainLink}
    </li>)
  }
}

export default SidebarItem
