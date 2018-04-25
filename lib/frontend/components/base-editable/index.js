import React, { Component } from 'react';

class Editable extends Component {
  constructor (props) {
    super(props)
    this.state = {
      edit: this.props.edit || false,
      value: this.props.value || '',
      className: this.props.className,
      original: this.props.value || ''
    }
  }

  componentWillReceiveProps (nextProps) {
    if(this.props !== nextProps){
      this.setState({
        edit: nextProps.edit,
        value: nextProps.value,
        width: nextProps.width,
        className: nextProps.className,
        original: nextProps.value
      })
    }
  }

  hideInput = () => {
    this.setState({
      edit: false,
      value: this.state.original
    })
  }

  showInput = () => {
    this.setState({
      edit: true
    })
  }

  onEnter = async (e) => {
    let value = e.target.value
    
    if (e.charCode === 13) {
      if (this.props.type === 'number') {
        value = Number(value.replace(/[^(\-|\+)?][^0-9.]/g, ''))
      }

      this.hideInput()
      const res = await this.props.handleChange(value, this.props.obj || {})

      if (res) {
        this.setState({
          value: value,
          original: value
        })
      }
    }
  }

  onBlur = async (e) => {

    if (this.state.value === this.state.original){
      this.hideInput()
      return
    }
    
    let value = e.target.value
    
    if (this.props.type === 'number') {
      value = Number(value.replace(/[^(\-|\+)?][^0-9.]/g, ''))
    }

    this.hideInput()
    const res = await this.props.handleChange(value, this.props.obj || {})

    if (res) {
      this.setState({
        value: value,
        original: value
      })
    }
  }

  onChange = (e) => {
    this.setState({ value: e.target.value })
  }

  render () {
    return (
      <div className='editable is-clickable' 
        onClick={this.showInput}>
        {this.props.prepend &&
          <span className='editable-prepend'>{this.props.prepend}</span>
        }
        {this.state.edit ?
          <input
            type={this.props.type || 'text'}
            className='input editable-show'
            value={this.state.value}
            onBlur={this.onBlur}
            onKeyPress={this.onEnter}
            onChange={this.onChange}
            style={{ width: this.state.width }}
            onFocus={(event) => { event.target.select()}}
            autoFocus
            tabIndex={this.props.tabIndex}
            ref={this.props.inputRef}
          />
          :
          <span className='is-grouped editable-show' 
            tabIndex={this.props.tabIndex} 
            onFocus={this.showInput} 
            ref={this.props.inputRef}
            style={{ width: this.props.width }}>
            <span className='control'> 
              <span className='icon'> 
                {this.state.value} 
              </span>
            </span>  
            {!this.props.hideIcon &&
            <span className='icon control is-pulled-right'>
              <i className='fa fa-edit fa-lg'></i>
            </span>
            }
            </span>
        }
      </div>
    ) 
  }
}

export default Editable
