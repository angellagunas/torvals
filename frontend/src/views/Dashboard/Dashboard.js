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
import ReactDOM from 'react-dom'
import axios from "axios";
import "../../App.scss";

import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';


class Dashboard extends Component {
  constructor(props) {
    super(props);

    // load data from API
    this.loadData = this.loadData.bind(this);

    // is executed when user make adjustment
    this.handleChange = this.handleChange.bind(this);

    // calculate the percentage changed of adjustment.
    this.percentage = this.percentage.bind(this);

    // colapse
    this.toggleCustom = this.toggleCustom.bind(this);

    //download report
    this.downloadReport = this.downloadReport.bind(this);

    //send report by email
    this.sendReport = this.sendReport.bind(this);

    // handle when user press enter in adjustment field.
    this.handleKeyPress = this.handleKeyPress.bind(this);

    //load user profile
    this.loadProfile = this.loadProfile.bind(this);

    // refs
    this.input_search = React.createRef();

    this.textInput = null;

    this.state = {
      // colapse vars
      indicadorsCollapsed: false,

      // user data
      canEdit: true,
      user: {},

      //indicators
      indicators: {},
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

      // pagination
      page_number: 1
    };
  }

  componentWillMount() {
    const jwt = window.localStorage.getItem("jwt");
    if (!jwt) {
      this.props.history.push("/login");
    }

    this.loadProfile();
    this.loadData();
  }

  percentage(prediction, adjustment) {
    let percentage = ((adjustment - prediction) / prediction) * 100;

    if (isNaN(percentage) || !isFinite(percentage)) {
      percentage = 0;
    }

    return Math.round(percentage);
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
      user: {
        ...this.state.user,
        canEdit: false
      }
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
          user: {
            ...this.state.user,
            canEdit: true
          }
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
    let hasNotChanges = false;

    this.state.rows.map(x => {
      if (x.id === row_id) {
        if (x.adjustment == e.target.value) {
          hasNotChanges = true;

          return x;
        }

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

    if (hasNotChanges) {
      return;
    }

    let {
      ind_adjustments,
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

    bed = bed === Infinity ? 0 : bed;
    pallet = pallet === Infinity ? 0 : pallet;

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
          ind_adjustment_money: ind_adjustment_money,
          ind_adjustments: ind_adjustments
        });
      })
      .catch(error => {
        console.error(error);
      });
  }

  loadProfile() {
    const config = {
      headers: {
        Authorization: "Bearer " + window.localStorage.getItem("jwt")
      }
    };

    axios
      .get("api/v2/me", config)
      .then(res => {
        this.setState({
          user: res.data
        });
      })
      .catch(error => {
        console.error(error);
      });
  }

