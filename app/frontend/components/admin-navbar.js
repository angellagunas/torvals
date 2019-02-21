import React, { Component } from 'react'
import { FormattedMessage } from 'react-intl'
import { branch } from 'baobab-react/higher-order'
import { withRouter } from 'react-router'
import env from '~base/env-variables'

import cookies from '~base/cookies';
import api from '~base/api';
import Link from '~base/router/link';
import tree from '~core/tree';

class NavBar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      mobileMenu: 'close',
      profileDropdown: '',
      dropCaret: 'fa fa-caret-down',
      redirect: false,
      navbarBrandCollapsed: false,
      path: '',
      toggleOrgsClass: 'hide-orgs',
    };

    this.setWrapperRef = this.setWrapperRef.bind(this);
    this.handleClickOutside = this.handleClickOutside.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (this.state.navbarBrandCollapsed !== nextProps.collapsed) {
      this.setState({ navbarBrandCollapsed: !this.state.navbarBrandCollapsed });
    }
    if (nextProps.location.pathname !== this.state.path) {
      this.setState({ path: nextProps.location.pathname });
      this.props.handlePathChange(nextProps.location.pathname);
    }
    this.stepsRemaining()
  }

  componentDidMount () {
    document.addEventListener('mousedown', this.handleClickOutside)
    this.stepsRemaining()
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutside);
  }

  setWrapperRef(node) {
    this.wrapperRef = node;
  }

  handleClickOutside(event) {
    if (this.wrapperRef && !this.wrapperRef.contains(event.target)) {
      this.setState({
        profileDropdown: '',
      });
    }
  }

  async handleLogout() {
    const { history } = this.props;

    try {
      await api.del('/user');
    } catch (err) {
      console.log('Error removing token, logging out anyway ...');
    }

    cookies.remove('jwt')
    cookies.remove('organization')
    tree.set('jwt', null)
    tree.set('user', null)
    tree.set('role', null)
    tree.set('organization', null)
    tree.set('loggedIn', false)
    await tree.commit()
    window.localStorage.setItem('name', '')
    window.localStorage.setItem('email', '')
    window.localStorage.removeItem('_user')

    history.push('/log-in');
  }

  async changeHandler(slug) {
    tree.set('shouldSelectOrg', false);
    await tree.commit();
    cookies.set('organization', slug);
    const hostname = window.location.hostname;
    const hostnameSplit = hostname.split('.');

    if (env.ENV === 'production') {
      if (hostname.indexOf('stage') >= 0 || hostname.indexOf('staging') >= 0) {
        const newHostname = hostnameSplit.slice(-3).join('.');
        window.location = `//${slug}.${newHostname}/dashboard`;
      } else {
        const newHostname = hostnameSplit.slice(-2).join('.');
        window.location = `//${slug}.${newHostname}/dashboard`;
      }
    } else {
      const baseUrl = env.APP_HOST.split('://');
      window.location =
        baseUrl[0] + '://' + slug + '.' + baseUrl[1] + '/dashboard';
    }
  }

  toggleBtnClass() {
    this.setState({
      profileDropdown:
        this.state.profileDropdown === 'is-active' ? '' : 'is-active',
    });
  }

  toggleOrgs() {
    this.setState({
      dropCaret:
        this.state.dropCaret === 'fa fa-caret-up'
          ? 'fa fa-caret-down'
          : 'fa fa-caret-up',
      toggleOrgsClass:
        this.state.toggleOrgsClass === 'hide-orgs' ? 'show-orgs' : 'hide-orgs',
    });
  }

  handleNavbarBurgerClick() {
    if (this.state.mobileMenu === 'open') {
      this.setState({ mobileMenu: 'close' });
    } else {
      this.setState({ mobileMenu: 'open' });
    }
  }

  stepsRemaining () {
    this.setState({
      steps: 0
    })
  }
  showModalWizards () {
    this.props.openWizards()
  }

  render () {
    let avatar = 'https://cdn.orax.io/avatars/default.jpg';
    let username = window.localStorage.getItem('email');

    return (
      <div>
        <nav className="navbar is-transparent">
          <div className="navbar-brand">
            <Link to="/" className="navbar-item">
              <figure className="image">
                <img className="logo" src="/app/public/img/oraxh.svg" />
              </figure>
            </Link>
          </div>
          <div className='navbar-menu'>
            <div className='navbar-start'>
              <a
                className="navbar-item is-size-6 is-capitalized has-text-weight-semibold"
                onClick={() => this.toggleOrgs()}
              >
                <img className="avatar" src="https://cdn.orax.io/logos/6ea527eb-657d-4995-83e0-e54174523520/profile.jpg" alt="Avatar org" />
                Orax Ecuador
              </a>
            </div>
            <div className='navbar-end'>
              <div className={'navbar-item has-dropdown ' + this.state.profileDropdown}
                ref={this.setWrapperRef}>
                <a className='navbar-link'
                  onClick={() => this.toggleBtnClass()}>
                  <div className='navbar-item is-size-7 is-capitalized has-text-weight-semibold'>
                    {username}
                    <img className="avatar" src={avatar} alt="Avatar" />
                  </div>
                </a>
                <div className="navbar-dropdown is-right">
                  <a
                    className="dropdown-item"
                    onClick={() => this.handleLogout()}
                  >
                    <span className="icon">
                      <i className="fa fa-sign-out" />
                    </span>
                    <FormattedMessage
                      id='navbar.signOut'
                      defaultMessage={`Cerrar sesión`}
                    />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </nav>
      </div>
    );
  }
}

export default withRouter(
  branch(
    {
      loggedIn: 'loggedIn',
      user: 'user',
    },
    NavBar
  )
);
