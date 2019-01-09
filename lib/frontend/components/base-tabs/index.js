import React, { Component } from 'react'
import { trackPage } from '~base/components/with-tracker'

class Tabs extends Component {
  componentWillReceiveProps (nextProps) {
    if (this.props.selectedTab !== nextProps.selectedTab) {
      this.setState({
        selectedTab: nextProps.selectedTab
      })
    }
  }

  abbreviateNumber = (number = 0) => {
    const POSTFIXES = ["", "k", "M", "B", "T"];

    // what tier? (determines SI prefix)
    const tier = Math.log10(Math.abs(number)) / 3 | 0;

    // if zero, we don't need a prefix
    if(tier == 0) return number;

    // get postfix and determine scale
    const postfix = POSTFIXES[tier];
    const scale = Math.pow(10, tier * 3);

    // scale the number
    const scaled = number / scale;

    // format number and add postfix as suffix
    let formatted = scaled.toFixed(1) + '';
    
    // remove '.0' case
    if (/\.0$/.test(formatted))
    	formatted = formatted.substr(0, formatted.length - 2);
    
    return formatted + postfix;
  }

  componentWillMount () {
    this.setState({
      selectedTab: this.props.selectedTab
    })
  }

  selectTab (item) {
    trackPage(window.location.pathname + `/tab-${item.title}` + window.location.search)

    this.setState({
      selectedTab: item.name
    })
    if (this.props.onChangeTab) {
      this.props.onChangeTab(item.name)
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
                    onClick={(e) => this.selectTab(item)}
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
                  onClick={(e) => this.selectTab(item)}
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
                    {!!item.valueBadge && <span className='badge'><span>{this.abbreviateNumber(item.valueBadge)}</span></span>}
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
