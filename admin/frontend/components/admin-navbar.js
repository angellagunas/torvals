import React, { Component } from 'react'
import { branch } from 'baobab-react/higher-order'
import { withRouter } from 'react-router'

import api from '~base/api'
import Link from '~base/router/link'
import tree from '~core/tree'
import classNames from 'classnames'

class NavBar extends Component {
  constructor (props) {
    super(props)
    this.state = {
      mobileMenu: 'close',
      profileDropdown: 'is-hidden',
      dropCaret: 'fa fa-caret-down',
      redirect: false,
      navbarBrandCollapsed: false,
      path: ''
    }

    this.setWrapperRef = this.setWrapperRef.bind(this)
    this.handleClickOutside = this.handleClickOutside.bind(this)
  }

  componentWillReceiveProps (nextProps) {
    if (this.state.navbarBrandCollapsed !== nextProps.collapsed) {
      this.setState({navbarBrandCollapsed: !this.state.navbarBrandCollapsed})
    }
    if (nextProps.location.pathname !== this.state.path) {
      this.setState({path: nextProps.location.pathname})
      this.props.handlePathChange(nextProps.location.pathname)
    }
  }

  componentDidMount () {
    document.addEventListener('mousedown', this.handleClickOutside)
  }

  componentWillUnmount () {
    document.removeEventListener('mousedown', this.handleClickOutside)
  }

  setWrapperRef (node) {
    this.wrapperRef = node
  }

  handleClickOutside (event) {
    if (this.wrapperRef && !this.wrapperRef.contains(event.target)) {
      this.setState({ 'profileDropdown': 'is-hidden', 'dropCaret': 'fa fa-caret-down' })
    }
  }

  async handleLogout () {
    const {history} = this.props

    try {
      await api.del('/user')
    } catch (err) {
      console.log('Error removing token, logging out anyway ...')
    }

    window.localStorage.removeItem('jwt')
    tree.set('jwt', null)
    tree.set('user', null)
    tree.set('loggedIn', false)
    tree.commit()

    history.push('/admin/')
  }

  toggleBtnClass () {
    if (this.wrapperRef) {
      if (this.state.profileDropdown === 'is-hidden') {
        this.setState({ 'profileDropdown': 'is-active', 'dropCaret': 'fa fa-caret-up' })
      } else {
        this.setState({ 'profileDropdown': 'is-hidden', 'dropCaret': 'fa fa-caret-down' })
      }
    }
  }

  handleNavbarBurgerClick () {
    if (this.state.mobileMenu === 'open') {
      this.setState({mobileMenu: 'close'})
    } else {
      this.setState({mobileMenu: 'open'})
    }
  }

  render () {
    var navButtons
    let avatar
    let username
    let user = tree.get('user')
    if (this.props.loggedIn) {
      avatar = '/public/img/avt-default.jpg'

      if (user) {
        avatar = user.profileUrl
        username = user.name
      }

      navButtons = (<div className='dropdown-content'>
        <Link className='dropdown-item' onClick={() => this.toggleBtnClass()} to='/profile'>Profile</Link>
        <a className='dropdown-item' onClick={() => this.handleLogout()}>
          Logout
        </a>
      </div>)
    }

    const navbarBrand = classNames('c-topbar__aside navbar-brand', {
      'collapsed': this.state.navbarBrandCollapsed
    })

    return (<nav className='c-topbar navbar c-fixed'>
      <div className={navbarBrand}>
        <Link to='/dashboard' className='navbar-item'>
          <img className='is-flex r-pad' src='/admin/public/img/pythia-logo.png' />
          <h3 className='is-size-4 has-text-white is-capitalized has-text-weight-semibold'>Pythia</h3>
        </Link>
      </div>
      <div className='c-topbar__main'>
        <div className='navbar-menu-container has-bg-color has-text-white'>
          <div className='navbar-start'>
            <div className='navbar-burger burger-desktop' onClick={this.props.handleBurgerEvent}>
              <span />
              <span />
              <span />
            </div>
          </div>
          <div className='navbar-end'>
            <div className='navbar-item is-size-7 has-text-white is-capitalized'>
              Bienvenido { username }
            </div>
            <div className='is-flex is-align-center'>
              <img className='is-rounded avatar' src={avatar} width='40' height='40' alt='Avatar' />
            </div>
            <div className='dropdown is-active is-right' ref={this.setWrapperRef}>
              <div className='dropdown-trigger is-flex'>
                <a href='javascript:undefined' className='navbar-item has-bg-hover has-text-white' onClick={() => this.toggleBtnClass()}>
                  <span className='icon'>
                    <i className={this.state.dropCaret} />
                  </span>
                </a>
              </div>
              <div className={this.state.profileDropdown}>
                <div className='dropdown-menu' id='dropdown-menu' role='menu'>{ navButtons }</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>)
  }
}

export default withRouter(branch({
  loggedIn: 'loggedIn'
}, NavBar))
