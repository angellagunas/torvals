import React, { Component } from 'react'
import { branch } from 'baobab-react/higher-order'
import { withRouter } from 'react-router'

import cookies from '~base/cookies'
import Image from '~base/components/image'
import Link from '~base/router/link'
import tree from '~core/tree'
import SelectOrganizationForm from '~base/components/select-organization'

class NavBar extends Component {
  constructor (props) {
    super(props)
    this.state = {
      mobileMenu: 'close',
      profileDropdown: 'is-hidden',
      dropCaret: 'fa fa-caret-down',
      redirect: false
    }

    this.setWrapperRef = this.setWrapperRef.bind(this)
    this.handleClickOutside = this.handleClickOutside.bind(this)
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

    cookies.remove('jwt')
    tree.set('jwt', null)
    tree.set('user', null)
    tree.set('role', null)
    tree.set('organization', null)
    tree.set('loggedIn', false)
    await tree.commit()

    history.push('/')
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
    let user = this.props.user

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

    return (<nav className='c-topbar navbar c-fixed'>
      <div className='c-topbar__aside navbar-brand'>
        <Link to='/' className='navbar-item'>
          <img className='is-flex' src='/admin/public/img/pythia-logo.png' />
        </Link>
      </div>
      <div className='c-topbar__main'>
        <div className='navbar-menu'>
          <div className='navbar-start'>
            <div className='navbar-select'>
              <SelectOrganizationForm />
            </div>
          </div>
          <div className='navbar-end'>
            <div className='navbar-item is-size-7 has-text-grey is-capitalized'>
              Bienvenido { username }
            </div>
            <div className='is-flex is-align-center'>
              <img className='is-rounded avatar' src={avatar} width='40' height='40' alt='Avatar' />
            </div>
            <div className='dropdown is-active is-right' ref={this.setWrapperRef}>
              <div className='dropdown-trigger is-flex'>
                <a href='javascript:undefined' className='navbar-item' onClick={() => this.toggleBtnClass()}>
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
  loggedIn: 'loggedIn',
  'user': 'user'
}, NavBar))
