import React, {Component} from 'react'
import {Line} from 'react-chartjs-2'

class TabHistorical extends Component {
  constructor (props) {
    super(props)
    this.state = {}
  }

  render () {
    const data = {
      labels: ['01/11/2017', '01/12/2017', '01/01/2018', '01/02/2018', '01/02/2018', '01/03/2018', '01/04/2018'],
      datasets: [
        {
          label: 'Predicción',
          fill: false,
          lineTension: 0.1,
          backgroundColor: '#01579B',
          borderColor: '#01579B',
          borderCapStyle: 'butt',
          borderDash: [],
          borderDashOffset: 0.0,
          borderJoinStyle: 'miter',
          pointBorderColor: 'rgba(75,192,192,1)',
          pointBackgroundColor: '#fff',
          pointBorderWidth: 1,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: 'rgba(75,192,192,1)',
          pointHoverBorderColor: 'rgba(220,220,220,1)',
          pointHoverBorderWidth: 2,
          pointRadius: 1,
          pointHitRadius: 10,
          data: [200000, 255888, 254888, 205888, 200000, 400000, 350000]
        },
        {
          label: 'Ajuste',
          fill: false,
          lineTension: 0.1,
          backgroundColor: '#FF9800',
          borderColor: '#FF9800',
          borderCapStyle: 'butt',
          borderDash: [],
          borderDashOffset: 0.0,
          borderJoinStyle: 'miter',
          pointBorderColor: 'rgba(75,192,192,1)',
          pointBackgroundColor: '#fff',
          pointBorderWidth: 1,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: 'rgba(75,192,192,1)',
          pointHoverBorderColor: 'rgba(220,220,220,1)',
          pointHoverBorderWidth: 2,
          pointRadius: 1,
          pointHitRadius: 10,
          data: [150480, 200000, 404888, 165888, 190000, 480000, 120000]

        },
        {
          label: 'Venta Registrada',
          fill: false,
          lineTension: 0.1,
          backgroundColor: '#8BC34A',
          borderColor: '#8BC34A',
          borderCapStyle: 'butt',
          borderDash: [],
          borderDashOffset: 0.0,
          borderJoinStyle: 'miter',
          pointBorderColor: 'rgba(75,192,192,1)',
          pointBackgroundColor: '#fff',
          pointBorderWidth: 1,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: 'rgba(75,192,192,1)',
          pointHoverBorderColor: 'rgba(220,220,220,1)',
          pointHoverBorderWidth: 2,
          pointRadius: 1,
          pointHitRadius: 10,
          data: [160480, 160000, 254888, 205888, 190000, 300000, 280000]
        }

      ]
    }
    return (<div className='card'>
      <div className='card-content'>
        <div className='columns'>
          <div className='column is-half' />
          <div className='column'>
            <div className='card'>
              <div className='card-header'>
                <h1 className='card-header-title'>Totales de Venta</h1>
              </div>
              <div className='card-content historical-container'>
                <table className='table historical'>
                  <thead>
                    <tr>
                      <th colSpan='2'>Predicción</th>
                      <th colSpan='2'>Ajuste</th>
                      <th colSpan='2'>Venta Registrada</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className='font-blue'>
                        Semana 19
                      </td>
                      <td className='font-blue'>
                        $ 2,684,262.60
                      </td>
                      <td className='font-orange'>
                        Semana 19
                      </td>
                      <td className='font-orange'>
                        $ 2,684,262.60
                      </td>
                      <td className='font-green'>
                        Semana 19
                      </td>
                      <td className='font-green'>
                        $ 2,684,262.60
                      </td>
                    </tr>
                    <tr>
                      <td className='font-blue'>
                        Semana 19
                      </td>
                      <td className='font-blue'>
                        $ 2,684,262.60
                      </td>
                      <td className='font-orange'>
                        Semana 19
                      </td>
                      <td className='font-orange'>
                        $ 2,684,262.60
                      </td>
                      <td className='font-green'>
                        Semana 19
                      </td>
                      <td className='font-green'>
                        $ 2,684,262.60
                      </td>
                    </tr>
                    <tr>
                      <td className='font-blue'>
                        Semana 19
                      </td>
                      <td className='font-blue'>
                        $ 2,684,262.60
                      </td>
                      <td className='font-orange'>
                        Semana 19
                      </td>
                      <td className='font-orange'>
                        $ 2,684,262.60
                      </td>
                      <td className='font-green'>
                        Semana 19
                      </td>
                      <td className='font-green'>
                        $ 2,684,262.60
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Line data={data} width={200} height={50} />
    </div>)
  }
}
export default TabHistorical
