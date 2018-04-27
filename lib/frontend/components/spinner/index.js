import React, { Component } from 'react'
import Spinner from 'react-spinkit'

class Loader extends Component {
  render () {
    return (<div className='columns is-centered'>
      <div className='column is-half is-narrow has-text-centered'>
        <div>
          <Spinner name='line-scale' className='has-text-primary' />
        </div>
      </div>
    </div>)
  }
}

export default Loader
