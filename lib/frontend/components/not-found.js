import React, {Component} from 'react'
import { FormattedMessage } from 'react-intl'

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
          <p><FormattedMessage
            id='notFound.title'
            defaultMessage={`No pudimos encontrar`}
            /> {this.props.msg || 'esta página'}</p>
        </div>
      </div>
    )
  }
}

export default NotFound
