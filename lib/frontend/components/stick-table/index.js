import React, { Component } from 'react'
import { StickyTable, Row, Cell } from 'react-sticky-table'
import 'react-sticky-table/dist/react-sticky-table.css'
import classNames from 'classnames'

class StickTable extends Component {
  formatHeader (item, key) {
    let icon
    let callbackEvent
    let rowClass = ''
    const props = this.props

    if (item.sortable) {
      const iconClass = classNames('fa', {
        'has-text-grey-lighter': props.sortBy !== item.property,
        'fa-sort': props.sortBy !== item.property,
        'has-text-dark': props.sortBy === item.property,
        'fa-sort-asc': props.sortBy === item.property && props.sortAscending,
        'fa-sort-desc': props.sortBy === item.property && !props.sortAscending
      })

      rowClass = ' is-clickable'
      icon = (<i className={iconClass} />)
      callbackEvent = () => props.handleSort(item.property)
    }
    let classN = item.headerClassName ? item.headerClassName : ''
    return (
      <Cell key={'_' + key} className={classN + rowClass} onClick={callbackEvent}>
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
      this.props.cols.map((item, key) => {
        if (item.group) {
          groups.push(<Cell className={item.groupClassName} key={key}>{item.group}</Cell>)
        }
        headers.push(this.formatHeader(item, key))
      })

      rows.push(<Row key={'g' + rows.length}>{groups}</Row>)
      rows.push(<Row key={'h' + rows.length}>{headers}</Row>)
    }

    if (this.props.data) {
      this.props.data.map((row, key) => {
        row.key = key + 1
        rows.push(<Row key={key}>{this.getCols(row)}</Row>)
      })
    }

    return rows
  }

  render () {
    return (
      <div className='swrapper'>
        {this.props.data &&
        <div style={{ width: this.props.width || '100%', height: this.props.height || '600px' }}>
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
