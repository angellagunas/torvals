import React, { Component } from 'react'
import { StickyTable, Row, Cell } from 'react-sticky-table'
import 'react-sticky-table/dist/react-sticky-table.css'
import classNames from 'classnames'

class StickTable extends Component {
  formatHeader (item) {
    let icon
    let callbackEvent
    let rowClass
    const props = this.props

    if (item.sortable) {
      const iconClass = classNames('fa', {
        'has-text-grey-lighter': props.sortBy !== item.property,
        'fa-sort': props.sortBy !== item.property,
        'has-text-dark': props.sortBy === item.property,
        'fa-sort-asc': props.sortBy === item.property && props.sortAscending,
        'fa-sort-desc': props.sortBy === item.property && !props.sortAscending
      })

      rowClass = 'is-clickable'
      icon = (<i className={iconClass} />)
      callbackEvent = () => props.handleSort(item.property)
    }

    return (
      <Cell className={rowClass} onClick={callbackEvent}>
        {item.title} {icon}
      </Cell>
    )
  }

  getCols (row) {
    let cells = []
    if (this.props.cols) {
      this.props.cols.map((item, key) => {
        if (item.formatter) {
          return cells.push(
            <Cell className={item.className} key={key}>
              {item.formatter(row) || item.default}
            </Cell>
          )
        }

        const value = row[item.property]

        if (value) {
          cells.push(<Cell className={item.className} key={key}>{value}</Cell>)
        } else {
          cells.push(<Cell className={item.className} key={key}>{item.defaul}</Cell>)
        }
      })
    }
    return cells
  }

  getRows () {
    let rows = []
    let headers = []
    let groups = []
    if (this.props.cols) {
      for (const item of this.props.cols) {
        if (item.group) {
          groups.push(<Cell key={item.property}>{item.group}</Cell>)
        }
        headers.push(this.formatHeader(item))
      }

      rows.push(<Row>{groups}</Row>)
      rows.push(<Row>{headers}</Row>)
    }

    if (this.props.data) {
      this.props.data.map((row, key) => {
        rows.push(<Row key={key}>{this.getCols(row)}</Row>)
      })
    }

    return rows
  }

  render () {
    return (
      <div className='swrapper'>
        {this.props.data &&
        <div style={{ width: this.props.width || '100%', height: this.props.height || '630px' }}>
          <StickyTable stickyColumnCount={this.props.stickyCols || 0} stickyHeaderCount={this.props.stickyRows || 0}>
            {this.getRows()}
          </StickyTable>
        </div>
      }
      </div>
    )
  }
}

export default StickTable
