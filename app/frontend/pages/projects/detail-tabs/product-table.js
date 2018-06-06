import React, { Component } from 'react'
import StickTable from '~base/components/stick-table'
import Checkbox from '~base/components/base-checkbox'
import Loader from '~base/components/spinner'
import classNames from 'classnames'

class ProductTable extends Component {
  constructor (props) {
    super(props)
    this.state = {
      filteredData: this.props.data || [],
      selectedAll: false,
      data: this.props.data
    }
    this.inputs = {}
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

  getBtns() {
    return (
      <div className="field has-addons view-btns">
        <span className="control">
          <a className={this.props.currentRole === 'consultor' ? 'button is-info is-outlined btn-lvl-3' : 'button is-info is-outlined'} onClick={this.props.show}>
            Vista Semana
          </a>
        </span>
        <span className="control">
          <a className={this.props.currentRole === 'consultor' ? 'button is-info btn-lvl-3' : 'button is-info'}>
            Vista Producto
          </a>
        </span>
      </div>
    )
  }

  getColumns () {
    return [
      {
        group: this.getBtns(),
        title: (() => {
          if (this.props.currentRole !== 'consultor') {
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
        groupClassName: 'col-border-left colspan is-paddingless',
        headerClassName: 'col-border-left table-product-head',
        className: 'col-border-left', 
        'property': 'checkbox',
        'default': '',
        formatter: (row) => {
          if (this.props.currentRole !== 'consultor') {
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
        group: ' ',
        title: 'Id',
        property: 'productId',
        default: 'N/A',
        sortable: true,
        headerClassName: 'has-text-centered table-product-head id',   
        className: 'id',     
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
        headerClassName: 'table-product table-product-head',
        className: 'table-product productName'
      },
      {
        group: ' ',
        title: <span
          className='icon'
          title={`¡Hay ${this.props.adjustmentRequestCount} productos fuera de rango!`}
          onClick={() => {
            this.props.handleAllAdjustmentRequest()
          }}
        >
          <i className='fa fa-exclamation fa-lg' />
        </span>,
        groupClassName: 'table-product',
        headerClassName: 'table-product table-product-head table-product-head-bord table-product-shadow',
        className: 'table-product table-product-shadow',
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
        groupClassName: 'table-week',
        headerClassName: 'table-head',
        className: 'table-cell', 
      },
      {
        group: ' ',
        title: 'Centro de Ventas',
        property: 'salesCenter',
        default: 'N/A',
        sortable: true,
        groupClassName: 'table-week',
        headerClassName: 'table-head',
        className: 'table-cell is-capitalized', 
      },
      {
        group: ' ',
        title: 'Canal',
        property: 'channel',
        default: 'N/A',
        sortable: true,
        groupClassName: 'table-week',
        headerClassName: 'table-head',
        className: 'table-cell is-capitalized', 
      },
      {
        group: ' ',
        title: 'Predicción',
        property: 'prediction',
        default: 0,
        sortable: true,
        groupClassName: 'table-week',
        headerClassName: 'table-head',
        className: 'table-cell',
        formatter: (row) => {
          if (row.prediction) {
            return row.prediction
          }
        }
      },
      {
        group: ' ',
        title: this.splitWords('Ajuste_Anterior'),
        property: 'lastAdjustment',
        default: 0,
        sortable: true,
        groupClassName: 'table-week',
        headerClassName: 'table-head',
        className: 'table-cell',
        formatter: (row) => {
          if (row.lastAdjustment) {
            return row.lastAdjustment
          }else{
            return row.prediction
          }
        }
      },
      {
        group: ' ',
        title: 'Ajuste',
        property: 'adjustmentForDisplay',
        default: '',
        sortable: true,
        groupClassName: 'table-week',
        headerClassName: 'table-head',
        className: 'table-cell', 
        formatter: (row) => {
          if (!row.adjustmentForDisplay) {
            row.adjustmentForDisplay = ''
          }

          row.tabin = row.key * 10
          if (this.props.currentRole !== 'consultor') {
            return (
              <input
                type='text'
                className='input'
                value={row.adjustmentForDisplay}
                onBlur={(e) => { this.onBlur(e, row) }}
                onKeyDown={(e) => { this.onEnter(e, row) }}
                onChange={(e) => { this.onChange(e, row) }}
                onFocus={(e) => { this.onFocus(e, row) }}
                tabIndex={row.tabin}
                max='99999'
                placeholder='0'
                ref={(el) => { this.inputs[row.tabin] = el }}
              />
            )
          }else{
            return <span>{row.adjustmentForDisplay}</span>
          }
        }
      },
      {
        group: ' ',
        title: this.splitWords('Rango_Ajustado'),
        property: 'percentage',
        default: 0,
        sortable: true,
        groupClassName: 'table-week',
        headerClassName: 'table-head',
        className: 'table-cell', 
        formatter: (row) => {
          let percentage 
          if(row.lastAdjustment){
            percentage = (
              ((row.adjustmentForDisplay - row.lastAdjustment) / row.lastAdjustment) * 100
            )  
          }else{
            percentage = (
              ((row.adjustmentForDisplay - row.prediction) / row.prediction) * 100
            )  
          }

          if(isNaN(percentage) || !isFinite(percentage))
              percentage = 0
          
          row.percentage = percentage
          let status = classNames('has-text-weight-bold', {
            'has-text-success': row.isLimit && row.adjustmentRequest && row.adjustmentRequest.status === 'approved',
            'has-text-warning': row.isLimit && row.adjustmentRequest && row.adjustmentRequest.status === 'created',
            'has-text-danger': row.isLimit && ((!row.adjustmentRequest || row.adjustmentRequest.status === 'rejected')
                                                || this.props.currentRole  === 'manager-level-2')
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
              this.props.handleAdjustmentRequest(product)
            }}>
          <i className='fa fa-times fa-lg' />
        </span>
      return limit
    }

    return limit
  }

  changeCell = (row, direction) => {
    this.inputs[row.tabin + 10 * direction].focus()
  }

  onFocus(e, row) {
    row.original = row.adjustmentForDisplay

    e.target.select()
  }

  onEnter = async (e, row) => {
    let value = e.target.value

    if (e.target.type === 'number') {
      value = Number(value.replace(/[^(\-|\+)?][^0-9.]/g, ''))
    }

    if ((e.keyCode === 13 || e.which === 13) && !e.shiftKey) {
      this.changeCell(row, 1)
    }
    else if ((e.keyCode === 13 || e.which === 13) && e.shiftKey) {
      this.changeCell(row, -1)
    }
  }

  onBlur = async (e, row) => {
    let value = e.target.value
    if (e.target.type === 'number') {
      value = Number(value.replace(/[^(\-|\+)?][^0-9.]/g, ''))
    }

    if (value === '' && row.original !== '') {
      row.adjustmentForDisplay = row.original
      let aux = this.state.filteredData

      this.setState({
        filteredData: aux
      })

      return
    }

    if (Number(row.original) !== Number(value)) {
      this.props.changeAdjustment(value, row)
    }
  }

  onChange = (e, row) => {
    if(e.target.value.length<=5){
      row.adjustmentForDisplay = Number(e.target.value)
      let aux = this.state.filteredData
      this.setState({
        filteredData: aux
      })
    }
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.data !== this.props.data){
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
        height='55vh'
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
