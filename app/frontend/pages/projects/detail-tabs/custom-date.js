import React, { Component } from 'react'

class CustomDate extends Component {
  render () {
    return (
      <div>
        <button
          title={this.props.placeholder}
          className='button date-selector'
          onClick={this.props.onClick}>
          <span className={this.props.value ? 'icon is-medium' : 'icon is-medium has-text-grey-lighter'}>
            <i className='fa fa-calendar' />
          </span>
          {this.props.value
          ? <span>
            {this.props.value}
          </span>
          : <span className='has-text-grey-lighter'>
            {this.props.placeholder}
          </span>
          }
        </button>
      </div>
    )
  }
}

export default CustomDate
