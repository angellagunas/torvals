import React, { Component } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Button,
  Card,
  CardBody,
  CardTitle,
  Collapse,
  Row,
  Table,
  Col,
  Input,
  InputGroup,
  InputGroupAddon,
} from 'reactstrap';
import { CustomTooltips } from '@coreui/coreui-plugin-chartjs-custom-tooltips';
import { getStyle } from '@coreui/coreui/dist/js/coreui-utilities';
import axios from "axios";

const brandPrimary = getStyle('--primary')
const brandInfo = getStyle('--info')

// Card Chart 1
const cardChartData1 = {
  labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
  datasets: [
    {
      label: 'My First dataset',
      backgroundColor: brandPrimary,
      borderColor: 'rgba(255,255,255,.55)',
      data: [65, 59, 84, 84, 51, 55, 40],
    },
  ],
};

const cardChartOpts1 = {
  tooltips: {
    enabled: false,
    custom: CustomTooltips
  },
  maintainAspectRatio: false,
  legend: {
    display: false,
  },
  scales: {
    xAxes: [
      {
        gridLines: {
          color: 'transparent',
          zeroLineColor: 'transparent',
        },
        ticks: {
          fontSize: 2,
          fontColor: 'transparent',
        },

      }],
    yAxes: [
      {
        display: false,
        ticks: {
          display: false,
          min: Math.min.apply(Math, cardChartData1.datasets[0].data) - 5,
          max: Math.max.apply(Math, cardChartData1.datasets[0].data) + 5,
        },
      }],
  },
  elements: {
    line: {
      borderWidth: 1,
    },
    point: {
      radius: 4,
      hitRadius: 10,
      hoverRadius: 4,
    },
  }
}


// Card Chart 2
const cardChartData2 = {
  labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
  datasets: [
    {
      label: 'My First dataset',
      backgroundColor: brandInfo,
      borderColor: 'rgba(255,255,255,.55)',
      data: [1, 18, 9, 17, 34, 22, 11],
    },
  ],
};

const cardChartOpts2 = {
  tooltips: {
    enabled: false,
    custom: CustomTooltips
  },
  maintainAspectRatio: false,
  legend: {
    display: false,
  },
  scales: {
    xAxes: [
      {
        gridLines: {
          color: 'transparent',
          zeroLineColor: 'transparent',
        },
        ticks: {
          fontSize: 2,
          fontColor: 'transparent',
        },

      }],
    yAxes: [
      {
        display: false,
        ticks: {
          display: false,
          min: Math.min.apply(Math, cardChartData2.datasets[0].data) - 5,
          max: Math.max.apply(Math, cardChartData2.datasets[0].data) + 5,
        },
      }],
  },
  elements: {
    line: {
      tension: 0.00001,
      borderWidth: 1,
    },
    point: {
      radius: 4,
      hitRadius: 10,
      hoverRadius: 4,
    },
  },
};

class Dashboard extends Component {
  constructor(props) {
    super(props);

    this.toggle = this.toggle.bind(this);
    this.loadData = this.loadData.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleSearch = this.handleSearch.bind(this);

    this.percentage = this.percentage.bind(this)

    // colapse
    this.toggleCustom = this.toggleCustom.bind(this);

    this.state = {
      dropdownOpen: false,
      radioSelected: 2,

      // colapse vars
      collapse: false,
      accordion: [true, false, false],
      indicadorsCollapsed: false,
      status: 'Closed',
      fadeIn: true,
      timeout: 300,

      // user data
      user_email: "",
      user_route: "",

      // input search
      query_search: '',

      //indicators
      total_forecast: 0,
      total_adjustment: 0,
      average_sales: 0,
      average_return: 0,

      // table data
      rows: [],
      tableRows: [],
    };
  }

  componentWillMount(){
    const jwt = window.localStorage.getItem('jwt');
    if (!jwt){
      this.props.history.push('/login')
    }

    const profile = window.localStorage.getItem('profile');
    const route = window.localStorage.getItem('route');
    this.setState({user_email: profile})
    this.setState({user_route: route})
    this.loadData()
  }

  percentage(prediction, adjustment){
    let percentage = (
      ((adjustment - prediction) / prediction) * 100
    )

    if(isNaN(percentage) || !isFinite(percentage)){
      percentage = 0
    }

    return Math.round(percentage);
  }

