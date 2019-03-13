import React, { Component } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Button,
  Card,
  CardBody,
  CardTitle,
  Collapse,
  Form,
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


class Dashboard extends Component {
  constructor(props) {
    super(props);

    // load data from API
    this.loadData = this.loadData.bind(this);

    // is executed when user make adjustment
    this.handleChange = this.handleChange.bind(this);

    // take the search query an filter data.
    this.handleSearch = this.handleSearch.bind(this);

    // calculate graph data in indicators.
    this._getCardChartData = this._getCardChartData.bind(this);

    // calculate the percentage changed of adjustment.
    this.percentage = this.percentage.bind(this)

    // colapse
    this.toggleCustom = this.toggleCustom.bind(this);

    this.state = {
      // colapse vars
      indicadorsCollapsed: false,

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

      total_forecast_money: 0,
      total_adjustment_money: 0,
      average_sales_money: 0,
      average_return_money: 0,

      // table data
      rows: [],
      date: "",

      // Card Chart
      cardChartData: {
        labels: ['Sugerido', 'Ajuste', 'Venta Promedio', 'Devolución Promedio'],
        datasets: [
          {
            label: 'Total',
            backgroundColor: brandPrimary,
            borderColor: 'rgba(255,255,255,.55)',
            data: [65, 59, 84, 84],
          }
        ],
      },
      cardChartOpts: {
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
                min: Math.min.apply(Math, [65, 59, 84, 84]) - 5,
                max: Math.max.apply(Math, [65, 59, 84, 84]) + 5,
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

    };
  }

  componentWillMount() {
    const jwt = window.localStorage.getItem('jwt');
    if (!jwt) {
      this.props.history.push('/login')
    }

    const profile = window.localStorage.getItem('profile');
    const sale_center = window.localStorage.getItem('sale_center');
    this.setState({ user_email: profile })
    this.setState({ user_sale_center: sale_center })
    this.loadData()
  }

  _getCardChartData(data) {
    return {
      labels: ['Sugerido', 'Ajuste', 'Venta Promedio', 'Devolución Promedio'],
      datasets: [
        {
          label: 'Total',
          backgroundColor: brandPrimary,
          borderColor: 'rgba(255,255,255,.55)',
          data: data
        }
      ]
    };
  }

  _getCardChartOpts(data) {
    const min = Math.min.apply(Math, data) - 5;
    const max = Math.max.apply(Math, data) + 5;
    return {
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
              min: min,
              max: max,
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
    };
  }

  percentage(prediction, adjustment) {
    let percentage = (
      ((adjustment - prediction) / prediction) * 100
    )

    if (isNaN(percentage) || !isFinite(percentage)) {
      percentage = 0
    }

    return Math.round(percentage);
  }

  handleSearch(event) {
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

  async sendReport(e){
    e.preventDefault();
        const config = {
      'headers': {
        'Authorization': 'Bearer ' + window.localStorage.getItem('jwt')
      }
    }

    await axios
      .get("api/v2/datasetrows/send", config)
      .then(res => {
        console.info('email sent');
      })
      .catch(error => {
        console.error(error)
      });
  }

  async handleChange(e, row_id) {
    e.preventDefault();

    const config = {
      'headers': {
        'Authorization': 'Bearer ' + window.localStorage.getItem('jwt')
      }
    }

    let originalAdjustment = 0;
    let priceOfProductUpdated = 0;
    const updatedRows = this.state.rows.map(x => {
      if (x.id === row_id) {
        originalAdjustment = x.adjustment;
        x.adjustment = e.target.value;

        priceOfProductUpdated = x.product.price;
      }

      return x;
    });

    let {
      total_forecast,
      total_adjustment,
      average_sales,
      average_return,

      total_adjustment_money,
    } = this.state;

    if (originalAdjustment > e.target.value) {
      const diferenceBeetwenAdjustments = originalAdjustment - e.target.value;
      total_adjustment -= diferenceBeetwenAdjustments;

      total_adjustment_money -= (diferenceBeetwenAdjustments * priceOfProductUpdated);
    } else {
      const diferenceBeetwenAdjustments = e.target.value - originalAdjustment;
      total_adjustment += diferenceBeetwenAdjustments;

      total_adjustment_money += (diferenceBeetwenAdjustments * priceOfProductUpdated);
    }

    await axios
      .patch(
        "api/v2/datasetrows/" + row_id,
        { 'adjustment': e.target.value },
        config
      ).then(res => {

        this.setState({
          rows: updatedRows,
          total_adjustment_money: total_adjustment_money,
          total_adjustment: total_adjustment,
          'cardChartData': this._getCardChartData([
            total_forecast, total_adjustment, average_sales, average_return]),
          'cardChartOpts': this._getCardChartOpts([
            total_forecast, total_adjustment, average_sales, average_return]),
        });

        this.getTableRows();
      })
      .catch(error => {
        console.error(error)
      });
  }

  async loadData(e) {
    if (e) {
      e.preventDefault();
    }

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
        let date = "";
        const months = [
          'Enero',
          'Febrero',
          'Marzo',
          'Abril',
          'Mayo',
          'Junio',
          'Julio',
          'Agosto',
          'Septiembre',
          'Octubre',
          'Noviembre',
          'Diciembre'
        ]

        if(data_response.length > 0){
          date = new Date(data_response[0].date);
          date = date.getDate() + ' de ' + months[date.getMonth()] + ' del ' + date.getFullYear();
        }

        // hacemos sumatoria para los indicadores
        const prediction = data_response.reduce((a, b) => +a + +b.prediction, 0);
        const adjustment = data_response.reduce((a, b) => +a + +b.adjustment, 0);
        const sales = data_response.reduce((a, b) => +a + +b.sale, 0);
        const returns = data_response.reduce((a, b) => +a + +b.refund, 0);

        const forecast_money = data_response.reduce((a, b) => +a + +(b.prediction * b.product.price), 0);
        const adjustment_money = data_response.reduce((a, b) => +a + +(b.adjustment * b.product.price), 0);
        const sales_money = data_response.reduce((a, b) => +a + +(b.sale * b.product.price), 0);
        const return_money = data_response.reduce((a, b) => +a + +(b.refund * b.product.price), 0);

        this.setState({
          'cardChartData': this._getCardChartData([prediction, adjustment, sales, returns]),
          'cardChartOpts': this._getCardChartOpts([prediction, adjustment, sales, returns]),
          'rows': data_response,
          'date': date,

          'total_forecast': prediction,
          'total_adjustment': adjustment,
          'average_sales': sales,
          'average_return': returns,

          'total_forecast_money': forecast_money,
          'total_adjustment_money': adjustment_money,
          'average_sales_money': sales_money,
          'average_return_money': return_money
        });
      })
      .catch(error => {
        console.error(error)
      });
  }

