import React, { Component } from 'react'
import FontAwesome from 'react-fontawesome'

class SidePanel extends Component {
  constructor (props) {
    super(props)
    this.state = {
      toggled: true
    }
  }
  onToggle = (e) => {
    e.preventDefault()
    this.setState({ toggled: !this.state.toggled })
  }
  render () {
    if (this.state.toggled) {
      return (
        <div className={this.props.sidePanelClassName}>
          <a
            className='card-header-icon has-text-white'
            aria-label='more options'
            onClick={this.onToggle}
          >
            <FontAwesome name={this.props.icon} />
          </a>
        </div>
      )
    }
    return (
      <div className='column is-narrow is-paddingless z100 offcanvas'>
        <div className='card dark-card'>
          <header className='card-header'>
            <p className='card-header-title'>
              {this.props.title}
            </p>
            <a
              className='card-header-icon'
              aria-label='more options'
              onClick={this.onToggle}
            >
              <span className='icon'>
                <FontAwesome name='times' />
              </span>
            </a>
          </header>
            <div className='panel-block'>
              {this.props.content}
            </div>
        </div>
      </div>
    )
  }
}

export default SidePanel
