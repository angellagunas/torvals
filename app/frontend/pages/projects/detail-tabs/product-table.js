import React, { Component } from 'react'
import StickTable from '~base/components/stick-table'
import Checkbox from '~base/components/base-checkbox'
import Editable from '~base/components/base-editable'
import Loader from '~base/components/spinner'
import classNames from 'classnames'

class ProductTable extends Component {
  constructor (props) {
    super(props)
    this.state = {
      filteredData: this.props.data || [],
      selectedAll: false
    }
  }

  splitWords (words) {
    return words.split('_').map((item, key) => {
      return <p key={key}>{item}</p>
    })
  }

  checkAll = () => {
    let selected = new Set()
    for (let row of this.state.filteredData) {
      if (this.state.selectedAll){
        selected.delete(row)
        row.selected = false
      }
      else {
        row.selected = true
        selected.add(row)  
      }    
    }
    this.props.checkAll(selected)

    this.setState({
      selectedAll: !this.state.selectedAll
    })
  }

  toggleCheckbox = (row) => {
    this.props.toggleCheckbox(row)
  }

  getColumns () {
    return [
      {
        group: ' ',
        title: (() => {
          if (this.props.currentRole !== 'manager-level-3') {
          return (
            <Checkbox
              label='checkAll'
              handleCheckboxChange={this.checkAll}
              key='checkAll'
              checked={this.state.selectedAll}
              hideLabel />
          )
        }
        })(),
        groupClassName: 'col-border-left',
        headerClassName: 'col-border-left',
        className: 'col-border-left',
        'property': 'checkbox',
        'default': '',
        formatter: (row) => {
          if (this.props.currentRole !== 'manager-level-3') {
          if (!row.selected) {
            row.selected = false
          }
          return (
            <Checkbox
              label={row}
              handleCheckboxChange={this.toggleCheckbox}
              key={row}
              checked={row.selected}
              hideLabel />
          )
        }
        }
      },
      {
        group: 'Producto',
        title: 'Id',
        property: 'productId',
        default: 'N/A',
        sortable: true,
        formatter: (row) => {
          if (row.productId) {
            return row.productId
          }
        }
      },
      {
        group: ' ',
        title: 'Producto',
        property: 'productName',
        default: 'N/A',
        sortable: true,
        headerClassName: 'col-border',
        className: 'col-border'
      },
      {
        group: ' ',
        title: <span
          className='icon'
          title='límite'>
          <i className='fa fa-exclamation fa-lg' />
        </span>,
        headerClassName: 'col-border',
        className: 'col-border',
        formatter: (row) => {
          return this.getLimit(row)
        }
      },
      {
        group: ' ',
        title: 'Semana',
        property: 'semanaBimbo',
        default: 'N/A',
        sortable: true,
        headerClassName: 'col-border',
        className: 'col-border'
      },
      {
        group: ' ',
        title: this.splitWords('Centro_de Ventas'),
        property: 'salesCenter',
        default: 'N/A',
        sortable: true,
        headerClassName: 'col-border',
        className: 'col-border'
      },
      {
        group: ' ',
        title: 'Canal',
        property: 'channel',
        default: 'N/A',
        sortable: true,
        headerClassName: 'col-border',
        className: 'col-border'
      },
      {
        group: ' ',
        title: 'Predicción',
        property: 'prediction',
        default: 'N/A',
        sortable: true,
        headerClassName: 'col-border',
        className: 'col-border'
      },
      {
        group: ' ',
        title: this.splitWords('Ajuste_Anterior'),
        property: 'lastAdjustment',
        default: 'N/A',
        sortable: true,
        headerClassName: 'col-border',
        className: 'col-border'
      },
      {
        group: ' ',
        title: 'Ajuste',
        property: 'localAdjustment',
        default: 'N/A',
        sortable: true,
        headerClassName: 'col-border',
        className: 'keep-cell col-border',
        formatter: (row) => {
          if (!row.localAdjustment) {
            row.localAdjustment = 0
          }

          return (
            <Editable
              value={row.localAdjustment}
              handleChange={this.props.changeAdjustment}
              type='number'
              obj={row}
              width={100}
            />
          )
        }
      },
      {
        group: ' ',
        title: this.splitWords('Rango_Ajustado'),
        property: 'percentage',
        default: 0,
        sortable: true,
        headerClassName: 'col-border has-text-centered',
        groupClassName: 'col-border',
        className: 'col-border has-text-centered',
        formatter: (row) => {
          let percentage = ((row.localAdjustment - row.prediction) /
            row.prediction) * 100
          row.percentage = percentage
          let status = classNames('has-text-weight-bold', {
            'has-text-success': row.isLimit && row.adjustmentRequest && row.adjustmentRequest.status === 'approved',
            'has-text-warning': row.isLimit && row.adjustmentRequest && row.adjustmentRequest.status === 'created',
            'has-text-danger': row.isLimit && (!row.adjustmentRequest || row.adjustmentRequest.status === 'rejected')
          })
          return <span className={status}>{Math.round(percentage) + ' %'}</span>
        }
      }
    ]
  }

  handleSort (e) {
    let sorted = this.state.filteredData

    if (e === 'productId') {
      if (this.state.sortAscending) {
        sorted.sort((a, b) => { return parseFloat(a[e]) - parseFloat(b[e]) })
      } else {
        sorted.sort((a, b) => { return parseFloat(b[e]) - parseFloat(a[e]) })
      }
    } else {
      if (this.state.sortAscending) {
        sorted = _.orderBy(sorted, [e], ['asc'])
      } else {
        sorted = _.orderBy(sorted, [e], ['desc'])
      }
    }

    this.setState({
      filteredData: sorted,
      sortAscending: !this.state.sortAscending,
      sortBy: e
    })
  }

  getLimit (product) {
    let limit = ''

    if (product.isLimit && product.adjustmentRequest && product.adjustmentRequest.status === 'approved') {
      limit =
        <span
          className='icon has-text-success'
          title='Ajustes aprobados'>
          <i className='fa fa-check fa-lg' />
        </span>
    }

    if (product.isLimit && product.adjustmentRequest && product.adjustmentRequest.status === 'created') {
      limit =
        <span
          className='icon has-text-warning'
          title='Ya se ha pedido un cambio'>
          <i className='fa fa-clock-o fa-lg' />
        </span>
    }

    if (product.isLimit && (!product.adjustmentRequest || product.adjustmentRequest.status === 'rejected')) {
      limit =
        <span
          className='icon has-text-danger'
          title={'Semana ' + product.semanaBimbo + ' fuera de rango'}
          onClick={() => {
            this.props.showModalAdjustmentRequest(product)
          }}>
          <i className='fa fa-times fa-lg' />
        </span>
      return limit
    }

    return limit
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.data !== this.props.data) {
      this.setState({
        filteredData: nextProps.data
      })
    }
  }

  render () {
    if (this.state.filteredData.length === 0) {
      return (
        <Loader />
      )
    }
    return (
      <StickTable
        data={this.state.filteredData}
        cols={this.getColumns()}
        stickyCols={0}
        stickyRows={2}
        sortAscending={this.state.sortAscending}
        sortBy={this.state.sortBy}
        handleSort={(e) => this.handleSort(e)}
      />
    )
  }
}

export default ProductTable
