import React, { Component } from 'react'

class Tabs extends Component {
  componentWillReceiveProps (nextProps) {
    if (this.props.selectedTab !== nextProps.selectedTab) {
      this.setState({
        selectedTab: nextProps.selectedTab
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
      this.props.onChangeTab(e)
    }
  }

  render () {
    return (
      <div>
        <div className={'tabs is-marginless ' + this.props.className}>
          <div className='tabs-title'>
            <h1 title={this.props.tabTitle}>{this.props.tabTitle}</h1>
          </div>
          <ul>
            {this.props.tabs.map((item, index) => {
              if (!item.hide && !item.badge) {
                return (
                  <li
                    onClick={(e) => this.selectTab(item.name)}
                    className={
                      this.state.selectedTab === item.name ? 'is-active'
                      : item.disabled ? 'tab-disabled' : ''}
                    key={index}
                  >
                    <a onClick={(e) => { e.preventDefault() }} >
                      {item.icon &&
                      <span className='icon is-small'>
                        <i className={'fa ' + item.icon} />
                      </span>
                      }
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
                    {item.icon &&
                    <span className='icon is-small'>
                      <i className={'fa ' + item.icon} />
                    </span>
                    }
                    <span>
                      {item.title}
                    </span>
                    {!!item.valueBadge && <span className='badge'><span>{item.valueBadge}</span></span>}
                  </a>
                </li>)
              }
            })}

          </ul>

          {
              this.props.extraTab &&
              <ul className='is-right'>
                <li>
                  {this.props.extraTab}
                </li>
              </ul>
            }

        </div>
        {this.props.tabs.map((item, index) => {
          if (!item.hide) {
            if (this.state.selectedTab === item.name && item.reload) {
              return (
                <div
                  className={this.state.selectedTab === item.name ? '' : 'is-hidden'}
                  key={index}
              >
                  {item.content}
                </div>
              )
            } else if (!item.reload) {
              return (
                <div
                  className={
                    this.state.selectedTab === item.name ? '' : 'is-hidden'
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