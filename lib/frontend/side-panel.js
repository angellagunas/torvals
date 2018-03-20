import React, { Component } from 'react'
import FontAwesome from 'react-fontawesome'
import styled from 'styled-components'


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

  isNotListPage () {
    const Sidenav = styled.div`
      height: 100%;
      width: ${(props) => !props.toggled ? 'inherit' : '0'};
      position: fixed;
      z-index: 100;
      top: 52px;
      right: 0;
      overflow-x: hidden;
      transition: width 1.5s ease;
    `
  
    return (
      <Sidenav className='offcanvas'>
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
          <div className='panel-block has-text-centered'>
            {this.props.content}
          </div>
        </div>
      </Sidenav>
    )
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
    if (this.props.noListPage){
      return this.isNotListPage()
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
