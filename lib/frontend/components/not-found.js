import React, {Component} from 'react'

class NotFound extends Component {
  render () {
    return (
      <div className='container-not-found'>
        <div className='boo-wrapper'>
          <div className='boo'>
            <div className='face' />
          </div>
          <div className='shadow' />
          <h1>Oops!</h1>
          <p>No podemos encontrar {this.props.msg || 'esta página'}</p>
        </div>
      </div>
    )
  }
}

export default NotFound
