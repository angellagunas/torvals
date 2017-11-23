import React, { Component } from 'react'
import { Redirect } from 'react-router-dom'
import Loader from '~base/components/spinner'
import Page from '~base/page'
import {loggedIn} from '~base/middlewares/'

class App extends Component {
  constructor (props) {
    super(props)
    this.state = {
      loading: false
    }
  }

  render () {
    const {loading} = this.state

    if (loading) {
      return <div className='is-flex is-flex-1'><Loader /></div>
    }

    if (this.state.redirect) {
      return <Redirect to='/log-in' />
    }

    return (
      <div className='App'>
        <div className='App-header'>
          <h2 />
        </div>

      </div>
    )
  }
}

export default Page({
  path: '/',
  title: 'Dashboard',
  icon: 'github',
  exact: true,
  validate: loggedIn,
  component: App
})
