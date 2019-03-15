import React, { Component } from 'react';
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

    //download report
    this.downloadReport = this.downloadReport.bind(this);

    this.state = {
      // colapse vars
      indicadorsCollapsed: false,

      // user data
      user_email: "",
      user_route: "",

      // input search
      query_search: '',

      //indicators
      ind_transit: 0,
      ind_exists: 0,
      ind_safety_stock: 0,
      ind_adjustments: 0,

      ind_transit_money: 0,
      ind_exists_money: 0,
      ind_safety_stock_money: 0,
      ind_adjustment_money: 0,

      // table data
      rows: [],
      date: "",

      // Card Chart
      cardChartData: {
        labels: ['Tránsito', 'Existencia', 'Safety Stock', 'Pedido Final'],
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
      labels: ['Tránsito', 'Existencia', 'Safety Stock', 'Pedido Final'],
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

  async sendReport(e) {
    e.preventDefault();
    const config = {
      'headers': {
        'Authorization': 'Bearer ' + window.localStorage.getItem('jwt')
      }
    }
    console.log('Entro')
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
    let bed = 0;
    let pallet = 0;
    const updatedRows = this.state.rows.map(x => {
      if (x.id === row_id) {
        originalAdjustment = x.adjustment;
        x.adjustment = e.target.value;
        x.bed = Math.round(x.adjustment / x.product.bed);
        x.pallet = Math.round(x.adjustment / x.product.pallet);

        bed = x.bed;
        pallet = x.pallet;

        priceOfProductUpdated = x.product.price;
      }

      return x;
    });

    let {
      ind_transit,
      ind_adjustments,
      ind_exists,
      ind_safety_stock,

      ind_adjustment_money,
    } = this.state;

    if (originalAdjustment > e.target.value) {
      const diferenceBeetwenAdjustments = originalAdjustment - e.target.value;
      ind_adjustments -= diferenceBeetwenAdjustments;

      ind_adjustment_money -= (diferenceBeetwenAdjustments * priceOfProductUpdated);
    } else {
      const diferenceBeetwenAdjustments = e.target.value - originalAdjustment;
      ind_adjustments += diferenceBeetwenAdjustments;

      ind_adjustment_money += (diferenceBeetwenAdjustments * priceOfProductUpdated);
    }

    await axios
      .patch(
        "api/v2/datasetrows/" + row_id,
        {
          'adjustment': e.target.value,
          'bed': bed,
          'pallet': pallet
        },
        config
      ).then(res => {

        this.setState({
          rows: updatedRows,
          ind_adjustment_money: ind_adjustment_money,
          ind_adjustments: ind_adjustments,
          'cardChartData': this._getCardChartData([
            ind_transit, ind_adjustments, ind_exists, ind_safety_stock]),
          'cardChartOpts': this._getCardChartOpts([
            ind_transit, ind_adjustments, ind_exists, ind_safety_stock]),
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

        if (data_response.length > 0) {
          date = new Date(data_response[0].date);
          date = date.getUTCDate() + ' de ' + months[date.getUTCMonth()] + ' del ' + date.getUTCFullYear();
        }

        // hacemos sumatoria para los indicadores
        const transit = data_response.reduce((a, b) => +a + +b.transit, 0);
        const stock = data_response.reduce((a, b) => +a + +b.inStock, 0);
        const safetyStock = data_response.reduce((a, b) => +a + +b.safetyStock, 0);
        const adjustment = data_response.reduce((a, b) => +a + +b.adjustment, 0);

        const transit_money = data_response.reduce((a, b) => +a + +(b.transit * b.product.price), 0);
        const exists_money = data_response.reduce((a, b) => +a + +(b.inStock * b.product.price), 0);
        const safety_stock_money = data_response.reduce((a, b) => +a + +(b.safetyStock * b.product.price), 0);
        const adjustment_money = data_response.reduce((a, b) => +a + +(b.adjustment * b.product.price), 0);

        this.setState({
          'cardChartData': this._getCardChartData([transit, stock, safetyStock, adjustment]),
          'cardChartOpts': this._getCardChartOpts([transit, stock, safetyStock, adjustment]),
          'rows': data_response,
          'date': date,

          'ind_transit': transit,
          'ind_exists': stock,
          'ind_safety_stock': safetyStock,
          'ind_adjustments': adjustment,

          'ind_transit_money': transit_money,
          'ind_exists_money': exists_money,
          'ind_safety_stock_money': safety_stock_money,
          'ind_adjustment_money': adjustment_money,
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
          <td key={"cell_adjustment_" + i + '_' + Math.random()} className="text-center justify-content-center align-items-center" style={{ width: 120 + 'px' }}>
            <Input tabIndex={i + 1} type="number" className="text-center" id="input3-group2" name="input3-group2" defaultValue={row.adjustment} onBlur={(e) => { this.handleChange(e, row.id) }} />
          </td>
          <td key={"cell_empty_" + i}>
          </td>
          <td key={"cell_stocks_" + i + '_' + Math.random()}>
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
          <td key={"cell_prediction_" + i + '_' + Math.random()}>
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
    if (e) {
      e.preventDefault();
    }

    const config = {
      'headers': {
        'Authorization': 'Bearer ' + window.localStorage.getItem('jwt')
      }
    }
    const file_name = 'adjustment_report_ceve_' + this.state.user_sale_center + '_' + this.state.date.replace(/ /g, '_') + '.csv';
    const url = "api/v2/datasetrows/download";
    const responseType = 'blob'
    await axios
      .get(url, config, responseType)
      .then(response => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', file_name);
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
                <div className="chart-wrapper" style={{ marginTop: 20 + 'px' }}>
                  <Collapse isOpen={true}>
                    <Row className="row">
                      <Col xs={{ size: 12, offset: 0 }} sm={{ size: 6, offset: 0 }} md={{ size: 3 }} lg={{ size: 3 }}>
                        <Card className="text-white bg-primary">
                          <CardBody>
                            <div className="text-value">
                              {this.state.ind_transit + ' - $' + Math.round(this.state.ind_transit_money)}
                            </div>
                            <div>Tránsito</div>
                          </CardBody>
                        </Card>
                      </Col>

                      <Col xs={{ size: 12, offset: 0 }} sm={{ size: 6, offset: 0 }} md={{ size: 3 }} lg={{ size: 3 }}>
                        <Card className="text-white bg-primary">
                          <CardBody>
                            <div className="text-value">
                              {this.state.ind_exists + ' - $' + Math.round(this.state.ind_exists_money)}
                            </div>
                            <div>Existencia</div>
                          </CardBody>
                        </Card>
                      </Col>

                      <Col xs={{ size: 12, offset: 0 }} sm={{ size: 6, offset: 0 }} md={{ size: 3 }} lg={{ size: 3 }}>
                        <Card className="text-white bg-primary">
                          <CardBody>
                            <div className="text-value">
                              {this.state.ind_safety_stock + ' - $' + Math.round(this.state.ind_safety_stock_money)}
                            </div>
                            <div>Safety Stock</div>
                          </CardBody>
                        </Card>
                      </Col>

                      <Col xs={{ size: 12, offset: 0 }} sm={{ size: 6, offset: 0 }} md={{ size: 3 }} lg={{ size: 3 }}>
                        <Card className="text-white bg-primary">
                          <CardBody>
                            <div className="text-value">
                              {this.state.ind_adjustments + ' - $' + Math.round(this.state.ind_adjustment_money)}
                            </div>
                            <div>Pedido Final</div>
                          </CardBody>
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
                        <Button disabled={true} color="primary" className="float-right" title="Enviar pedido por E-mail" onClick={this.sendReport}>
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
