import React, { Component } from 'react'
import * as d3 from 'd3'
const _ = require('lodash')

class CreateBarGraph extends Component {
  constructor (props) {
    super(props)
    this.createChart = this.createChart.bind(this)
    const data = _.map(this.props.data, (item) => {
      return {
        ds: item.ds,
        yhat_upper: item.yhat_upper,
        yhat: item.yhat,
        yhat_lower: item.yhat_lower
      }
    })

    this.state = {
      data: [
        {
          'date': '2014-08-01',
          'pct05': 5350,
          'pct25': 6756,
          'pct50': 7819,
          'pct75': 9284,
          'pct95': 13835
        },
        {
          'date': '2014-08-02',
          'pct05': 4439,
          'pct25': 5584,
          'pct50': 6554,
          'pct75': 8016,
          'pct95': 12765
        },
        {
          'date': '2014-08-03',
          'pct05': 4247,
          'pct25': 5419,
          'pct50': 6332,
          'pct75': 7754,
          'pct95': 12236
        },
        {
          'date': '2014-08-04',
          'pct05': 3293,
          'pct25': 4414,
          'pct50': 5191,
          'pct75': 6491,
          'pct95': 10325
        },
        {
          'date': '2014-08-05',
          'pct05': 3942,
          'pct25': 5134,
          'pct50': 6069,
          'pct75': 7501,
          'pct95': 11685
        },
        {
          'date': '2014-08-06',
          'pct05': 2744,
          'pct25': 5508,
          'pct50': 6879,
          'pct75': 9221,
          'pct95': 17239
        },
        {
          'date': '2014-08-07',
          'pct05': 1807,
          'pct25': 3019,
          'pct50': 4119,
          'pct75': 5656,
          'pct95': 8851
        },
        {
          'date': '2014-08-08',
          'pct05': 1855,
          'pct25': 3386,
          'pct50': 4473,
          'pct75': 5915,
          'pct95': 10580
        },
        {
          'date': '2014-08-09',
          'pct05': 1830,
          'pct25': 3202,
          'pct50': 4233,
          'pct75': 5559,
          'pct95': 8930
        },
        {
          'date': '2014-08-10',
          'pct05': 1828,
          'pct25': 3195,
          'pct50': 4304,
          'pct75': 5482,
          'pct95': 9189
        },
        {
          'date': '2014-08-11',
          'pct05': 2246,
          'pct25': 3929,
          'pct50': 5326,
          'pct75': 7077,
          'pct95': 11648
        },
        {
          'date': '2014-08-12',
          'pct05': 2051,
          'pct25': 3662,
          'pct50': 4849,
          'pct75': 6194,
          'pct95': 10078
        },
        {
          'date': '2014-08-13',
          'pct05': 1700,
          'pct25': 3075,
          'pct50': 4068,
          'pct75': 5259,
          'pct95': 9789
        },
        {
          'date': '2014-08-14',
          'pct05': 2161,
          'pct25': 3891,
          'pct50': 5262,
          'pct75': 6924,
          'pct95': 11612
        },
        {
          'date': '2014-08-15',
          'pct05': 1765,
          'pct25': 3190,
          'pct50': 4388,
          'pct75': 5822,
          'pct95': 9433
        },
        {
          'date': '2014-08-16',
          'pct05': 2036,
          'pct25': 3756,
          'pct50': 4775,
          'pct75': 6158,
          'pct95': 9999
        },
        {
          'date': '2014-08-17',
          'pct05': 2079,
          'pct25': 3561,
          'pct50': 4753,
          'pct75': 6124,
          'pct95': 9807
        },
        {
          'date': '2014-08-18',
          'pct05': 2108,
          'pct25': 3576,
          'pct50': 4818,
          'pct75': 6344,
          'pct95': 10235
        },
        {
          'date': '2014-08-19',
          'pct05': 2143,
          'pct25': 3792,
          'pct50': 5073,
          'pct75': 6772,
          'pct95': 11338
        },
        {
          'date': '2014-08-20',
          'pct05': 2086,
          'pct25': 3801,
          'pct50': 5073,
          'pct75': 6688,
          'pct95': 12394
        },
        {
          'date': '2014-08-21',
          'pct05': 1767,
          'pct25': 3253,
          'pct50': 4282,
          'pct75': 5563,
          'pct95': 9167
        },
        {
          'date': '2014-08-22',
          'pct05': 1756,
          'pct25': 3047,
          'pct50': 3950,
          'pct75': 5006,
          'pct95': 7948
        },
        {
          'date': '2014-08-23',
          'pct05': 2123,
          'pct25': 3755,
          'pct50': 5173,
          'pct75': 7243,
          'pct95': 12338
        },
        {
          'date': '2014-08-24',
          'pct05': 1967,
          'pct25': 3404,
          'pct50': 4529,
          'pct75': 5970,
          'pct95': 9897
        },
        {
          'date': '2014-08-25',
          'pct05': 1537,
          'pct25': 2612,
          'pct50': 3394,
          'pct75': 4279,
          'pct95': 7104
        },
        {
          'date': '2014-08-26',
          'pct05': 2182,
          'pct25': 3958,
          'pct50': 5505,
          'pct75': 7642,
          'pct95': 12707
        },
        {
          'date': '2014-08-27',
          'pct05': 1932,
          'pct25': 3366,
          'pct50': 4526,
          'pct75': 6086,
          'pct95': 9930
        },
        {
          'date': '2014-08-28',
          'pct05': 1268,
          'pct25': 2344,
          'pct50': 3256,
          'pct75': 4215,
          'pct95': 6673
        },
        {
          'date': '2014-08-29',
          'pct05': 1225,
          'pct25': 2239,
          'pct50': 3033,
          'pct75': 4111,
          'pct95': 7601
        },
        {
          'date': '2014-08-30',
          'pct05': 1393,
          'pct25': 2432,
          'pct50': 3417,
          'pct75': 4710,
          'pct95': 8798
        },
        {
          'date': '2014-08-31',
          'pct05': 1175,
          'pct25': 2020,
          'pct50': 2768,
          'pct75': 3889,
          'pct95': 7744
        },
        {
          'date': '2014-09-01',
          'pct05': 989,
          'pct25': 1655,
          'pct50': 2218,
          'pct75': 3167,
          'pct95': 6018
        },
        {
          'date': '2014-09-02',
          'pct05': 1249,
          'pct25': 2069,
          'pct50': 2738,
          'pct75': 3938,
          'pct95': 7574
        },
        {
          'date': '2014-09-03',
          'pct05': 936,
          'pct25': 1510,
          'pct50': 1968,
          'pct75': 2700,
          'pct95': 5215
        },
        {
          'date': '2014-09-04',
          'pct05': 1264,
          'pct25': 2039,
          'pct50': 2657,
          'pct75': 3646,
          'pct95': 7042
        },
        {
          'date': '2014-09-05',
          'pct05': 1305,
          'pct25': 2106,
          'pct50': 2745,
          'pct75': 3766,
          'pct95': 7273
        },
        {
          'date': '2014-09-06',
          'pct05': 798,
          'pct25': 1288,
          'pct50': 1678,
          'pct75': 2303,
          'pct95': 4448
        },
        {
          'date': '2014-09-07',
          'pct05': 1314,
          'pct25': 2120,
          'pct50': 2763,
          'pct75': 3791,
          'pct95': 7321
        },
        {
          'date': '2014-09-08',
          'pct05': 1042,
          'pct25': 1681,
          'pct50': 2191,
          'pct75': 3007,
          'pct95': 5806
        }
      ],
      markers: [
        {
          'date': '2014-08-06',
          'type': 'Client',
          'version': '2.0'
        },
        {
          'date': '2014-08-20',
          'type': 'Client',
          'version': '2.1'
        },
        {
          'date': '2014-08-27',
          'type': 'Server',
          'version': '3.5'
        },
        {
          'date': '2014-09-03',
          'type': 'Client',
          'version': '2.2'
        }
      ]
    }
  }

