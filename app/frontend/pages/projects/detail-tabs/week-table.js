import React, { Component } from 'react'
import StickTable from '~base/components/stick-table'
import Checkbox from '~base/components/base-checkbox'
import Loader from '~base/components/spinner'
import classNames from 'classnames'


class WeekTable extends Component {
  constructor(props){
    super(props)
    this.state = {
      filteredDataByWeek: [],
      selectedAll: false,
      data: this.props.data,
      sortBy: 'prediction_0',
      sortAscending: false
    }
    this.inputs = new Set()
    this.lastRow = null
  }

  setRange () {
    let range
    if (this.props.generalAdjustment < 0)
      range = 'Ilimitado'
    else
      range = this.props.generalAdjustment * 100 + ' %'

    this.setState({
      range: range
    })
  }
  
  splitWords (words){
    return words.split('_').map((item, key) => {
      return <p key={key}>{item}</p>
    })
  }

  checkAll = () => {
    let selected = new Set()    
    for (let row of this.state.filteredDataByWeek) {
      for (const week of row.weeks) {
        if (this.state.selectedAll) {
          selected.delete(week)
          week.selected = false
        }
        else {
          week.selected = true
          selected.add(week)
        } 
      }
      row.selected = !this.state.selectedAll
    }

    this.props.checkAll(selected)

    this.setState({
      selectedAll: !this.state.selectedAll
    })

    this.getEdited()
  }

  toggleCheckbox = (row) => {
    for (const week of row.weeks) {
      this.props.toggleCheckbox(week, !week.selected)
    }
    row.selected = !row.selected
    
    this.getEdited()
  }

  getEdited () {
    let aux = this.state.filteredDataByWeek 
    aux.map((row) => {  
      for (const week of row.weeks) {
        if (week.edited) {
          row.edited = true          
        }
        if(week.wasEdited){
          row.wasEdited = true
        }
      }
    })
    
    this.setState({
      filteredDataByWeek: aux
    })
  }

  getBtns() {
    return (
      <div className='field has-addons view-btns'>
        <span className='control'>
          <a className={this.props.currentRole === 'consultor' ? 'button is-info btn-lvl-3' : 'button is-info'}>
            Vista Semana
          </a>
        </span>
        <span className='control'>
          <a className={this.props.currentRole === 'consultor' ? 'button is-info is-outlined btn-lvl-3' : 'button is-info is-outlined'} onClick={this.props.show}>
            Vista Producto
          </a>
        </span>
      </div>
    )
  }
  
