import React, { Component } from 'react'
import DeleteButton from '~base/components/base-deleteButton'

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
    if (this.props.onChangeTab) {
      this.props.onChangeTab()
    }
  }

  render () {
    return (
      <div className='cards'>
        <div className={'tabs is-marginless ' + this.props.className}>
          <h1 className='is-size-3'>{this.props.tabTitle}</h1>
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
            {
              this.props.extraTab &&
              <li>
                {this.props.extraTab}
              </li>
            }
          </ul>
        </div>
        {this.props.tabs.map((item, index) => {
          if (!item.hide) {
            if (this.state.selectedTab === item.name) {
              return (
                <div
                  className={this.state.selectedTab === item.name ? 'column no-hidden is-paddingless' : 'is-hidden'}
                  key={index}
              >
                  {item.content}
                </div>
              )
            }
          }
        })}
      </div>
    )
  }
}

export default Tabs