  componentDidMount () {
    var parseTime = d3.timeParse('%Y-%m-%d')
    var data = this.state.data.map((d) => {
      return {
        date: parseTime(d.date),
        pct05: +(d.pct05 / 1000),
        pct25: +(d.pct25 / 1000),
        pct50: +(d.pct50 / 1000),
        pct75: +(d.pct75),
        pct95: +(d.pct95)
      }
    })

    // console.log(data)
    this.createChart(data, this.state.markers)
  }
  componentDidUpdate () {
    var parseTime = d3.timeParse('%Y-%m-%d')
    var data = this.state.data.map((d) => {
      return {
        date: parseTime(d.date),
        pct05: +(d.pct05 / 1000),
        pct25: +(d.pct25 / 1000),
        pct50: +(d.pct50 / 1000),
        pct75: +(d.pct75),
        pct95: +(d.pct95)
      }
    })
    this.createChart(data, this.state.markers)
  }

  addAxesAndLegend (svg, xAxis, yAxis, margin, chartWidth, chartHeight) {
    var legendWidth = 200,
      legendHeight = 100

  // clipping to make sure nothing appears behind legend
    svg.append('clipPath')
    .attr('id', 'axes-clip')
    .append('polygon')
      .attr('points', (-margin.left) + ',' + (-margin.top) + ' ' +
                      (chartWidth - legendWidth - 1) + ',' + (-margin.top) + ' ' +
                      (chartWidth - legendWidth - 1) + ',' + legendHeight + ' ' +
                      (chartWidth + margin.right) + ',' + legendHeight + ' ' +
                      (chartWidth + margin.right) + ',' + (chartHeight + margin.bottom) + ' ' +
                      (-margin.left) + ',' + (chartHeight + margin.bottom))

    var axes = svg.append('g')
    .attr('clip-path', 'url(#axes-clip)')

    axes.append('g')
    .attr('className', 'x axis')
    .style('fill', '#000')
    .attr('transform', 'translate(0,' + chartHeight + ')')
    .call(xAxis)

    axes.append('g')
    .attr('className', 'y axis')
    .style('fill', '#000')
    .call(yAxis)
    .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 6)
      .attr('dy', '.71em')
      .style('text-anchor', 'end')
      .text('Time (s)')

