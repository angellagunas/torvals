import React, { Component } from 'react';
import * as d3 from 'd3';
const _ = require('lodash');

class CreateBarGraph extends Component {
  constructor(props) {
    super(props);
    this.createChart = this.createChart.bind(this);

    this.state = {
      data: [],
      pristine: true,
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.pristine === false) {
      let data = this.getformattedValues(nextProps.data);
      this.setState({ data }, function() {
        this.updateAxes(this.state.svg, this.state.data);
      });
    }
  }

  componentDidMount() {
    let { pristine, data } = this.props;
    data = this.getformattedValues(data);
    this.setState({ data, pristine }, function() {
      this.createChart(this.state.data, [], this.addAxes, this.drawPaths);
    });
  }

  getformattedValues(props) {
    let parseTime = d3.timeParse('%Y-%m-%d');
    let data = _.map(props, item => {
      return {
        ds: parseTime(item.ds),
        yhat_upper: parseInt(item.yhat_upper),
        yhat: parseInt(item.yhat),
        yhat_lower: parseInt(item.yhat_lower),
      };
    });
    return data;
  }

  addAxes(svg, xAxis, yAxis, margin, chartWidth, chartHeight, node, x, y) {
    const xDate = x(new Date());
    const markerWidth = chartWidth - xDate;
    let axes = svg.append('g').attr('clip-path', 'url(#axes-clip)');

    axes
      .append('g')
      .attr('className', 'x axis')
      .style('fill', '#c3c3c3')
      .attr('transform', 'translate(0,' + chartHeight + ')')
      .call(xAxis);

    axes
      .append('g')
      .attr('className', 'y axis')
      .style('fill', '#c3c3c3')
      .call(yAxis);

    const marker = svg
      .append('g')
      .attr('className', 'maker')
      .style('fill', '#000')
      .attr('transform', 'translate(' + (xDate - chartWidth) + ', 0)');

    marker
      .append('rect')
      .style('fill', 'rgba(0, 209, 178, 0.5)')
      .style('stroke', 'rgba(0, 209, 178, 0.5)')
      .attr('width', markerWidth)
      .attr('height', chartHeight)
      .attr('x', xDate + markerWidth);
  }

  updateAxes(svg, data) {
    if (svg) {
      svg.selectAll('*').remove();
      this.createChart(data);
    }
  }

  drawPaths(svg, data, x, y) {
    let upperOuterArea = d3
      .area()
      .x(function(d) {
        return x(d.ds) || 1;
      })
      .y0(function(d) {
        return y(d.yhat_upper);
      })
      .y1(function(d) {
        return y(d.yhat);
      })
      .curve(d3.curveBasis);

    let medianLine = d3
      .line()
      .curve(d3.curveBasis)
      .x(function(d) {
        return x(d.ds);
      })
      .y(function(d) {
        return y(d.yhat);
      });

    let lowerOuterArea = d3
      .area()
      .curve(d3.curveBasis)
      .x(function(d) {
        return x(d.ds) || 1;
      })
      .y0(function(d) {
        return y(d.yhat);
      })
      .y1(function(d) {
        return y(d.yhat_lower);
      });

    svg.datum(data);

    svg
      .append('path')
      // .attr('className', 'area upper outer')
      .style('fill', 'rgba(230, 230, 255, 0.8)')
      .style('stroke', 'rgba(216, 216, 255, 0.8)')
      .attr('d', upperOuterArea)
      .attr('clip-path', 'url(#rect-clip)');

    svg
      .append('path')
      .attr('className', 'area lower outer')
      .style('fill', 'rgba(230, 230, 255, 0.8)')
      .style('stroke', 'rgba(216, 216, 255, 0.8)')
      .attr('d', lowerOuterArea)
      .attr('clip-path', 'url(#rect-clip)');

    svg
      .append('path')
      .attr('className', 'median-line')
      .style('fill', 'none')
      .style('stroke', '#000')
      .style('stroke-width', '3')
      .attr('d', medianLine)
      .attr('clip-path', 'url(#rect-clip)');
  }

  createChart(data, markers = []) {
    const node = this.node;
    const svgWidth = 960;
    const svgHeight = 500;
    const margin = { top: 20, right: 20, bottom: 40, left: 40 };
    const chartWidth = svgWidth - margin.left - margin.right;
    const chartHeight = svgHeight - margin.top - margin.bottom;

    const x = d3
      .scaleTime()
      .range([0, chartWidth])
      .domain(
        d3.extent(data, function(d) {
          return d.ds;
        })
      );

    const y = d3
      .scaleLinear()
      .range([chartHeight, 0])
      .domain([
        d3.min(data, function(d) {
          return d.yhat_lower - 10;
        }),
        d3.max(data, function(d) {
          return d.yhat_upper;
        }),
      ]);

    const xAxis = d3
      .axisBottom(x)
      .tickSizeInner(-chartHeight)
      .tickSizeOuter(0)
      .tickPadding(10);

    const yAxis = d3
      .axisLeft(y)
      .tickSizeInner(-chartWidth)
      .tickSizeOuter(0)
      .tickPadding(10);

    let svg = d3
      .select(node)
      .attr('width', svgWidth)
      .attr('height', svgHeight)
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    this.setState(
      { svg, data, xAxis, yAxis, margin, chartWidth, chartHeight, node, x, y },
      function() {
        this.addAxes(
          svg,
          xAxis,
          yAxis,
          margin,
          chartWidth,
          chartHeight,
          node,
          x,
          y
        );
        this.drawPaths(svg, data, x, y);
      }
    );
  }

  render() {
    const viewBox = '0 0 ' + this.props.width + ' ' + this.props.height;
    return (
      <svg
        style={{ width: '100%' }}
        viewBox={viewBox}
        ref={node => (this.node = node)}
      />
    );
  }
}

export default CreateBarGraph;
