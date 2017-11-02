import React, { Component } from 'react'
import request from '~core/request'
import { Redirect } from 'react-router-dom'
import Loader from '~base/components/spinner'

class App extends Component {
  constructor (props) {
    super(props)
    this.state = {
      loading: false
    }
  }

  componentWillMount () {
    
  }

  render () {
    const {loading, posts} = this.state

    if (loading) {
      return <div className='is-flex is-flex-1'><Loader /></div>
    }

    if (this.state.redirect) {
      return <Redirect to='/log-in' />
    }

    

    return (
      <div className='App'>
        <div className='App-header'>
          <h2></h2>
        </div>
        
      </div>
    )
  }
}

export default App
