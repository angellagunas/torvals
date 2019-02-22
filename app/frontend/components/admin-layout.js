import {isEmpty} from 'lodash'
import React, { Component } from 'react'
import { injectIntl } from 'react-intl'
import { root } from 'baobab-react/higher-order'

import tree from '~core/tree';
import classNames from 'classnames';

import cookies from '~base/cookies'
import api from '~base/api'
import Loader from '~base/components/spinner'

import Sidebar from '~components/sidebar'
import AdminNavBar from '~components/admin-navbar'
import { ToastContainer } from 'react-toastify'
import { withRouter } from 'react-router'
import BillingForm from '../pages/organizations/billing-form'
import { toast } from 'react-toastify'

class AdminLayout extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user: {},
      loaded: false,
      sidebarCollapsed: false,
      activePath: '',
      activateModal: ''
    }

    this.orgStatus = {
      'trial': this.formatTitle('organizations.orgStatusTrial'),
      'active': this.formatTitle('organizations.orgStatusActive'),
      'inactive': this.formatTitle('organizations.orgStatusInactive'),
      'activationPending': this.formatTitle('organizations.orgStatusActivationPending')
    }
  }

  handleBurgerEvent() {
    this.setState({ sidebarCollapsed: !this.state.sidebarCollapsed });
  }

  formatTitle (id) {
    return this.props.intl.formatMessage({ id: id })
  }

  handlePathChange (activePath) {
    this.setState({activePath})
  }

  async componentWillMount () {
    const userCursor = tree.select('user')
    let activated = ''

    userCursor.on('update', ({ data }) => {
      const user = data.currentData;
      this.setState({ user });
    });

    let me;
    if (tree.get('jwt')) {
      try {
        me = await api.get('/v2/auth/me');
      } catch (err) {
        if (err.status === 401) {
          cookies.remove('jwt')
          cookies.remove('organization')
          tree.set('jwt', null)
          tree.commit()
          window.localStorage.setItem('name', '')
          window.localStorage.setItem('email', '')
        }

        return this.setState({ loaded: true });
      }

      tree.set('user', me.user);
      tree.set('loggedIn', true);
      tree.commit();
      window.localStorage.setItem('lang', 'es-MX')
      window.localStorage.setItem('name', me.name)
      window.localStorage.setItem('email', me.email)
      window.localStorage.setItem('_user', me.id)
    }

    this.setState({loaded: true})
    this.getViewPort()
  }

  getViewPort() {
    let w = Math.max(
      document.documentElement.clientWidth,
      window.innerWidth || 0
    );
    if (w <= 1024) {
      this.setState({
        sidebarCollapsed: false,
      });
    }
  }

  openNav = () => {
    this.setState({
      open: this.state.open === 'open' ? '' : 'open',
    });
  };

  openWizards() {
    this.setState({
      openWizards: this.state.openWizards === 'is-active' ? '' : 'is-active'
    })
  }

  render () {
    const mainClass = classNames('main-wrapper',{
      'sidenav-open': this.state.sidebarCollapsed
    })

    const burguerIcon = classNames('fa fa-2x', {
      'fa-times': this.state.sidebarCollapsed,
      'fa-bars': !this.state.sidebarCollapsed,
    });

    if (!this.state.loaded) {
      setTimeout(() => {
        if (!this.state.loaded) window.location.reload(false)
      }, 2000)
      return <Loader />;
    }
    if (!isEmpty(this.state.user)) {
      return (
        <div className="is-wrapper">
          <AdminNavBar
            handlePathChange={p => this.handlePathChange(p)}
            collapsed={this.state.sidebarCollapsed}
            handleBurgerEvent={() => this.handleBurgerEvent()}
            openWizards={() => this.openWizards()} />
          <div>
            <div className='icon is-large is-clickable is-hamburguer'
              onClick={() => {this.handleBurgerEvent()}}>
                <i className={burguerIcon} />
            </div>
            <Sidebar
              collapsed={this.state.sidebarCollapsed}
              activePath={this.state.activePath} />
          </div>

          <div className={mainClass}>
            <section className='card main'>
              {this.props.children}
              <ToastContainer />
            </section>
          </div>
        </div>
      );
    } else {
      return <div>{this.props.children}</div>;
    }
  }
}

export default withRouter(injectIntl(root(tree, AdminLayout)))
