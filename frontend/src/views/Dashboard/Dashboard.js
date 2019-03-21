import React, { Component } from "react";
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
  InputGroupAddon
} from "reactstrap";
import { CustomTooltips } from "@coreui/coreui-plugin-chartjs-custom-tooltips";
import { getStyle } from "@coreui/coreui/dist/js/coreui-utilities";
import axios from "axios";
import "../../App.scss";

import { RingLoader } from 'react-spinners';
import InfiniteScroll from "react-infinite-scroll-component";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const brandPrimary = getStyle("--primary");

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
    this.percentage = this.percentage.bind(this);

    // colapse
    this.toggleCustom = this.toggleCustom.bind(this);

    //download report
    this.downloadReport = this.downloadReport.bind(this);

    //send report by email
    this.sendReport = this.sendReport.bind(this);

    //
    this.handleKeyPress = this.handleKeyPress.bind(this);

    this.state = {
      // colapse vars
      indicadorsCollapsed: false,

      // user data
      user_email: "",
      user_route: "",
      canEdit: true,

      // input search
      query_search: "",

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
        labels: ["Tránsito", "Existencia", "Safety Stock", "Pedido Final"],
        datasets: [
          {
            label: "Total",
            backgroundColor: brandPrimary,
            borderColor: "rgba(255,255,255,.55)",
            data: [65, 59, 84, 84]
          }
        ]
      },
      cardChartOpts: {
        tooltips: {
          enabled: false,
          custom: CustomTooltips
        },
        maintainAspectRatio: false,
        legend: {
          display: false
        },
        scales: {
          xAxes: [
            {
              gridLines: {
                color: "transparent",
                zeroLineColor: "transparent"
              },
              ticks: {
                fontSize: 2,
                fontColor: "transparent"
              }
            }
          ],
          yAxes: [
            {
              display: false,
              ticks: {
                display: false,
                min: Math.min.apply(Math, [65, 59, 84, 84]) - 5,
                max: Math.max.apply(Math, [65, 59, 84, 84]) + 5
              }
            }
          ]
        },
        elements: {
          line: {
            borderWidth: 1
          },
          point: {
            radius: 4,
            hitRadius: 10,
            hoverRadius: 4
          }
        }
      },
      page_number: 1
    };
  }

  componentWillMount() {
    const jwt = window.localStorage.getItem("jwt");
    if (!jwt) {
      this.props.history.push("/login");
    }

    const profile = window.localStorage.getItem("profile");
    const sale_center = window.localStorage.getItem("sale_center");
    const center_name = window.localStorage.getItem("name_center");
    const total_sale_center = window.localStorage.getItem("total_sale_center");

    this.setState({ user_email: profile });
    this.setState({ user_sale_center: sale_center });
    this.setState({ user_center_name: center_name });
    this.setState({ total_sale_center: parseInt(total_sale_center) });
    this.loadData();
  }

  _getCardChartData(data) {
    return {
      labels: ["Tránsito", "Existencia", "Safety Stock", "Pedido Final"],
      datasets: [
        {
          label: "Total",
          backgroundColor: brandPrimary,
          borderColor: "rgba(255,255,255,.55)",
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
        display: false
      },
      scales: {
        xAxes: [
          {
            gridLines: {
              color: "transparent",
              zeroLineColor: "transparent"
            },
            ticks: {
              fontSize: 2,
              fontColor: "transparent"
            }
          }
        ],
        yAxes: [
          {
            display: false,
            ticks: {
              display: false,
              min: min,
              max: max
            }
          }
        ]
      },
      elements: {
        line: {
          borderWidth: 1
        },
        point: {
          radius: 4,
          hitRadius: 10,
          hoverRadius: 4
        }
      }
    };
  }

  percentage(prediction, adjustment) {
    let percentage = ((adjustment - prediction) / prediction) * 100;

    if (isNaN(percentage) || !isFinite(percentage)) {
      percentage = 0;
    }

    return Math.round(percentage);
  }

  handleSearch(event) {
    this.setState({
      query_search: event.target.value
    });
  }

  toggleCustom(tab) {
    const prevState = this.state.indicadorsCollapsed;

    this.setState({
      indicadorsCollapsed: !prevState
    });
  }

  async sendReport(e) {
    e.preventDefault();
    this.setState({
      canEdit: false
    });

    const MySwal = withReactContent(Swal);
    MySwal.fire({
      title: '¿Enviar reporte?',
      text: "Después de enviarlo ya no prodras modificar el pedido sugerido.",
      type: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      confirmButtonText: 'Enviar',
      cancelButtonColor: '#d33',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {

      if (result.value) {
        const config = {
          headers: {
            Authorization: "Bearer " + window.localStorage.getItem("jwt")
          }
        };

        await axios
          .get("api/v2/datasetrows/send", config)
          .then(res => {
            MySwal.fire(
              '¡Enviado!',
              'Tu reporte ha sido enviado a tu supervisor con copia a tu email.',
              'success'
            )
          })
          .catch(error => {
            console.error(error);
          });
      } else {
        this.setState({
          canEdit: true
        });
      }
    });
  }

  async handleChange(e, row_id) {
    e.preventDefault();

    const config = {
      headers: {
        Authorization: "Bearer " + window.localStorage.getItem("jwt")
      }
    };

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

      ind_adjustment_money
    } = this.state;

    if (originalAdjustment > e.target.value) {
      const diferenceBeetwenAdjustments = originalAdjustment - e.target.value;
      ind_adjustments -= diferenceBeetwenAdjustments;

      ind_adjustment_money -=
        diferenceBeetwenAdjustments * priceOfProductUpdated;
    } else {
      const diferenceBeetwenAdjustments = e.target.value - originalAdjustment;
      ind_adjustments += diferenceBeetwenAdjustments;

      ind_adjustment_money +=
        diferenceBeetwenAdjustments * priceOfProductUpdated;
    }

    await axios
      .patch(
        "api/v2/datasetrows/" + row_id,
        {
          adjustment: e.target.value,
          bed: bed,
          pallet: pallet
        },
        config
      )
      .then(res => {
        this.setState({
          rows: updatedRows,
          ind_adjustment_money: ind_adjustment_money,
          ind_adjustments: ind_adjustments,
          cardChartData: this._getCardChartData([
            ind_transit,
            ind_adjustments,
            ind_exists,
            ind_safety_stock
          ]),
          cardChartOpts: this._getCardChartOpts([
            ind_transit,
            ind_adjustments,
            ind_exists,
            ind_safety_stock
          ])
        });

        this.getTableRows();
      })
      .catch(error => {
        console.error(error);
      });
  }

  async loadData(e) {
    if (e) {
      e.preventDefault();
    }

    const config = {
      headers: {
        Authorization: "Bearer " + window.localStorage.getItem("jwt")
      }
    };
    // const url = "api/v2/datasetrows?page=" + this.state.page_number + "&q=" + this.state.query_search;
    const url_inds = "api/v2/datasetrows/indicators?q=" + this.state.query_search;

    await axios
      .get(url_inds, config)
      .then(res => {
        const data_response = res.data;  // [...this.state.rows, ...res.data.results];


        const transit = data_response['totalTransit'];
        const stock = data_response['totalStock'];
        const safetyStock = data_response['totalSafetyStock'];
        const adjustment = data_response['totalAdjustment']


        const transit_money = data_response['transitMoney']
        const exists_money = data_response['existsMoney']
        const safety_stock_money = data_response['safetyStockMoney']
        const adjustment_money = data_response['adjustmentMoney']

        this.setState({
          cardChartData: this._getCardChartData([
            transit,
            stock,
            safetyStock,
            adjustment
          ]),
          cardChartOpts: this._getCardChartOpts([
            transit,
            stock,
            safetyStock,
            adjustment
          ]),
          // rows: [...this.state.rows, ...data_response],


          ind_transit: transit,
          ind_exists: stock,
          ind_safety_stock: safetyStock,
          ind_adjustments: adjustment,

          ind_transit_money: transit_money,
          ind_exists_money: exists_money,
          ind_safety_stock_money: safety_stock_money,
          ind_adjustment_money: adjustment_money
        });
      })
      .catch(error => {
        console.error(error);
      });

    const url = "api/v2/datasetrows?page=" + this.state.page_number + "&q=" + this.state.query_search;

    await axios
      .get(url, config)
      .then(res => {
        const data_response = [...this.state.rows, ...res.data.results];

        let date = "";
        const months = [
          "Enero",
          "Febrero",
          "Marzo",
          "Abril",
          "Mayo",
          "Junio",
          "Julio",
          "Agosto",
          "Septiembre",
          "Octubre",
          "Noviembre",
          "Diciembre"
        ];

        if (data_response.length > 0) {
          date = new Date(data_response[0].date);
          date =
            date.getUTCDate() +
            " de " +
            months[date.getUTCMonth()] +
            " del " +
            date.getUTCFullYear();
        }

        this.setState({
          rows: [...this.state.rows, ...data_response],
          date: date
        })

      })
      .catch(error => {
        console.error(error);
      });

  }

  getTableRows() {
    let tableRows = [];

    for (let i = 0; i < this.state.rows.length; i++) {
      const row = this.state.rows[i];

      tableRows.push(
        <tr key={"row_" + i}>
          <td key={"cell_product_name_" + i}>
            <div>{row.product.name}</div>
            <div className="small text-muted">
              <span>ID</span> | {row.product.externalId}
            </div>
          </td>
          <td
            key={"cell_adjustment_" + i + "_" + Math.random()}
            className="text-center justify-content-center align-items-center"
            style={{ width: 120 + "px" }}
          >
            {this.state.canEdit ?
              (<Input className="text-center"
                tabIndex={i + 1}
                type="number"
                id="input3-group2"
                name="input3-group2"
                defaultValue={row.adjustment}
                onBlur={e => {
                  this.handleChange(e, row.id);
                }}
                onKeyPress={e => {
                  this.handleKeyPress(e, row.id)
                }}
              />) : (
                <div>{row.adjustment}</div>
              )
            }
          </td>
          <td key={"cell_empty_" + i} />
          <td key={"cell_stocks_" + i + "_" + Math.random()}>
            <div className="medium text-muted">
              <span>
                <strong>Transito:</strong>
              </span>{" "}
              {row.transit}
            </div>
            <div className="medium text-muted">
              <span>
                <strong>Existencia:</strong>
              </span>{" "}
              {row.inStock}
            </div>
            <div className="medium text-muted">
              <span>
                <strong>Safety Stock:</strong>
              </span>{" "}
              {row.safetyStock}
            </div>
          </td>
          <td key={"cell_prediction_" + i + "_" + Math.random()}>
            <div className="medium text-muted">
              <span>
                <strong>Ajustado: </strong>
              </span>
              {this.percentage(
                this.state.rows[i].prediction,
                this.state.rows[i].adjustment
              )}{" "}
              %
            </div>
            <div className="medium text-muted">
              <span>
                <strong>Sugerido: </strong>
              </span>{" "}
              {row.prediction}
            </div>
            <div className="medium text-muted">
              <span>
                <strong>Pedido Camas: </strong>
              </span>{" "}
              {row.bed}
            </div>
            <div className="medium text-muted">
              <span>
                <strong>Pedido Tarimas: </strong>
              </span>{" "}
              {row.pallet}
            </div>
          </td>
          <td key={"corrugados" + i + "_" + Math.random()}>
            <div className="medium text-muted">
              <span>
                <strong>C/ Camas: </strong>
              </span>{" "}
              {row.product.bed}
            </div>
            <div className="medium text-muted">
              <span>
                <strong>C/ Tarimas: </strong>
              </span>{" "}
              {row.product.pallet}
            </div>
          </td>
        </tr>
      );
    }

    return tableRows;
  }

  getIconCollapse() {
    return this.state.indicadorsCollapsed
      ? "fa fa-angle-up"
      : "fa fa-angle-down";
  }

  loading = () => (
    <div className="animated fadeIn pt-1 text-center">Loading...</div>
  );

  async downloadReport(e) {
    if (e) {
      e.preventDefault();
    }

    const config = {
      headers: {
        Authorization: "Bearer " + window.localStorage.getItem("jwt")
      }
    };
    const file_name =
      "adjustment_report_ceve_" +
      this.state.user_sale_center +
      "_" +
      this.state.date.replace(/ /g, "_") +
      ".csv";
    const url = "api/v2/datasetrows/download";
    const responseType = "blob";
    await axios
      .get(url, config, responseType)
      .then(response => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", file_name);
        document.body.appendChild(link);
        link.click();
      })
      .catch(error => {
        console.error(error);
      });
  }

  fetchMoreData = () => {
    this.setState({
      page_number: this.state.page_number + 1
    });
    this.loadData();
  };

  handleKeyPress(e, row_id) {
    if (e.key === 'Enter') {
      this.handleChange(e, row_id)
    }
  }

  render() {
    return (
      <div className="animated fadeIn">
        <InfiniteScroll
          dataLength={this.state.rows.length}
          next={this.fetchMoreData}
          hasMore={true}
          loader={<div className='sweet-loading'>
            <RingLoader
              sizeUnit={"px"}
              size={50}
              color={'#123abc'}
              radius={5}
              loading={this.state.loading}
            />
          </div>}
        >
          <Row>
            <Col>
              <Card>
                <CardBody>
                  <div
                    className="chart-wrapper"
                    style={{ marginTop: 20 + "px" }}
                  >
                    <Collapse isOpen={true}>
                      <Row className="row">
                        <Col
                          xs={{ size: 12, offset: 0 }}
                          sm={{ size: 6, offset: 0 }}
                          md={{ size: 3 }}
                          lg={{ size: 3 }}
                        >
                          <Card className="text-white bg-primary">
                            <CardBody>
                              <div className="text-value">
                                {this.state.ind_transit +
                                  " - $" +
                                  Math.round(this.state.ind_transit_money)}
                              </div>
                              <div>Tránsito</div>
                            </CardBody>
                          </Card>
                        </Col>

                        <Col
                          xs={{ size: 12, offset: 0 }}
                          sm={{ size: 6, offset: 0 }}
                          md={{ size: 3 }}
                          lg={{ size: 3 }}
                        >
                          <Card className="text-white bg-primary">
                            <CardBody>
                              <div className="text-value">
                                {this.state.ind_exists +
                                  " - $" +
                                  Math.round(this.state.ind_exists_money)}
                              </div>
                              <div>Existencia</div>
                            </CardBody>
                          </Card>
                        </Col>

                        <Col
                          xs={{ size: 12, offset: 0 }}
                          sm={{ size: 6, offset: 0 }}
                          md={{ size: 3 }}
                          lg={{ size: 3 }}
                        >
                          <Card className="text-white bg-primary">
                            <CardBody>
                              <div className="text-value">
                                {this.state.ind_safety_stock +
                                  " - $" +
                                  Math.round(this.state.ind_safety_stock_money)}
                              </div>
                              <div>Safety Stock</div>
                            </CardBody>
                          </Card>
                        </Col>

                        <Col
                          xs={{ size: 12, offset: 0 }}
                          sm={{ size: 6, offset: 0 }}
                          md={{ size: 3 }}
                          lg={{ size: 3 }}
                        >
                          <Card className="text-white bg-primary">
                            <CardBody>
                              <div className="text-value">
                                {this.state.ind_adjustments +
                                  " - $" +
                                  Math.round(this.state.ind_adjustment_money)}
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
                        Centro de Venta {this.state.user_sale_center} - {" "}
                        {this.state.user_center_name}

                        {this.state.total_sale_center > 1 ? " y " + (this.state.total_sale_center - 1) + " más." : ""}
                      </CardTitle>
                      <div className="small text-muted">
                        Pedido sugerido para el {this.state.date}
                      </div>
                    </Col>
                    <Col
                      xs="12"
                      sm="12"
                      md="7"
                      className="d-none d-sm-inline-block"
                    >
                      <Row className="justify-content-end">
                        <Col xs="10" sm="10" md="9" lg="10">
                          <Form onSubmit={this.loadData} autoComplete="off">
                            <InputGroup>
                              <Input
                                type="text"
                                id="input3-group2"
                                name="input3-group2"
                                placeholder="Search"
                                onChange={this.handleSearch}
                              />
                              <InputGroupAddon addonType="append">
                                <Button
                                  type="button"
                                  color="primary"
                                  onClick={this.loadData}
                                  title="Buscar productos por nombre o ID"
                                >
                                  <i className="fa fa-search" />
                                </Button>
                              </InputGroupAddon>
                            </InputGroup>
                          </Form>
                        </Col>
                        <Col
                          xs={{ size: 1, offset: 0 }}
                          sm={{ size: 1, offset: 0 }}
                          md={{ size: 1, offset: 1 }}
                          lg={{ size: 1, offset: 0 }}
                        >
                          <Button
                            disabled={false}
                            color="primary"
                            className="float-right"
                            title="Descargar reporte"
                            onClick={this.downloadReport}
                          >
                            <i className="icon-cloud-download" />
                          </Button>
                        </Col>
                        <Col
                          xs={{ size: 1, offset: 0 }}
                          sm={{ size: 1, offset: 0 }}
                          md={{ size: 1, offset: 0 }}
                          lg={{ size: 1, offset: 0 }}
                        >
                          <Button
                            disabled={false}
                            color="primary"
                            className="float-right"
                            title="Enviar pedido por E-mail"
                            onClick={this.sendReport}
                          >
                            <i className="fa fa-envelope" />
                          </Button>
                        </Col>
                      </Row>
                    </Col>
                  </Row>

                  <div
                    className="chart-wrapper"
                    style={{ marginTop: 40 + "px" }}
                  >
                    <Table
                      hover
                      responsive
                      className="table-outline mb-0 d-sm-table"
                    >
                      <thead className="thead-light">
                        <tr>
                          <th className="text-center">Producto</th>
                          <th className="text-center">Pedido Final</th>
                          <th className="text-center" />
                          <th className="text-center" />
                          <th className="text-center" />
                          <th className="text-center" />
                        </tr>
                      </thead>
                      <tbody>{this.getTableRows()}</tbody>
                    </Table>
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </InfiniteScroll>
      </div>
    );
  }
}

export default Dashboard;