  getTableRows() {
    let tableRows = [];

    for (let i = 0; i < this.state.rows.length; i++) {
      const row = this.state.rows[i];

      tableRows.push((
        <tr key={"row_" + i}>
          <td key={"cell_product_name_" + i}>
            <div>
              {row.product.name}
            </div>
            <div className="small text-muted">
              <span>ID</span> | {row.product.externalId}
            </div>
          </td>
          <td key={"cell_adjustment_" + i} className="text-center justify-content-center align-items-center" style={{ width: 120 + 'px' }}>
            <Input tabIndex={i + 1} type="number" className="text-center" id="input3-group2" name="input3-group2" defaultValue={row.adjustment} onBlur={(e) => { this.handleChange(e, row.id) }} />
          </td>
          <td key={"cell_empty_" + i}>
          </td>
          <td key={"cell_stocks_" + i}>
            <div className="medium text-muted">
              <span><strong>Transito:</strong></span> {row.transit}
            </div>
            <div className="medium text-muted">
              <span><strong>Existencia:</strong></span> {row.inStock}
            </div>
            <div className="medium text-muted">
              <span><strong>Safety Stock:</strong></span> {row.safetyStock}
            </div>
          </td>
          <td key={"cell_prediction_" + i}>
            <div className="medium text-muted">
              <span><strong>Ajustado: </strong></span>
              {this.percentage(this.state.rows[i].prediction, this.state.rows[i].adjustment)} %
            </div>
            <div className="medium text-muted">
              <span><strong>Sugerido: </strong></span> {row.prediction}
            </div>
            <div className="medium text-muted">
              <span><strong>Pedido Camas: </strong></span> {row.bed}
            </div>
            <div className="medium text-muted">
              <span><strong>Pedido Tarimas: </strong></span> {row.pallet}
            </div>
          </td>
        </tr>
      ));
    }

    return tableRows;
  }

  getIconCollapse() {
    return this.state.indicadorsCollapsed ? 'fa fa-angle-up' : 'fa fa-angle-down';
  }

  loading = () => <div className="animated fadeIn pt-1 text-center">Loading...</div>