  getColumnsByWeek() {
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
                checked={this.props.selectedAll}
                hideLabel />
            )
          }
        })(),
        groupClassName: 'col-border-left colspan is-paddingless',        
        headerClassName: 'col-border-left table-product-head',
        className: 'col-border-left',        
        property: 'checkbox',
        default: '',
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
          if (row.weeks[0].productId) {
            return row.weeks[0].productId
          }
        }
      },
      {
        group: ' ',
        title: 'Producto',
        property: 'product',
        default: 'N/A',
        sortable: true,
        headerClassName: 'table-product table-product-head',
        className: 'table-product productName',
        formatter: (row) => {
          if (row.weeks[0].productName) {
            return row.weeks[0].productName
          }
        }
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
      }
    ].concat(this.getWeekCols())
  }

  getWeekCols(){
    let data = this.state.filteredDataByWeek
    let cols = []
    let maxWeeks = data.map(item => {return item.weeks.length})
    maxWeeks = maxWeeks.sort((a,b) => {return b-a})

    for (let j = 0; j < this.props.filteredSemanasBimbo.length; j++){
      let semanaBimbo = this.props.filteredSemanasBimbo[j]
      cols.push(
        {
          group: <strong>{this.splitWords('Semana ' + semanaBimbo
          + '_Ajuste permitido ' + this.state.range)}</strong>,
          title: 'Predicción',
          property: 'prediction_' + j,
          default: '',
          sortable: true,
          groupClassName: 'colspan table-week text',
          className: 'table-cell', 
          headerClassName: 'table-head',                                                      
          formatter: (row) => {            
            if (row.weeks[j]) {
              if (row.weeks[j].prediction) {
                return row.weeks[j].prediction
             }
           }
         }
        },
        {
          group: ' ',
          title: this.splitWords('Ajuste_Anterior '),
          property: 'lastAdjustment_' + j,
          default: '',
          sortable: true,
          groupClassName: 'table-week',           
          headerClassName: 'table-head',                      
          className: 'table-cell',           
          formatter: (row) => {
            if (row.weeks[j]) {
              if (row.weeks[j].lastAdjustment) {
                return row.weeks[j].lastAdjustment
              }else{
                return row.weeks[j].prediction
              }
            } else {
              return ''
            }
          }
        },
        {
          group: ' ',
           title: 'Ajuste',
           property: 'adjustmentForDisplay_' + j,
           default: '',
           sortable: true,
           groupClassName: 'table-week',
           headerClassName: 'table-head',           
           className: 'table-cell',                      
           formatter: (row) => {
             if (row.weeks[j] && row.weeks[j].prediction) {
             if (!row.weeks[j].adjustmentForDisplay) {
               row.weeks[j].adjustmentForDisplay = ''
             }

             row.tabin = row.key * 10 + j
             row.weeks[j].tabin = row.key * 10 + j
             if (this.props.currentRole !== 'consultor') {
               return (
                 <input
                   type='text'
                   className='input'
                   value={row.weeks[j].adjustmentForDisplay}
                   onBlur={(e) => { this.onBlur(e, row.weeks[j], row) }}
                   onKeyDown={(e) => { this.onEnter(e, row.weeks[j]) }}
                   onChange={(e) => { this.onChange(e, row.weeks[j])}}
                   onFocus={(e) => { this.onFocus(e, row.weeks[j], row) }}
                   tabIndex={row.tabin}
                   max='99999'
                   placeholder='0'
                   ref={(el) => { this.inputs.add({ tabin: row.weeks[j].tabin, el: el }) }}
                 />
               )
              }else{
                return <span>{row.weeks[j].adjustmentForDisplay}</span>
              }
            }
             else {
               return ''
             }
          }
          
        },
        {
          group: ' ',
          title: this.splitWords('Rango_Ajustado'),
          property: 'percentage_' + j,
          default: '',
          sortable: true,
          headerClassName: 'col-border table-head',
          groupClassName: 'table-week table-week-r',
          className: 'col-border table-cell',
          formatter: (row) => {
            if (row.weeks[j] && row.weeks[j].prediction){
              let percentage 
              if(row.weeks[j].lastAdjustment){
                percentage = (
                  ((row.weeks[j].adjustmentForDisplay - row.weeks[j].lastAdjustment) / row.weeks[j].lastAdjustment) * 100
                )  
              }else{
                percentage = (
                  ((row.weeks[j].adjustmentForDisplay - row.weeks[j].prediction) / row.weeks[j].prediction) * 100
                )  
              }
              
              if(isNaN(percentage) || !isFinite(percentage))
                percentage = 0
              row.weeks[j].percentage = percentage 
              let status = classNames('has-text-weight-bold', {
                'has-text-success': row.weeks[j].isLimit && row.weeks[j].adjustmentRequest && row.weeks[j].adjustmentRequest.status === 'approved',
                'has-text-warning': row.weeks[j].isLimit && row.weeks[j].adjustmentRequest && row.weeks[j].adjustmentRequest.status === 'created',
                'has-text-danger': row.weeks[j].isLimit && ((!row.weeks[j].adjustmentRequest || row.weeks[j].adjustmentRequest.status === 'rejected')
                                                             || this.props.currentRole === 'manager-level-2' )
              })     
              return <span className={status}>{Math.round(percentage) + ' %'}</span>
            
            } else {
              return ''
            }
          }
        }
      )
    }
    
    return cols
  }

  changeCell = (row, direction) => {
    let edit = Array.from(this.inputs).find(e => e.tabin === row.tabin + 10 * direction)

    if (edit) {
      edit.el.focus()
    }
  }

  onFocus(e, week, row) {
    week.original = week.adjustmentForDisplay

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

  onBlur = async (e, week, row) => {
    let value = e.target.value
    if (e.target.type === 'number') {
      value = Number(value.replace(/[^(\-|\+)?][^0-9.]/g, ''))
    }
    if (value === '' && week.original !== ''){
        week.adjustmentForDisplay = week.original
        let aux = this.state.filteredDataByWeek

        this.setState({
          filteredDataByWeek: aux
        })

        return
      }
      if(Number(week.original) !== Number(value)) {
        row.edited = true
        let res = await this.props.changeAdjustment(value, week)
        if (!res) {
          row.edited = false

          week.adjustmentForDisplay = week.original

          let aux = this.state.filteredDataByWeek

          this.setState({
            filteredDataByWeek: aux
          })
        }
      }

  }

  onChange = (e, row) => {
    if(e.target.value.length<=5){
      row.adjustmentForDisplay = Number(e.target.value)
      let aux = this.state.filteredDataByWeek

      this.setState({
        filteredDataByWeek: aux
      })  
    }
  }

  filterData = async () => {
    if(!this.state.data)
      return

      await this.setState({
        filteredDataByWeek: []
      })  

    let data = this.state.data.slice(0)
    let rw = []
    for (let index = 0; index < data.length; index++) {
      const element = data[index];
      let find = rw.indexOf(element.productId + ' (' + element.channel + ')')
      if (find === -1) {
        rw.push(element.productId + ' (' + element.channel + ')')
      }
    }

    rw = rw.map((item) => {
      let weeks = _.orderBy(data.filter((element, index) => {
          return element.productId + ' (' + element.channel + ')' === item
        }), function (e) { return e.semanaBimbo }, ['asc'])

      let product = weeks[0].productName
      return {
        product,
        weeks
      }
    }) 

    await this.setState({
      filteredDataByWeek: rw
    })
    this.getEdited()
    this.setState({
      sortAscending: false
    }, () => {this.handleSortByWeek(this.state.sortBy)})    
  }

  handleSortByWeek(e) {
    let sorted = this.state.filteredDataByWeek

    if (e === 'productId') {
      if (this.state.sortAscending) {
        sorted.sort((a, b) => { return parseFloat(a.weeks[0].productId) - parseFloat(b.weeks[0].productId) })
      }
      else {
        sorted.sort((a, b) => { return parseFloat(b.weeks[0].productId) - parseFloat(a.weeks[0].productId) })
      }
    }
    else if(e.indexOf('_') !== -1){
      let sort = e.split('_')
      
      if (this.state.sortAscending) {
        sorted = _.orderBy(sorted, function (e) { return e.weeks[parseInt(sort[1])][sort[0]] }, ['asc'])

      }
      else {
        sorted = _.orderBy(sorted, function (e) { return e.weeks[parseInt(sort[1])][sort[0]] }, ['desc'])
      }
    }
    else {
      if (this.state.sortAscending) {
        sorted = _.orderBy(sorted, [e], ['asc'])
      }
      else {
        sorted = _.orderBy(sorted, [e], ['desc'])
      }
    }

    this.setState({
      filteredDataByWeek: sorted,
      sortAscending: !this.state.sortAscending,
      sortBy: e
    })
  }

  getLimit (row){
    let limit = ''

    for (const product of row.weeks) {
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
            title={'¡Hay ajustes fuera de rango!'}
            onClick={() => {
              this.props.handleAdjustmentRequest(row.weeks)
            }}>
            <i className='fa fa-times fa-lg' />
          </span>
        return limit  
      }
     
    }
    return limit
  }

  componentWillReceiveProps(nextProps){
    if (!nextProps.data) return

    if (!this.props.data) {
      this.setState({
        data: nextProps.data
      }, () => {
        this.setRange()
        this.filterData()
      })

      return
    }

    var same = nextProps.data.length === this.props.data.length
    same = same && nextProps.data.every((v,i)=> v === this.props.data[i])

    if (!same) {
      this.setState({
        data: nextProps.data
      }, () => {
        this.setRange()
        this.filterData()
      })
    }
  }

  componentWillMount(){
    this.setState({
      data: this.props.data
    }, () => {
      this.setRange()
      this.filterData()
    })
  }

  render () {
    if (this.state.filteredDataByWeek.length === 0){
      return (
        <Loader />
      )
    }
    return (
        <StickTable
          height='55vh'
          data={this.state.filteredDataByWeek}
          cols={this.getColumnsByWeek()}
          stickyCols={4}
          stickyRows={2}
          sortAscending={this.state.sortAscending}
          sortBy={this.state.sortBy}
          handleSort={(e) => this.handleSortByWeek(e)}
        />
    )
  }
}

export default WeekTable