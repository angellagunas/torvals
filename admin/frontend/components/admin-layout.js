import {isEmpty} from 'lodash'
import React, { Component } from 'react'
import { root } from 'baobab-react/higher-order'

import api from '~base/api'
import tree from '~core/tree'

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
          window.localStorage.removeItem('jwt')
          tree.set('jwt', null)
          tree.commit()
        }

        this.setState({loaded: true})
        return
      }

      if (!me.user.isAdmin) {
        const {history} = this.props

        window.localStorage.removeItem('jwt')
        tree.set('jwt', null)
        tree.set('user', null)
        tree.set('loggedIn', false)
        tree.commit()

        history.push('/')
      }

      tree.set('user', me.user)
      tree.set('loggedIn', me.loggedIn)
      tree.commit()
    }

    this.setState({loaded: true})
  }

  handleBurgerEvent () {
    this.setState({sidebarCollapsed: !this.state.sidebarCollapsed})
  }

  handlePathChange (activePath) {
    this.setState({activePath})
  }

  render () {
    if (!this.state.loaded) {
      return <div>Loading...</div>
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