  toggle() {
    this.setState({
      dropdownOpen: !this.state.dropdownOpen,
    });
  }

  handleSearch(event){
    this.setState({
      query_search: event.target.value
    })
  }

  toggleCustom(tab) {

    const prevState = this.state.indicadorsCollapsed;

    this.setState({
      indicadorsCollapsed: !prevState,
    });
  }

  async handleChange (e, row_id) {
    const config = {
      'headers': {
        'Authorization': 'Bearer ' + window.localStorage.getItem('jwt')
      }
    }

    await axios
      .patch(
        "api/v2/datasetrows/" + row_id,
        {'adjustment': e.target.value},
        config
      ).then(res => {
        console.info(res)
      })
      .catch(error => {
        console.error(error)
      });
  }

  async loadData(){
    const config = {
      'headers': {
        'Authorization': 'Bearer ' + window.localStorage.getItem('jwt')
      }
    }

    const url = "api/v2/datasetrows?q=" + this.state.query_search;

    await axios
      .get(url, config)
      .then(res => {
        const data_response = res.data.results;

        const prediction = data_response.reduce((a, b) => +a + +b.prediction, 0);
        const adjustment = data_response.reduce((a, b) => +a + +b.adjustment, 0);
        const sales = data_response.reduce((a, b) => +a + +b.sale, 0);
        const returns = data_response.reduce((a, b) => +a + +b.refund, 0);

        this.setState({
          'rows': data_response,
          'total_forecast': prediction,
          'total_adjustment': adjustment,
          'average_sales': sales,
          'average_return': returns
        });
        this.getTableRows();
      })
      .catch(error => {
        console.error(error)
      });
  }

  _random(){
    return Math.floor(Math.random() * 1000);
  }

  random(num) {
    return (this._random() * num) + 1
  }

  getTableRows(){
    let tableRows = [];

    for(const row of this.state.rows){
      tableRows.push((
        <tr key={"row_" + this.random(row.id)}>
          <td key={"cell_product_name_" + this.random(row.id)}>
            <div>
              {row.product.name}
            </div>
            <div className="small text-muted">
              <span>ID</span> | {row.product.externalId}
            </div>
          </td>
          <td key={"cell_suggest_" + this.random(row.id)} className="text-center">
            <div>
              <strong>{row.prediction}</strong>
            </div>
          </td>
          <td key={"cell_adjustment_" + this.random(row.id)} className="text-center justify-content-center align-items-center" style={{ width: 80 + 'px' }}>
            <Input type="text" id="input3-group2" name="input3-group2" defaultValue={row.adjustment} onChange={(e) => {this.handleChange(e, row.id)}} />
          </td>
          <td key={"cell_devolucion_" + this.random(row.id)} className="text-center">
            <div>
              <strong>{row.refund || 0}</strong>
            </div>
          </td>
          <td key={"cell_venta_" + this.random(row.id)} className="text-center">
            <div>
              <strong>{row.sale || 0}</strong>
            </div>
          </td>
          <td key={"cell_venta_" + this.random(row.id)} className="text-center">
            <div>
              <strong>{this.percentage(row.prediction, row.adjustment)} %</strong>
            </div>
          </td>
        </tr>
      ));
    }

    this.setState({
      'tableRows': tableRows
    });
  }

  getIconCollapse(){
    return this.state.indicadorsCollapsed ? 'icon-size-actual' : 'icon-size-fullscreen'
  }

  loading = () => <div className="animated fadeIn pt-1 text-center">Loading...</div>

