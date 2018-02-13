import React, { Component } from 'react'

class CustomDate extends Component {
  render () {
    return (
      <div>
        <button
          title={this.props.placeholder}
          className='button'
          onClick={this.props.onClick}>
          <span className='icon is-medium'>
            <i className='fa fa-calendar' />
          </span>
          <span>
            {this.props.value || this.props.placeholder}
          </span>
        </button>
      </div>
    )
  }
}

export default CustomDate
