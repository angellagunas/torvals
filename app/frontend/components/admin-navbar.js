import React, { Component } from 'react'
import { branch } from 'baobab-react/higher-order'
import { withRouter } from 'react-router'
import env from '~base/env-variables'

import cookies from '~base/cookies'
import api from '~base/api'
import Link from '~base/router/link'
import tree from '~core/tree'

class NavBar extends Component {
  constructor (props) {
    super(props)
    this.state = {
      mobileMenu: 'close',
      profileDropdown: '',
      dropCaret: 'fa fa-caret-down',
      redirect: false,
      navbarBrandCollapsed: false,
      path: '',
      toggleOrgsClass: 'hide-orgs'
    }

    this.setWrapperRef = this.setWrapperRef.bind(this)
    this.handleClickOutside = this.handleClickOutside.bind(this)
  }

  componentWillReceiveProps (nextProps) {
    if (this.state.navbarBrandCollapsed !== nextProps.collapsed) {
      this.setState({ navbarBrandCollapsed: !this.state.navbarBrandCollapsed })
    }
    if (nextProps.location.pathname !== this.state.path) {
      this.setState({ path: nextProps.location.pathname })
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
      this.setState({
        profileDropdown: ''
      })
    }
  }

  async handleLogout () {
    const { history } = this.props

    try {
      await api.del('/user')
    } catch (err) {
      console.log('Error removing token, logging out anyway ...')
    }

    cookies.remove('jwt')
    tree.set('jwt', null)
    tree.set('user', null)
    tree.set('role', null)
    tree.set('organization', null)
    tree.set('loggedIn', false)
    await tree.commit()

    history.push('/landing')
  }

  async changeHandler (slug) {
    tree.set('shouldSelectOrg', false)
    await tree.commit()
    cookies.set('organization', slug)
    var data = env.APP_HOST.split('://')
    window.location = data[0] + '://' + slug + '.' + data[1] + '/dashboard'
  }

  toggleBtnClass () {
    this.setState({
      profileDropdown: this.state.profileDropdown === 'is-active' ? '' : 'is-active'
    })
  }

  toggleOrgs () {
    this.setState({
      dropCaret: this.state.dropCaret === 'fa fa-caret-up' ? 'fa fa-caret-down' : 'fa fa-caret-up',
      toggleOrgsClass: this.state.toggleOrgsClass === 'hide-orgs' ? 'show-orgs' : 'hide-orgs'
    })
  }

  handleNavbarBurgerClick () {
    if (this.state.mobileMenu === 'open') {
      this.setState({ mobileMenu: 'close' })
    } else {
      this.setState({ mobileMenu: 'open' })
    }
  }

  render () {
    let avatar
    let username
    let user = this.props.user
    let org = user.currentOrganization

    if (this.props.loggedIn) {
      avatar = '/public/img/avt-default.jpg'

      if (user) {
        avatar = user.profileUrl
        username = user.name
      }
    }
    return (
      <div>
        <nav className='navbar is-transparent'>
          <div className='navbar-brand'>
            <Link to='/' className='navbar-item'>
              <figure className='image'>
                <img className='logo' src='/app/public/img/oraxh.svg' />
              </figure>
            </Link>
          </div>
          <div className='navbar-menu'>
            <div className='navbar-start'>
              {
                this.props.user.currentRole.slug !== 'manager-level-1' &&
                <div className='navbar-start'>
                  <div className='navbar-burger burger-desktop' onClick={this.props.handleBurgerEvent}>
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              }

              <a className='navbar-item is-size-6 is-capitalized has-text-weight-semibold'
                onClick={() => this.toggleOrgs()}>
                <img className='avatar' src={org.profileUrl} alt='Avatar org' />
                {org.name}
                {
                  user.organizations.length > 1 &&
                  <span className='icon'>
                    <i className={this.state.dropCaret} />
                  </span>
                }
              </a>
            </div>
            <div className='navbar-end'>
              <div className={'navbar-item has-dropdown ' + this.state.profileDropdown}
                ref={this.setWrapperRef}>
                <a className='navbar-link'
                  onClick={() => this.toggleBtnClass()}>
                  <div className='navbar-item is-size-7 is-capitalized has-text-weight-semibold'>
                    {username}
                    <img className='avatar' src={avatar} alt='Avatar' />
                  </div>
                </a>
                <div className='navbar-dropdown is-right'>
                  <Link className='dropdown-item'
                    onClick={() => this.toggleBtnClass()}
                    to='/profile'>
                    <span className='icon'>
                      <i className='fa fa-user-o' />
                    </span>
                    Mi perfil
                  </Link>
                  <a className='dropdown-item'
                    onClick={() => this.handleLogout()}>
                    <span className='icon'>
                      <i className='fa fa-sign-out' />
                    </span>
                    Cerrar sesión
                  </a>
                </div>
              </div>
            </div>
          </div>
        </nav>
        <div className={'columns is-multiline is-mobile orgs ' + this.state.toggleOrgsClass}>
          {
            user.organizations.map((item, key) => {
              if (item.organization.slug !== user.currentOrganization.slug) {
                return (
                  <div className='column is-narrow is-clickable' key={key}>
                    <span className='media is-size-6 is-capitalized has-text-weight-semibold'
                      onClick={() => { this.changeHandler(item.organization.slug) }}>
                      <figure className='media-left image is-32x32'>
                        <img className='avatar' src={item.organization.profileUrl} alt='Avatar org' />
                      </figure>
                      <span className='media-content'>
                        {item.organization.name}
                      </span>
                    </span>
                  </div>
                )
              }
            })
          }
        </div>
      </div>)
  }
}

export default withRouter(branch({
  loggedIn: 'loggedIn',
  'user': 'user'
}, NavBar))
