import {isEmpty} from 'lodash'
import React, { Component } from 'react'
import { root } from 'baobab-react/higher-order'

import tree from '~core/tree'
import classNames from 'classnames'

import cookies from '~base/cookies'
import api from '~base/api'
import Loader from '~base/components/spinner'

import Sidebar from '~components/sidebar'
import AdminNavBar from '~components/admin-navbar'
import { ToastContainer } from 'react-toastify'


class AdminLayout extends Component {
  constructor (props) {
    super(props)
    this.state = {
      user: {},
      loaded: false,
      sidebarCollapsed: false,
      activePath: ''
    }
  }

  handleBurgerEvent () {
    this.setState({sidebarCollapsed: !this.state.sidebarCollapsed})
  }

  handlePathChange (activePath) {
    this.setState({activePath})
  }

  async componentWillMount () {
    const userCursor = tree.select('user')

    userCursor.on('update', ({data}) => {
      const user = data.currentData
      this.setState({user})
    })

    var me
    if (tree.get('jwt')) {
      try {
        me = await api.get('/user/me')
      } catch (err) {
        if (err.status === 401) {
          cookies.remove('jwt')
          tree.set('jwt', null)
          tree.set('user', null)
          tree.set('organization', null)
          tree.set('role', null)
          tree.commit()
        }

        return this.setState({loaded: true})
      }

      tree.set('user', me.user)
      tree.set('organization', me.user.currentOrganization)
      tree.set('role', me.user.currentRole)
      tree.set('loggedIn', me.loggedIn)
      tree.commit()

      if (!me.user.currentOrganization) {
        cookies.remove('jwt')
        tree.set('jwt', null)
        tree.set('user', null)
        tree.set('organization', null)
        tree.set('role', null)
        tree.set('loggedIn', false)
        await tree.commit()
      }
    }

    this.setState({loaded: true})
    this.getViewPort()
  }

  getViewPort () {
    let w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0)
    if (w <= 1024) {
      this.setState({
        sidebarCollapsed: false
      })
    }
  }

  openNav = () => {
    this.setState({
      open: this.state.open === 'open' ? '' : 'open'
    })
  }

  render () {
    const mainClass = classNames('main-wrapper',{
      'sidenav-open': this.state.sidebarCollapsed
    })

    const burguerIcon = classNames('fa fa-2x',{
      'fa-times': this.state.sidebarCollapsed,
      'fa-bars': !this.state.sidebarCollapsed,
    })

    if (!this.state.loaded) {
      return <Loader />
    }
    if (!isEmpty(this.state.user)) {
      return (
        <div className='is-wrapper'>
          <AdminNavBar
            handlePathChange={(p) => this.handlePathChange(p)}
            collapsed={this.state.sidebarCollapsed}
            handleBurgerEvent={() => this.handleBurgerEvent()} />
          
          
          { this.state.user.currentRole.slug !== 'manager-level-1' &&
          <div>
          <div className='icon is-large is-clickable is-hamburguer'
          onClick={() => {this.handleBurgerEvent()}}>
          <i className={burguerIcon} />
          </div>
          <Sidebar
            collapsed={this.state.sidebarCollapsed}
            activePath={this.state.activePath} />
           </div> 
          }

          <div className={mainClass}>
            <section className='card main'>
              {this.props.children}
              <ToastContainer />
            </section>
          </div>
        </div>)
    } else {
      return (<div>
        {this.props.children}
      </div>)
    }
  }
}

export default root(tree, AdminLayout)
