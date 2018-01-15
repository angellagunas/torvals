import React, { Component } from 'react'
import api from '~base/api'
import CreateBarGraph from './components/create-bargraph'
import Loader from '~base/components/spinner'

class PredictionsGraph extends Component {
  constructor (props) {
    super(props)

    this.state = {
      loading: true,
      loaded: false,
      graphProductSelected: '',
      graphIsPristine: true,
      productsList: [],
      graphData: []
    }
  }

  async loadGraphData () {
    let url = '/admin/forecasts/graphData/' + this.props.match.params.uuid
    let params = {}
    if (this.state.graphProductSelected.length > 0) {
      params = {id: this.state.graphProductSelected}
    }
    const body = await api.get(url, params)
    this.setState({
      loading: false,
      loaded: true,
      productsList: body.products,
      graphData: body.data.map(item => ({...item, ds: item[item.hasOwnProperty('ds') ? 'ds' : 'sds']}))
    })
  }

  componentWillMount () {
    this.setState({
      loading: true,
      loaded: false
    }, () => this.loadGraphData())
  }

  handleGraphFilters (e) {
    this.setState({
      graphProductSelected: e.target.value,
      graphIsPristine: false,
      loading: true,
      loaded: false
    }, () => this.loadGraphData())
  }

  render () {
    const { graphData, productsList, graphProductSelected, loading } = this.state
    const loaderBackgroundStyles = {
      flexDirection: 'column',
      justifyContent: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      zIndex: 10
    }
    let products
    let loader
    let barGraph

    if (loading) {
      loader = <div
        className='is-fullwidth is-absolute full-height is-flex'
        style={loaderBackgroundStyles}>
        <Loader />
      </div>
    }

    if (!loading && Object.keys(graphData).length === 0) {
      barGraph = <div className='notification has-text-centered'>No hay datos Generales de esta predicción</div>
    }

    if (Object.keys(graphData).length > 0) {
      barGraph = <CreateBarGraph
        data={graphData}
        size={[250, 250]}
        width='960'
        height='500'
        pristine={this.state.graphIsPristine}
      />
    }
    products = productsList
      .sort((a, b) => Number(a.itemId) - Number(b.itemId))
      .map((item, index) => {
        return (<option key={index} value={item.itemId}>{item.itemId} - {item.name}</option>)
      })

    return (<div className='card'>
      <header className='card-header'>
        <p className='card-header-title'>
        Predictions Graph
      </p>
      </header>

      <div className='card-content'>
        <div className='columns is-multiline is-relative'>
          {loader}
          <div className='column is-5 is-offset-7'>
            <div className='field is-horizontal is-grouped is-grouped-right'>
              <div className='field-label'>
                <label className='label'>Productos</label>
              </div>
              <div className='field-body'>
                <div className='field'>
                  <div className='control'>
                    <div className='select is-fullwidth'>
                      <select
                        className='is-fullwidth'
                        value={graphProductSelected}
                        onChange={(e) => this.handleGraphFilters(e)}>
                        <option value='' />
                        {products}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className='column is-relative'>
            {barGraph}
          </div>
        </div>
      </div>
    </div>)
  }
}

export default PredictionsGraph
