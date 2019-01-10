import React, { Component } from 'react';

class Select extends Component {
  constructor(props) {
    super(props);
    this.state = {
      value: this.props.value,
    };
  }

  onChange = e => {
    let val = e.currentTarget.value;
    if (this.props.type) {
      if (this.props.type === 'integer') {
        val = parseInt(val);
      } else if (this.props.type === 'float') {
        val = parseFloat(val);
      }
    }
    this.setState({
      value: val,
    });
    if (val === '') val = undefined;

    this.props.onChange(this.props.name, val);
  };

  componentWillReceiveProps(next) {
    if (next.value !== this.state.value) {
      this.setState({
        value: next.value,
      });
    }
  }

  render() {
    if (this.props.options) {
      return (
        <div className="field">
          <label className="label">{this.props.label}</label>
          <div className="control">
            <div className="select">
              <select
                name={this.props.name}
                value={this.state.value}
                onChange={this.onChange}
                disabled={this.props.disabled}
              >
                {this.props.placeholder && (
                  <option value="">{this.props.placeholder}</option>
                )}
                {this.props.options.map((item, key) => {
                  if (this.props.optionValue && this.props.optionName) {
                    if(this.props.name === 'centro-de-venta'){
                      return (
                        <option key={key} value={item[this.props.optionValue]}>
                           {item['externalId']+ ' - ' + item[this.props.optionName]}
                        </option>
                      );
                    }
                    else{
                      return (
                        <option key={key} value={item[this.props.optionValue]}>
                          {item[this.props.optionName]}
                        </option>
                      );
                    }
                  } else {
                    return (
                      <option key={key} value={item}>
                        {item}
                      </option>
                    );
                  }
                })}
              </select>
            </div>
          </div>
        </div>
      );
    }
  }
}

export default Select;
