import React, { Component } from 'react'
import { Line, Chart } from 'react-chartjs-2'

class Graph extends Component {
  constructor (props) {
    super(props)
    this.state = {
      dataGraph: this.props.data || [],
      data: {
        datasets: [],
        labels: this.props.labels || []
      }
    }
  }

  getData () {
    this.state.dataGraph.map((item) => {
      this.state.data.datasets.push({
        label: item.label,
        fill: false,
        lineTension: 0.1,
        backgroundColor: item.color,
        borderColor: item.color,
        borderCapStyle: 'butt',
        borderDash: [],
        borderDashOffset: 0.0,
        borderJoinStyle: 'miter',
        pointBorderColor: item.color,
        pointBackgroundColor: '#fff',
        pointBorderWidth: 1,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: item.color,
        pointHoverBorderColor: item.color,
        pointHoverBorderWidth: 2,
        pointRadius: 1,
        pointHitRadius: 10,
        data: item.data
      })
    })
  }

  componentWillMount () {
    Chart.boxWidth = 50
    this.getData()
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.reloadGraph) {
      this.setState({
        dataGraph: nextProps.data,
        data: {
          datasets: [],
          labels: nextProps.labels
        }
      },
        () => {
          this.getData()
        }
      )
    }
  }

  render () {
    return (
      <div className='chart-container'>
        <Line
          data={this.state.data}
          /* width={this.props.width}
          height={this.props.height} */
          options={{
            responsive: true,
            responsiveAnimationDuration: 1,
            maintainAspectRatio: true
          }} />
      </div>
    )
  }
}

export default Graph