  render() {

    return (
      <div className="animated fadeIn">
        <Row>
          <Col>
            <Card>
              <CardBody>
                <Row className="row align-items-center" onClick={() => this.toggleCustom()}>
                  <Col className="col" sm="5">
                    <CardTitle className="mb-0">Indicadores</CardTitle>
                  </Col>
                  <Col sm="7" className="col d-none d-sm-inline-block">
                    <Button color="primary" className="float-right" onClick={() => this.toggleCustom()}>
                      <i className={this.getIconCollapse()}></i>
                    </Button>
                  </Col>
                </Row>
                <div className="chart-wrapper" style={{ marginTop: 5 + 'px' }}>
                    <Collapse isOpen={this.state.indicadorsCollapsed} data-parent="#exampleAccordion" id="exampleAccordion2">
                      <Row className="row">

                        <Col xs={{ size: 12, offset: 0 }} sm={{ size: 6, offset: 0 }} md={{ size: 3 }} lg={{ size: 3 }}>
                          <Card className="text-white bg-info">
                            <CardBody className="pb-0">
                              <div className="text-value">{ this.state.total_forecast }</div>
                              <div>Predicción total</div>
                            </CardBody>
                            <div className="chart-wrapper mx-3" style={{ height: '70px' }}>
                              <Line data={cardChartData2} options={cardChartOpts2} height={70} />
                            </div>
                          </Card>
                        </Col>

                        <Col xs={{ size: 12, offset: 0 }} sm={{ size: 6, offset: 0 }} md={{ size: 3 }} lg={{ size: 3 }}>
                          <Card className="text-white bg-primary">
                            <CardBody className="pb-0">
                              <div className="text-value">{ this.state.total_adjustment }</div>
                              <div>Ajuste Total</div>
                            </CardBody>
                            <div className="chart-wrapper mx-3" style={{ height: '70px' }}>
                              <Line data={cardChartData1} options={cardChartOpts1} height={70} />
                            </div>
                          </Card>
                        </Col>

                        <Col xs={{ size: 12, offset: 0 }} sm={{ size: 6, offset: 0 }} md={{ size: 3 }} lg={{ size: 3 }}>
                          <Card className="text-white bg-info">
                            <CardBody className="pb-0">
                              <div className="text-value">{ this.state.average_sales }</div>
                              <div>Venta Promedio Total</div>
                            </CardBody>
                            <div className="chart-wrapper mx-3" style={{ height: '70px' }}>
                              <Line data={cardChartData2} options={cardChartOpts2} height={70} />
                            </div>
                          </Card>
                        </Col>

                        <Col xs={{ size: 12, offset: 0 }} sm={{ size: 6, offset: 0 }} md={{ size: 3 }} lg={{ size: 3 }}>
                          <Card className="text-white bg-primary">
                            <CardBody className="pb-0">
                              <div className="text-value">{ this.state.average_return }</div>
                              <div>Devolución Promedio Total</div>
                            </CardBody>
                            <div className="chart-wrapper mx-3" style={{ height: '70px' }}>
                              <Line data={cardChartData1} options={cardChartOpts1} height={70} />
                            </div>
                          </Card>
                        </Col>
                      </Row>
                    </Collapse>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>
        
        <Row>
          <Col>
            <Card>
              <CardBody>
                <Row>
                  <Col xs="12" sm="12" md="5">
                    <CardTitle className="mb-0">
                      Ajustes - Ruta {this.state.user_route}
                    </CardTitle>
                    <div className="small text-muted">Pedido sugerido para el 04 de Marzo del 2019 </div>
                  </Col>
                  <Col xs="12" sm="12" md="7" className="d-none d-sm-inline-block">
                    <Row className="justify-content-end">
                      <Col xs="11" sm="11" md="10" lg="11">
                        <InputGroup>
                          <Input type="text" id="input3-group2" name="input3-group2" placeholder="Search" onChange={this.handleSearch} />
                          <InputGroupAddon addonType="append">
                            <Button type="button" color="primary" onClick={this.loadData}>
                              <i className="fa fa-search"></i>
                            </Button>
                          </InputGroupAddon>
                        </InputGroup>
                      </Col>
                      <Col xs={{size: 1, offset: 0}} sm={{size: 1, offset: 0}} md={{size: 1, offset: 1}} lg={{size: 1, offset: 0}}>
                        <Button disabled={true} color="primary" className="float-right"><i className="icon-cloud-download"></i></Button>
                      </Col>
                    </Row>
                  </Col>
                </Row>

                <div className="chart-wrapper" style={{ marginTop: 40 + 'px' }}>
                  <Table hover responsive className="table-outline mb-0 d-none d-sm-table">
                    <thead className="thead-light">
                      <tr>
                        <th>
                          Producto
                        </th>
                        <th className="text-center">
                          Sugerido
                        </th>
                        <th className="text-center">
                          Ajuste
                        </th>
                        <th className="text-center">
                          Devolución
                        </th>
                        <th className="text-center">
                          Venta
                        </th>
                        <th className="text-center">
                          Porcentaje Ajustado
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {this.state.tableRows}
                    </tbody>
                  </Table>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>

      </div>
    );
  }
}

export default Dashboard;
