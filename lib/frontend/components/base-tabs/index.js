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
    this.setState({
      selectedTab: e
    })
    if (this.props.onChangeTab) {
      this.props.onChangeTab()
    }
  }

  render () {
    return (
      <div className='cards'>
        <h1 className='is-size-4-fullhd is-size-4'>{this.props.tabTitle}</h1>
        <div className={'tabs is-marginless ' + this.props.className}>
          <ul>
            {this.props.tabs.map((item, index) => {
              if (!item.hide && !item.badge) {
                return (
                  <li
                    onClick={(e) => this.selectTab(item.name)}
                    className={this.state.selectedTab === item.name ? 'is-active' : ''}
                    key={index}
                  >
                    <a onClick={(e) => { e.preventDefault() }} >
                      <span className='icon is-small'>
                        <i className={'fa ' + item.icon} />
                      </span>
                      <span>
                        {item.title}
                      </span>
                    </a>
                  </li>
                )
              } else if (!item.hide && item.badge) {
                return (<li
                  onClick={(e) => this.selectTab(item.name)}
                  className={this.state.selectedTab === item.name ? 'is-active' : ''}
                  key={index}>
                  <a onClick={(e) => { e.preventDefault() }}>
                    <span className='icon is-small'>
                      <i className={'fa ' + item.icon} />
                    </span>
                    <span>
                      {item.title}
                    </span>
                    <span className='badge'>{item.valueBadge}</span></a>
                </li>)
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
            if (this.state.selectedTab === item.name && item.reload) {
              return (
                <div
                  className={this.state.selectedTab === item.name ? 'column no-hidden is-paddingless is-clipped' : 'is-hidden'}
                  key={index}
              >
                  {item.content}
                </div>
              )
            } else if (!item.reload) {
              return (
                <div
                  className={
                    this.state.selectedTab === item.name ? 'column no-hidden is-paddingless is-clipped' : 'is-hidden'
                  }
                  key={index}>
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
