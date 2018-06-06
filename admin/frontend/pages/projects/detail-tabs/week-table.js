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
      data: this.props.data
    }
    this.inputs = new Set()
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
  }

  toggleCheckbox = (row) => {
    for (const week of row.weeks) {
      this.props.toggleCheckbox(week, !week.selected)
    }
    row.selected = !row.selected
  }

  getBtns() {
    return (
      <div className="field has-addons view-btns">
        <span className="control">
          <a className="button is-primary">
            Vista Semana
          </a>
        </span>
        <span className="control">
          <a className="button is-primary is-outlined" onClick={this.props.show}>
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
          return (
            <Checkbox
              label='checkAll'
              handleCheckboxChange={this.checkAll}
              key='checkAll'
              checked={this.props.selectedAll}
              hideLabel />
          )
        })(),
        groupClassName: 'col-border-left colspan is-paddingless',        
        headerClassName: 'col-border-left',
        className: 'col-border-left',        
        'property': 'checkbox',
        'default': '',
        formatter: (row) => {
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
      },
      {
        group: ' ',
        title: 'Id',
        property: 'productId',
        default: 'N/A',
        sortable: true,
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
      }
    ].concat(this.getWeekCols())
  }

  getWeekCols(){
    let data = this.state.filteredDataByWeek
    let cols = []
    
    for (let j = 0; j < data[0].weeks.length; j++){
       cols.push(
         {
           group: <p><strong>{'Semana ' + data[0].weeks[j].semanaBimbo}</strong> 
                  {' - Ajuste permitido ' + this.state.range}</p>,
           title: 'Predicción',
           property: 'prediction_' + j,
           default: 0,
           sortable: true,
           groupClassName: 'colspan',
           className: 'has-text-centered', 
           headerClassName: 'has-text-centered',                                                      
           formatter: (row) => {
             if (row.weeks[j].prediction) {
               return row.weeks[j].prediction
             }
           }
         },
         {
           group: ' ',
           title: this.splitWords('Ajuste_Anterior '),
           property: 'lastAdjustment_' + j,
           default: 0,
           sortable: true,
           headerClassName: 'has-text-centered',                      
           className: 'has-text-centered',           
           formatter: (row) => {
             if (row.weeks[j].lastAdjustment) {
               return row.weeks[j].lastAdjustment
             }
           }
         },
         {
           group: ' ',
           title: 'Ajuste',
           property: 'localAdjustment_' + j,
           default: 0,
           sortable: true,
           headerClassName: 'has-text-centered',           
           className: 'has-text-centered',                      
           formatter: (row) => {
             if (!row.weeks[j].localAdjustment) {
               row.weeks[j].localAdjustment = 0
             }
             row.tabin = row.key * 10 + j
             row.weeks[j].tabin = row.key * 10 + j
             return (
               <input
                 type='number'
                 className='input'
                 value={row.weeks[j].localAdjustment}
                 onBlur={(e) => { this.onBlur(e, row.weeks[j])}}
                 onKeyPress={(e) => { this.onEnter(e, row.weeks[j])}}
                 style={{ width: 80 }}
                 onChange={(e) => { this.onChange(e, row.weeks[j])}}
                 onFocus={(e) => { this.onFocus(e, row.weeks[j]) }}
                 tabIndex={row.tabin}
                 max='99999'
                 ref={(el) => { this.inputs.add({ tabin: row.weeks[j].tabin, el: el }) }}
               />
             )
           }
         },
         {
          group: ' ',
          title: this.splitWords('Rango_Ajustado'),
          property: 'percentage_' + j,
          default: 0,
          sortable: true,
          headerClassName: 'col-border has-text-centered',
          groupClassName: 'col-border',
          className: 'col-border has-text-centered',
          formatter: (row) => {
            let percentage = ((row.weeks[j].localAdjustment - row.weeks[j].prediction) 
                            / row.weeks[j].prediction) * 100
            row.weeks[j].percentage = percentage 
            let status = classNames('has-text-weight-bold', {
              'has-text-success': row.weeks[j].isLimit && row.weeks[j].adjustmentRequest && row.weeks[j].adjustmentRequest.status === 'approved',
              'has-text-warning': row.weeks[j].isLimit && row.weeks[j].adjustmentRequest && row.weeks[j].adjustmentRequest.status === 'created',
              'has-text-danger': row.weeks[j].isLimit && (!row.weeks[j].adjustmentRequest || row.weeks[j].adjustmentRequest.status === 'rejected'),
            })     
            return <span className={status}>{Math.round(percentage) + ' %'}</span>
          }
        }
       )
      }
    return cols
  }

  changeCell = (row, direction) => { 
    let edit = Array.from(this.inputs).find(e => e.tabin === row.tabin + 10 * direction)
    
    if(edit){
      edit.el.focus()
    }
  }

  onFocus (e , row) {
    row.original = row.localAdjustment
    e.target.select()
  }

  onEnter = async (e, row) => {
    let value = e.target.value

    if (e.target.type === 'number') {
      value = Number(value.replace(/[^(\-|\+)?][^0-9.]/g, ''))
    }

    if (e.charCode === 13 && !e.shiftKey) {
      this.changeCell(row, 1)
    }
    else if (e.charCode === 13 && e.shiftKey) {
      this.changeCell(row, -1)
    }
  }

  onBlur = async (e, row) => {
    let value = e.target.value

    if (e.target.type === 'number') {
      value = Number(value.replace(/[^(\-|\+)?][^0-9.]/g, ''))
    }

    if (row.original !== value) {
      this.props.changeAdjustment(value, row)
    }

   }

  onChange = (e, row) => {
    if(e.target.value.length<=5){
      row.localAdjustment = e.target.value
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

    let data = this.state.data
    
    let rw = []
    for (let index = 0; index < data.length; index++) {
      const element = data[index];
      let find = rw.indexOf(element.productName + ' (' + element.channel + ')')
      if (find === -1) {
        rw.push(element.productName + ' (' + element.channel + ')')
      }
    }

    rw = rw.map((item) => {
      return {
        product: item,
        weeks: _.orderBy(data.filter((element, index) => {
          return element.productName + ' (' + element.channel + ')' === item
        }), function (e) { return e.semanaBimbo }, ['asc'])
      }
    }) 

    await this.setState({
      filteredDataByWeek: rw
    })
    
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
            title={'Semana ' + product.semanaBimbo + ' fuera de rango'}
            onClick={() => {
              this.props.showModalAdjustmentRequest(product)
            }}>
            <i className='fa fa-times fa-lg' />
          </span>
        return limit  
      }
     
    }
    return limit
  }

  componentWillReceiveProps(nextProps){
    if(nextProps.data !== this.props.data){
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