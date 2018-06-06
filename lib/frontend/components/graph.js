import React, { PureComponent } from 'react'
import { Line, Chart } from 'react-chartjs-2'
import 'chartjs-plugin-annotation'
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
        borderWidth: 2,
        backgroundColor: item.color,
        borderColor: item.color,
        borderCapStyle: 'round',
        borderJoinStyle: 'round',
        pointBorderColor: item.color,
        pointBackgroundColor: item.color,
        pointBorderWidth: 1,
        pointHoverRadius: 3,
        pointHoverBackgroundColor: item.color,
        pointHoverBorderColor: item.color,
        pointHoverBorderWidth: 0,
        pointRadius: 1,
        pointHitRadius: 3,
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
    let responsive = false
    let maintainAspectRatio = false
    if (this.props.responsive) {
      responsive = this.props.responsive
    }
    if (this.props.maintainAspectRatio) {
      maintainAspectRatio = this.props.maintainAspectRatio
    }
    return (
      <div className='chart-container'>
        <Line
          data={this.state.data}
          width={this.props.width}
          height={this.props.height}
          options={{
            responsive: responsive,
            responsiveAnimationDuration: 1,
            maintainAspectRatio: maintainAspectRatio,
            scales: this.props.scales || {
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
                      if (label <= 999) {
                        return label
                      } else if (label >= 1000 && label <= 999999) {
                        return (label / 1000) + 'K'
                      } else if (label >= 1000000 && label <= 999999999) {
                        return (label / 1000000) + 'M'
                      }
                    },
                    fontSize: 11
                  },
                  display: true
                }
              ]
            },
            tooltips: this.props.tooltips || {
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
                  let yVal = tooltipItem.yLabel.toFixed(2).replace(/./g, (c, i, a) => {
                    return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c
                  })
                  return label + yVal
                }
              }
            },
            legend: this.props.legend || {
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
            },
            annotation: this.props.annotation

          }} />
      </div>
    )
  }
}

export default Graph
