import React, { Component } from 'react'

class Tabs extends Component {
  componentWillReceiveProps (nextProps) {
    if (this.props.selectedTab !== nextProps.selectedTab) {
      this.setState({
        selectedTab: this.props.selectedTab
      })
    }
  }

  componentWillMount () {
    this.setState({
      selectedTab: this.props.selectedTab
    })
  }

  selectTab (e) {
    if (e.target.innerText.replace(/\s/g, '') !== '') {
      this.setState({
        selectedTab: e.target.innerText.replace(/\s/g, '')
      })
    }
  }

  render () {
    return (
      <div className='card'>
        <div className='tabs is-fullwidth is-toggle is-marginless'>
          <ul>
            {this.props.tabs.map((item, index) => {
              if (!item.hide) {
                return (
                  <li
                    onClick={(e) => this.selectTab(e)}
                    className={this.state.selectedTab === item.name ? 'is-active' : ''}
                    key={index}
                  >
                    <a onClick={(e) => { e.preventDefault() }} >
                      <span className='icon is-small'>
                        <i className={'fa ' + item.icon} />
                      </span>
                      <span>
                        {item.name}
                      </span>
                    </a>
                  </li>
                )
              }
            })}
          </ul>
        </div>
        {this.props.tabs.map((item, index) => {
          if (!item.hide) {
            return (
              <div
                className={this.state.selectedTab === item.name ? 'column no-hidden is-paddingless' : 'is-hidden'}
                key={index}
              >
                {item.content}
              </div>
            )
          }
        })}
      </div>
    )
  }
}

export default Tabs
