import React, { PureComponent } from 'react'
import { Line, Chart } from 'react-chartjs-2'

class Graph extends PureComponent {
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
        lineTension: 0,
        borderWidth: 3,
        backgroundColor: item.color,
        borderColor: item.color,
        borderCapStyle: 'round',
        borderJoinStyle: 'round',
        pointBorderColor: item.color,
        pointBackgroundColor: item.color,
        pointBorderWidth: 1,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: item.color,
        pointHoverBorderColor: item.color,
        pointHoverBorderWidth: 2,
        pointRadius: 3,
        pointHitRadius: 10,
        data: item.data
      })
    })
  }

  componentWillMount () {
    Chart.boxWidth = 50
    this.getData()
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
            maintainAspectRatio: true,
            scales: {
              xAxes: [
                {
                  ticks: {
                    callback: function (label, index, labels) {
                      return label
                    },
                    fontSize: 11
                  }
                }
              ],
              yAxes: [
                {
                  ticks: {
                    callback: function (label, index, labels) {
                      return '$' + label.toFixed(2).replace(/./g, (c, i, a) => {
                        return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
                      })
                    },
                    fontSize: 11
                  },
                  display: true
                }
              ]
            },
            tooltips: {
              mode: 'point',
              intersect: true,
              titleFontFamily: "'Roboto', sans-serif",
              bodyFontFamily: "'Roboto', sans-serif",
              bodyFontStyle: 'bold',
              callbacks: {
                label: function (tooltipItem, data) {
                  let label = ' '
                  label += data.datasets[tooltipItem.datasetIndex].label || ''

                  if (label) {
                    label += ': '
                  }
                  let yVal = '$' + tooltipItem.yLabel.toFixed(2).replace(/./g, (c, i, a) => {
                    return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
                  })
                  return label + yVal
                }
              }
            },
            legend: {
              display: true,
              position: 'top',
              fontSize: 11,
              labels: {
                boxWidth: 10,
                fontStyle: 'normal',
                fontFamily: "'Roboto', sans-serif",
                usePointStyle: false,
                padding: 12
              }
            }

          }} />
      </div>
    )
  }
}

export default Graph