  async downloadReport(e) {
    console.log('entro a la funcion')
    if (e) {
      e.preventDefault();
    }

    const config = {
      'headers': {
        'Authorization': 'Bearer ' + window.localStorage.getItem('jwt')
      }
    }

    const url = "api/v2/datasetdownload";
    const responseType = 'blob'
    await axios
      .get(url, config, responseType)
      .then(response => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'file.csv');
        document.body.appendChild(link);
        link.click();

      })
      .catch(error => {
        console.error(error)
      });
  }

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
                      <i style={{ fontSize: '1.4rem' }} className={this.getIconCollapse()}></i>
                    </Button>
                  </Col>
                </Row>
                <div className="chart-wrapper" style={{ marginTop: 5 + 'px' }}>
                  <Collapse isOpen={this.state.indicadorsCollapsed} data-parent="#exampleAccordion" id="exampleAccordion2">
                    <Row className="row">

                      <Col xs={{ size: 12, offset: 0 }} sm={{ size: 6, offset: 0 }} md={{ size: 3 }} lg={{ size: 3 }}>
                        <Card className="text-white bg-primary">
                          <CardBody className="pb-0">
                            <div className="text-value">
                              {this.state.total_forecast + ' - $' + this.state.total_forecast_money}
                            </div>
                            <div>Sugerido total</div>
                          </CardBody>
                          <div className="chart-wrapper mx-3" style={{ height: '70px' }}>
                            <Line data={this.state.cardChartData} options={this.state.cardChartOpts} height={70} />
                          </div>
                        </Card>
                      </Col>

                      <Col xs={{ size: 12, offset: 0 }} sm={{ size: 6, offset: 0 }} md={{ size: 3 }} lg={{ size: 3 }}>
                        <Card className="text-white bg-primary">
                          <CardBody className="pb-0">
                            <div className="text-value">
                              {this.state.total_adjustment + ' - $' + this.state.total_adjustment_money}
                            </div>
                            <div>Ajuste Total</div>
                          </CardBody>
                          <div className="chart-wrapper mx-3" style={{ height: '70px' }}>
                            <Line data={this.state.cardChartData} options={this.state.cardChartOpts} height={70} />
                          </div>
                        </Card>
                      </Col>

                      <Col xs={{ size: 12, offset: 0 }} sm={{ size: 6, offset: 0 }} md={{ size: 3 }} lg={{ size: 3 }}>
                        <Card className="text-white bg-primary">
                          <CardBody className="pb-0">
                            <div className="text-value">
                              {this.state.average_sales + ' - $' + this.state.average_sales_money}
                            </div>
                            <div>Venta Promedio Total</div>
                          </CardBody>
                          <div className="chart-wrapper mx-3" style={{ height: '70px' }}>
                            <Line data={this.state.cardChartData} options={this.state.cardChartOpts} height={70} />
                          </div>
                        </Card>
                      </Col>

                      <Col xs={{ size: 12, offset: 0 }} sm={{ size: 6, offset: 0 }} md={{ size: 3 }} lg={{ size: 3 }}>
                        <Card className="text-white bg-primary">
                          <CardBody className="pb-0">
                            <div className="text-value">
                              {this.state.average_return + ' - $' + this.state.average_return_money}
                            </div>
                            <div>Devolución Promedio Total</div>
                          </CardBody>
                          <div className="chart-wrapper mx-3" style={{ height: '70px' }}>
                            <Line data={this.state.cardChartData} options={this.state.cardChartOpts} height={70} />
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
                      Centro de Venta {this.state.user_sale_center}
                    </CardTitle>
                    <div className="small text-muted">
                      Pedido sugerido para el {this.state.date}
                    </div>
                  </Col>
                  <Col xs="12" sm="12" md="7" className="d-none d-sm-inline-block">
                    <Row className="justify-content-end">
                      <Col xs="10" sm="10" md="9" lg="10">
                        <Form onSubmit={this.loadData} autoComplete="off">
                          <InputGroup>
                            <Input type="text" id="input3-group2" name="input3-group2" placeholder="Search" onChange={this.handleSearch} />
                            <InputGroupAddon addonType="append">
                              <Button type="button" color="primary" onClick={this.loadData} title="Buscar productos por nombre o ID">
                                <i className="fa fa-search"></i>
                              </Button>
                            </InputGroupAddon>
                          </InputGroup>
                        </Form>
                      </Col>
                      <Col xs={{ size: 1, offset: 0 }} sm={{ size: 1, offset: 0 }} md={{ size: 1, offset: 1 }} lg={{ size: 1, offset: 0 }}>
                        <Button disabled={false} color="primary" className="float-right" title="Descargar reporte" onClick={this.downloadReport}>
                          <i className="icon-cloud-download"></i>
                        </Button>
                      </Col>
                      <Col xs={{ size: 1, offset: 0 }} sm={{ size: 1, offset: 0 }} md={{ size: 1, offset: 0 }} lg={{ size: 1, offset: 0 }}>
                        <Button disabled={false} color="primary" className="float-right" title="Enviar pedido por E-mail" onClick={this.sendReport}>
                          <i className="fa fa-envelope"></i>
                        </Button>
                      </Col>
                    </Row>
                  </Col>
                </Row>

                <div className="chart-wrapper" style={{ marginTop: 40 + 'px' }}>
                  <Table hover responsive className="table-outline mb-0 d-sm-table">
                    <thead className="thead-light">
                      <tr>
                        <th className="text-center">
                          Producto
                        </th>
                        <th className="text-center">
                          Pedido Final
                        </th>
                        <th className="text-center"></th>
                        <th className="text-center"></th>
                        <th className="text-center"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {this.getTableRows()}
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
