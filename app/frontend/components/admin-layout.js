import {isEmpty} from 'lodash'
import React, { Component } from 'react'
import { root } from 'baobab-react/higher-order'

import tree from '~core/tree'

import cookies from '~base/cookies'
import api from '~base/api'
import Loader from '~base/components/spinner'

import Sidebar from '~components/sidebar'
import AdminNavBar from '~components/admin-navbar'

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
  }

  render () {
    if (!this.state.loaded) {
      return <div className='is-flex is-flex-1'><Loader /></div>
    }

    if (!isEmpty(this.state.user)) {
      return (<div className='is-wrapper'>
        <AdminNavBar
          handlePathChange={(p) => this.handlePathChange(p)}
          collapsed={this.state.sidebarCollapsed}
          handleBurgerEvent={() => this.handleBurgerEvent()} />
        <div className='is-flex c-flex-1 columns is-gapless'>
          <Sidebar
            collapsed={this.state.sidebarCollapsed}
            activePath={this.state.activePath} />
          <div className='column is-flex is-flex-column main-wrapper'>
            <section className='c-flex-1 is-flex'>
              {this.props.children}
            </section>
          </div>
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
