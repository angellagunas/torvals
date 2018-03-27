import React, { Component } from 'react'
import StickTable from '~base/components/stick-table'
import Checkbox from '~base/components/base-checkbox'
import Editable from '~base/components/base-editable'
import Loader from '~base/components/spinner'


class WeekTable extends Component {

  constructor(props){
    super(props)
    this.state = {
      filteredDataByWeek: [],
      selectedAll: false
    }
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
    return words.split('_').map((item) => {
      return <p>{item}</p>
    })
  }

  checkAll = () => {
    for (let row of this.state.filteredDataByWeek) {
      for (const week of row.weeks) {
        this.props.toggleCheckbox(week, !this.state.selectedAll)
      }
      row.selected = !this.state.selectedAll
    }

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

  getColumnsByWeek() {
    return [
      {
        group: ' ',
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
        groupClassName: 'col-border-left',        
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
        group: 'Producto',
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
          if (row.weeks[1].isLimit && !row.weeks[1].adjustmentRequest) {
            return (
              <span
                className='icon has-text-danger'
                title='No es posible ajustar más allá al límite!'
                onClick={() => {
                  this.showModalAdjustmentRequest(row)
                }}
              >
                <i className='fa fa-times fa-lg' />
              </span>
            )
          }

          if (row.weeks[1].isLimit && row.weeks[1].adjustmentRequest) {
            return (
              <span
                className='icon has-text-warning'
                title='Ya se ha pedido un cambio a esta predicción!'
                onClick={() => {
                  this.showModalAdjustmentRequest(row)
                }}
              >
                <i className='fa fa-clock-o fa-lg' />
              </span>
            )
          }
          return ''
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

             return (
              <Editable
              tabIndex={row.key + 1}
              value={row.weeks[j].localAdjustment}
              handleChange={this.props.changeAdjustment}
              type='number'
              obj={row.weeks[j]}
              width={70}
              hideIcon
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
            return Math.round(percentage) + ' %'
          }
        }
       )
      }
    return cols
  }

  filterData = async () => {
    if(!this.props.data)
      return

      await this.setState({
        filteredDataByWeek: []
      })  

    let data = this.props.data
    
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

  componentWillReceiveProps(nextProps){
    if(nextProps.data !== this.props.data){
      this.setRange()
      this.filterData()
    }
  }

  componentWillMount(){
    this.setRange()
    this.filterData()
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