    var legend = svg.append('g')
    .attr('className', 'legend')
    .style('fill', '#000')
    .attr('transform', 'translate(' + (chartWidth - legendWidth) + ', 0)')

    legend.append('rect')
    .style('fill', 'rgba(0, 0, 0, 0.5)')
    .style('stroke', 'rgba(0, 0, 0, 0.5)')
    .attr('width', legendWidth)
    .attr('height', legendHeight)

    legend.append('rect')
    .style('fill', 'rgba(230, 230, 255, 0.8)')
    .style('stroke', 'rgba(216, 216, 255, 0.8)')
    .attr('width', 75)
    .attr('height', 20)
    .attr('x', 10)
    .attr('y', 10)

    legend.append('text')
    .attr('x', 115)
    .attr('y', 25)
    .text('5% - 95%')

    legend.append('rect')
    .attr('className', 'inner')
    .style('fill', 'rgba(127, 127, 255, 0.8)')
    .style('stroke', 'rgba(96, 96, 255, 0.8)')
    .attr('width', 75)
    .attr('height', 20)
    .attr('x', 10)
    .attr('y', 40)

    legend.append('text')
    .attr('x', 115)
    .attr('y', 55)
    .text('25% - 75%')

    legend.append('path')
    .attr('className', 'median-line')
    .style('fill', 'none')
    .style('stroke', '#000')
    .style('stroke-width', '3')
    .attr('d', 'M10,80L85,80')

