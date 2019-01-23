import React, { Component, PropTypes } from 'react'
import 'md-checkbox/md-checkbox.css'

class Checkbox extends Component {
  constructor (props) {
    super(props)
    this.state = {
      isChecked: this.props.checked || false
    }
  }

  componentWillReceiveProps (nextProps) {
    if (this.props.checked !== nextProps.checked){

      this.setState(({ isChecked }) => (
        {
          isChecked: nextProps.checked
        }
      ));


    }
  }

  toggleCheckboxChange = () => {
    const { handleCheckboxChange, label } = this.props;

    this.setState({
        isChecked: !this.state.isChecked
      })

    handleCheckboxChange(label, !this.state.isChecked);
  }


  render () {
    return (
      <div>
        <label className='md-checkbox block'>
          <input
            type='checkbox'
            //value={this.props.label}
            checked={this.state.isChecked}
            onChange={this.toggleCheckboxChange}
            disabled={this.props.disabled}
          />
          <span className={this.props.disabled ? 'md-checkbox--fake disabled' : 'md-checkbox--fake' } />
          {
            !this.props.hideLabel &&
            <div>
              {this.props.label}
            </div>
          }
        </label>
      </div>
    )
  }
}

export default Checkbox