  async loadData(e) {
    let query_search = "";

    if (e) {
      e.preventDefault();
      query_search = ReactDOM.findDOMNode(this.textInput).value;
    }

    const config = {
      headers: {
        Authorization: "Bearer " + window.localStorage.getItem("jwt")
      }
    };

    const url_inds = "api/v2/datasetrows/indicators?q=" + query_search;

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

    const url = "api/v2/datasetrows?q=" + query_search;

    await axios
      .get(url, config)
      .then(res => {
        //const data_response = [...this.state.rows, ...res.data.results];

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

        if (res.data.results.length > 0) {
          date = new Date(res.data.results[0].date);
          date =
            date.getUTCDate() +
            " de " +
            months[date.getUTCMonth()] +
            " del " +
            date.getUTCFullYear();
        }

        this.setState({
          rows: res.data.results,
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
          <td key={"cell_product_name_" + row.product.externalId}>
            <div>{row.product.name}</div>
            <div className="small text-muted">
              <span>ID</span> | {row.product.externalId}
            </div>
          </td>
          <td
            key={"cell_adjustment_" + row.product.externalId}
            className="text-center justify-content-center align-items-center"
            style={{ width: 120 + "px" }}
          >
            {this.state.user.canEdit && this.state.user.project.canAdjust ?
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
          <td key={"cell_empty_" + row.product.externalId}></td>
          <td key={"cell_stocks_" + row.product.externalId + "_" + Math.random()}>
            {(this.state.user.project.transits && this.state.user.project.transits !== '') ? (
              <div className="medium text-muted">
                <span>
                  <strong>Transito:</strong>
                </span>{" "}
                {row.transit}
              </div>

            ) : null}
            {(this.state.user.project.inStock && this.state.user.project.inStock !== '') ? (
              <div className="medium text-muted">
                <span>
                  <strong>Existencia:</strong>
                </span>{" "}
                {row.inStock}
              </div>
            ) : null}
            {(this.state.user.project.safetyStock && this.state.user.project.safetyStock !== '') ? (
              <div className="medium text-muted">
                <span>
                  <strong>Safety Stock:</strong>
                </span>{" "}
                {row.safetyStock}
              </div>
            ) : null}
          </td>
          <td key={"cell_prediction_" + row.product.externalId + "_" + Math.random()}>
            {(this.state.user.project.canAdjust) ? (
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
            ) : null}
            {(this.state.user.project.canAdjust) ? (
              <div className="medium text-muted">
                <span>
                  <strong>Sugerido: </strong>
                </span>{" "}
                {row.prediction}
              </div>
            ) : null}
            {(this.state.user.project.beds && this.state.user.project.beds !== '') ? (
              <div className="medium text-muted">
                <span>
                  <strong>Pedido Camas: </strong>
                </span>{" "}
                {row.bed}
              </div>
            ) : null}
            {(this.state.user.project.pallets && this.state.user.project.pallets !== '') ? (
              <div className="medium text-muted">
                <span>
                  <strong>Pedido Tarimas: </strong>
                </span>{" "}
                {row.pallet}
              </div>
            ) : null}
          </td>
          <td key={"corrugados" + row.product.externalId + "_" + Math.random()}>
            {(this.state.user.project.beds && this.state.user.project.beds !== '') ? (
              <div className="medium text-muted">
                <span>
                  <strong>C/ Camas: </strong>
                </span>{" "}
                {row.product.bed}
              </div>
            ) : null}
            {(this.state.user.project.pallets && this.state.user.project.pallets !== '') ? (
              <div className="medium text-muted">
                <span>
                  <strong>C/ Tarimas: </strong>
                </span>{" "}
                {row.product.pallet}
              </div>
            ) : null}
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
    const ceves = this.state.user.saleCenter.map(e => e.externalId).join('_');
    const date = this.state.date.replace(/ /g, "_");

    const file_name = "adjustment_report_ceve_" + ceves + "_" + date + ".csv";
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

  handleKeyPress(e, row_id) {
    if (e.key === 'Enter') {
      this.handleChange(e, row_id)
    }
  }

  render() {
    return (
      <div className="animated fadeIn">
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
                  {this.state.user.saleCenter &&
                    <Col xs="12" sm="12" md="5">
                      <CardTitle className="mb-0">
                        Centro de Venta {this.state.user.saleCenter[0].externalId} - {" "}
                        {this.state.user.saleCenter[0].name}
                        {this.state.user.saleCenter.length > 1 ? " y " + (this.state.user.saleCenter.length - 1) + " más." : ""}
                      </CardTitle>
                      <div className="small text-muted">
                        Pedido sugerido para el {this.state.date}
                      </div>
                    </Col>
                  }
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
                              ref={(e) => { this.textInput = e; }}
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
                      {this.state.user.project &&
                        <Col
                          xs={{ size: 1, offset: 0 }}
                          sm={{ size: 1, offset: 0 }}
                          md={{ size: 1, offset: 1 }}
                          lg={{ size: 1, offset: 0 }}
                        >
                          <Button
                            disabled={!this.state.user.project.canDowloadReport}
                            color="primary"
                            className="float-right"
                            title="Descargar reporte"
                            onClick={this.downloadReport}
                          >
                            <i className="icon-cloud-download" />
                          </Button>
                        </Col>
                      }
                      {this.state.user.project &&
                        <Col
                          xs={{ size: 1, offset: 0 }}
                          sm={{ size: 1, offset: 0 }}
                          md={{ size: 1, offset: 0 }}
                          lg={{ size: 1, offset: 0 }}
                        >
                          <Button
                            disabled={!(this.state.user.project.canSendReport && this.state.user.canEdit)}
                            color="primary"
                            className="float-right"
                            title="Enviar pedido por E-mail"
                            onClick={this.sendReport}
                          >
                            <i className="fa fa-envelope" />
                          </Button>
                        </Col>
                      }
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
                        {(this.state.user && this.state.user.project && this.state.user.project.name === 'Ecuador') ?
                          (<th className="text-center">Tinas</th>) :
                          (<th className="text-center">Pedido Final</th>)
                        }
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
      </div>
    );
  }
}

export default Dashboard;