    legend.append('text')
    .attr('x', 115)
    .attr('y', 85)
    .text('Median')
  }

  drawPaths (svg, data, x, y) {
    var upperOuterArea = d3.area()
    .x(function (d) { return x(d.date) || 1 })
    .y0(function (d) { return y(d.pct95) })
    .y1(function (d) { return y(d.pct75) })
    .curve(d3.curveBasis)

    var upperInnerArea = d3.area()
    .curve(d3.curveBasis)
    .x(function (d) { return x(d.date) || 1 })
    .y0(function (d) { return y(d.pct75) })
    .y1(function (d) { return y(d.pct50) })

    var medianLine = d3.line()
    .curve(d3.curveBasis)
    .x(function (d) { return x(d.date) })
    .y(function (d) { return y(d.pct50) })

    var lowerInnerArea = d3.area()
    .curve(d3.curveBasis)
    .x(function (d) { return x(d.date) || 1 })
    .y0(function (d) { return y(d.pct50) })
    .y1(function (d) { return y(d.pct25) })

    var lowerOuterArea = d3.area()
    .curve(d3.curveBasis)
    .x(function (d) { return x(d.date) || 1 })
    .y0(function (d) { return y(d.pct25) })
    .y1(function (d) { return y(d.pct05) })

    svg.datum(data)

    svg.append('path')
    // .attr('className', 'area upper outer')
    .style('fill', 'rgba(230, 230, 255, 0.8)')
    .style('stroke', 'rgba(216, 216, 255, 0.8)')
    .attr('d', upperOuterArea)
    .attr('clip-path', 'url(#rect-clip)')

    svg.append('path')
    .attr('className', 'area lower outer')
    .style('fill', 'rgba(230, 230, 255, 0.8)')
    .style('stroke', 'rgba(216, 216, 255, 0.8)')
    .attr('d', lowerOuterArea)
    .attr('clip-path', 'url(#rect-clip)')

    svg.append('path')
    .attr('className', 'area upper inner')
    .style('fill', 'rgba(127, 127, 255, 0.8)')
    .style('stroke', 'rgba(96, 96, 255, 0.8)')
    .attr('d', upperInnerArea)
    .attr('clip-path', 'url(#rect-clip)')

    svg.append('path')
    .attr('className', 'area lower inner')
    .style('fill', 'rgba(127, 127, 255, 0.8)')
    .style('stroke', 'rgba(96, 96, 255, 0.8)')
    .attr('d', lowerInnerArea)
    .attr('clip-path', 'url(#rect-clip)')

    svg.append('path')
    .attr('className', 'median-line')
    .style('fill', 'none')
    .style('stroke', '#000')
    .style('stroke-width', '3')
    .attr('d', medianLine)
    .attr('clip-path', 'url(#rect-clip)')
  }

  createChart (data, markers = []) {
    const node = this.node
    var svgWidth = 960,
      svgHeight = 500,
      margin = { top: 20, right: 20, bottom: 40, left: 40 },
      chartWidth = svgWidth - margin.left - margin.right,
      chartHeight = svgHeight - margin.top - margin.bottom

    var x = d3.scaleTime().range([0, chartWidth])
            .domain(d3.extent(data, function (d) { return d.date })),
      y = d3.scaleLinear().range([chartHeight, 0])
            .domain([0, d3.max(data, function (d) { return d.pct95 })])

    var xAxis = d3.axisBottom(x)
                .tickSizeInner(-chartHeight).tickSizeOuter(0).tickPadding(10),
      yAxis = d3.axisLeft(y)
                .tickSizeInner(-chartWidth).tickSizeOuter(0).tickPadding(10)

    var svg = d3.select(node)
    .attr('width', svgWidth)
    .attr('height', svgHeight)
    .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

    this.addAxesAndLegend(svg, xAxis, yAxis, margin, chartWidth, chartHeight)
    this.drawPaths(svg, data, x, y)
  }

  render () {
    return (
      <svg ref={(node) => this.node = node}
         />

    )
  }
}

export default CreateBarGraph
