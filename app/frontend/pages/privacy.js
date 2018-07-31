import React, { Component } from 'react'
import Page from '~base/page'
import Link from '~base/router/link'
import { forcePublic } from '~base/middlewares/'
import LogInButton from './landing/log-in-form'
import Footer from './landing/footer'
import RegisterModal from './landing/register/registerModal'

class PrivacyPage extends Component {
  constructor (props) {
    super(props)
    this.state = {
      isDown: false,
      navshadow: '',
      actualComment: 0,
      fade: 'fadeIn',
      menu: ''
    }
    this.handleScroll = this.handleScroll.bind(this)
  }

  componentDidMount () {
    window.addEventListener('scroll', this.handleScroll, false)
  }

  componentWillUnmount () {
    window.removeEventListener('scroll', this.handleScroll, false)
  }

  handleScroll (e) {
    let supportPageOffset = window.pageXOffset !== undefined
    let isCSS1Compat = ((document.compatMode || '') === 'CSS1Compat')
    let scroll = {
      x: supportPageOffset ? window.pageXOffset : isCSS1Compat ? document.documentElement.scrollLeft : document.body.scrollLeft,
      y: supportPageOffset ? window.pageYOffset : isCSS1Compat ? document.documentElement.scrollTop : document.body.scrollTop
    }

    if (scroll.y === 0 && this.state.navshadow) {
      this.setState({
        navshadow: ''
      })
    } else if (scroll.y > 0 && !this.state.navshadow) {
      this.setState({
        navshadow: ' has-shadow'
      })
    }

    if (scroll.y > 350 && !this.state.isDown) {
      this.setState({
        isDown: true
      })
    } else if (scroll.y < 350 && this.state.isDown) {
      this.setState({
        isDown: false
      })
    }
  }

  toggleMenu () {
    this.setState({
      menu: this.state.menu === '' ? ' is-active' : ''
    })
  }

  render () {
    return (
      <div className='landing'>
        <nav className={'navbar is-primary is-fixed-top changeBack' + this.state.navshadow}>
          <div className='container'>
            <div className='navbar-brand'>
              <Link to='/landing' className='navbar-item'>
                <img src='/app/public/img/logow.png' width='112px' />
              </Link>
              <a role='button' className={'navbar-burger' + this.state.menu}
                aria-label='menu'
                aria-expanded='false'
                onClick={() => { this.toggleMenu() }} >
                <span aria-hidden='true' />
                <span aria-hidden='true' />
                <span aria-hidden='true' />
              </a>
            </div>
            <div className={'navbar-menu' + this.state.menu}>
              <div className='navbar-start'>
                <a className='navbar-item' onClick={() => { this.props.history.push('/how') }} >
                  ¿Cómo funciona?
                </a>
              </div>
              <div className='navbar-end'>

                {this.state.isDown
                  ? <div className='navbar-item'>
                    <RegisterModal />
                  </div>

                  : <div className='navbar-item'>
                    <LogInButton />
                  </div>
                }

                {!this.state.isDown &&
                  <div className='navbar-item'>
                    <a className='button is-primary is-inverted is-outlined'>
                      ES
                    </a>
                  </div>

                }

              </div>
            </div>
          </div>
        </nav>

        <section className='hero is-medium is-bg-whitesmoke'>
          <div className='hero-body'>
            <div className='container privacy'>
              <div className='columns'>
                <div className='column has-text-justified'>
                  <h1 className='title is-size-5 has-text-centered'>
                    AVISO DE PRIVACIDAD PARA LA PROTECCIÓN DE DATOS PERSONALES
                  </h1>

                  <p>
                  ORAX es una marca registrada propiedad de Grupo Abraxas., que ofrece Servicios de,
                  Desarrollo de Software, Análisis y Almacenamiento de Datos, entre otros, con
                  domicilio ubicado en Donato Guerra no. 9 Col. Tizapan, San Ángel, Delegación Álvaro
                  Obregón, México D.F. C.P. 01090.
                  </p>
                  <p>
                  En términos de lo previsto en la Ley Federal de Protección de Datos Personales en
                  Posesión de los Particulares, Mindsight Solutions S.A.P.I. de C.V. (en lo sucesivo
                  denominado ORAX) establece el presente Aviso de Privacidad.
                  </p>
                  <br />
                  <h1 className='title is-size-5 has-text-centered'>ALCANCE DE ESTE AVISO</h1>
                  <p>El objetivo de este Aviso de Privacidad es el de informarle acerca de las prácticas de
                  privacidad en el uso de sus datos personales y/o sensibles que hayan sido transferidos
                  a ORAX, cuando Usted nos los haya proporcionado directamente, cuando visita nuestro
                  sitio de internet con dominio <a href='www.orax.io'> www.orax.io</a> o utiliza nuestros servicios en línea, y
                  cuando obtenemos información a través de otras fuentes que están permitidas por la
                  ley.
                  </p>

                  <p>El presente aviso de privacidad aplica para la ejecución de todos aquellos servicios que
                  ofrece esta entidad, por lo tanto, la información que sea tratada será única y
                  exclusivamente para los servicios especificados con el compromiso que dicha
                  información estará resguardada para garantizar su confidencialidad.
                  </p>
                  <p>Puede contactarnos vía telefónica, por correo electrónico, o personalmente en nuestra
                  oficina de base de datos; esto lo puede atender en días y horas hábiles en el domicilio
                  arriba especificado, al correo electrónico <a href='mailto:info@grupoabraxas.com' target='_top'>info@grupoabraxas.com</a>  , así como al teléfono
                  +52(55) 3869-0120
                  </p>

                  <div>
                    <p>En atención a lo dispuesto por la Ley Federal de Protección de Datos Personales en
                    Posesión de los Particulares, en el presente aviso se entenderá por:
                    </p>
                    <ul>
                      <li>
                        Dato Personal. se refiere a cualquier información concerniente a cualquier
persona física o moral, el responsable de recabar los datos es el Área de Servicio
al Cliente y los Administradores de Proyecto
                      </li>
                      <li>
                        Datos Personales sensibles: Aquellos datos personales que afecten a la esfera
más íntima de su titular, o cuya utilización indebida pueda dar origen a
discriminación o conlleve un riesgo grave para éste. En particular, se consideran
sensibles aquellos que puedan revelar aspectos como origen racial, étnico,
estado de salud presente y futura, información genética, creencias religiosas,
filosóficas y morales, afiliación sindical, opiniones políticas, preferencia sexual.
                      </li>

                      <li>
                        Derechos ARCO: Derechos de acceso, rectificación, cancelación y oposición
previstos en la Ley Federal de Protección de Datos Personales en Posesión de
los Particulares.
                      </li>

                      <li>
                        Ley: Ley Federal de Protección de Datos Personales en Posesión de los
Particulares.
                      </li>

                      <li>
                        Responsable: MINDSIGHT SOLUTIONS, S.A.P.I. de C.V., que lleva a cabo el
tratamiento de sus datos personales.
                      </li>

                      <li>
                        Titular: La persona física o moral a quien corresponden los datos personales.
                      </li>

                      <li>
                        Cookies: Las cookies son pequeñas partes de información almacenada por su
navegador en el disco duro de su computadora, a solicitud del sitio web. Las
cookies de nuestros sitios de internet mencionados con anterioridad no
contienen ninguna información personal, pero son utilizadas principalmente
para rastrear información temporal; por ejemplo, las cookies nos permiten
rastrear los contenidos que usted carga y descarga. Las cookies nos permiten recordarlo cuando se da de alta en lugares de nuestro sitio que requieren o no
de membrecía y/o registro, y lo que usted vio en nuestro correo electrónico,
administrar y presentar información del sitio y las fotografías desplegadas en
su computadora y entregarle información específica a sus intereses. Hacemos
de su conocimiento que utilizamos la cookie de origen Google Analytics MR en
la publicidad que aparece en nuestro sitio web.
                      </li>

                      <li>
                        Web Beacons: También colocamos pequeños “gifs rastreadores” o “beacons” en
muchas de las páginas de nuestro sitio web, en publicidad online con terceros y
en nuestro correo electrónico. Utilizamos estos beacons, en conexión con
nuestras cookies, para recolectar datos no personales sobre el uso de nuestro
sitio incluyendo, pero no limitado, a la fecha y hora de la visita, las páginas
visitadas, el sitio web referente, el tipo de navegador (por ejemplo, Internet
Explorer, Firefox, etc.), el tipo de sistema operativo (por ejemplo, Windows,
Linux o Mac), y el nombre de dominio del proveedor de Internet del visitante.
Esta información es recolectada sobre miles de visitas de sitios y analizada en
conjunto. Esta información es útil por ejemplo, para rastrear el desempeño de
nuestra publicidad en línea.
                      </li>

                    </ul>
                  </div>

                  <br />

                  <h1 className='title is-size-5 has-text-centered'>DATOS PERSONALES QUE PUEDEN RECABARSE </h1>
                  <p>Al contratar cualquiera de los servicios que presta ORAX, Usted acepta que se
recabarán:
                  </p>
                  <p>
                    De manera enunciativa más no limitativa datos sobre los usuarios tales como: el
  nombre completo de la persona, empresa o entidad interesada en los servicios,
  domicilio, así como teléfonos, celulares o móviles, correos electrónicos, giro principal
  de actividades, objeto social de la empresa o entidad, etc. En el caso de solicitar
  facturación electrónica, además se podrá solicitar RFC, CURP, domicilio fiscal y demás
  datos necesarios.
                  </p>

                  <p>
Datos complementarios del usuario o interesado: para el proceso de identificar sus
necesidades y poder ofrecer diversos servicios, además de los datos anteriores se
podrá también pedir información que permita evaluar las distintas necesidades de los usuarios o interesados, como la situación familiar, así como su escolaridad, ocupación,
etc.
                  </p>

                  <br />
                  <h1 className='title is-size-5 has-text-centered'>
                    FINALIDADES DEL TRATAMIENTO DE SUS DATOS PERSONALES
                  </h1>

                  <p>
                    Los datos personales mencionados en el apartado anterior serán utilizados como
parte del historial de los titulares, usuarios y/o interesados como información de
contacto para localizarlos en caso de requerir servicios adicionales.
                  </p>

                  <p>
                    Los datos personales también serán utilizados para el cumplimiento de un control
administrativo, cumplimiento de obligaciones contraídas por o con el titular, evaluar
calidad en el servicio, realizar estudios internos estadísticos sobre los diferentes
servicios contratados y actividades, cumplir con requerimientos de las autoridades
gubernamentales, para elaborar los recibos y/o facturas de pago que amparan los
servicios que proporciona ORAX, notificar cualquier cambio en cuanto a la forma de
pago o prestación de los servicios.
                  </p>

                  <p>
                    En general cualquier entidad que implique directa o indirectamente la prestación de
los servicios proporcionados por ORAX, así como la evaluación de la prestación de los
mismos
                  </p>

                  <p>
                    Todos aquellos datos personales que el titular ingrese o proporcione voluntariamente
al responsable, por cualquier medio, se sujetarán a las políticas de seguridad y
privacidad interna.
                  </p>

                  <p>
                    En lo referente a la información que se obtiene mediante la página web de ORAX o el
acceso ya sea mediante las computadoras, laptops, dispositivos móviles entre otros;
informamos que utilizamos tecnologías comunes de Internet, tales como cookies y
beacons para garantizar la integridad de nuestro sitio web y para personalizar partes
del sitio para Usted, los cuales son generados automáticamente cuando se establece
una conexión al sitio.
                  </p>

                  <p>
                   Si Usted no está cómodo con la recolección de dicha información a través del uso de
 las cookies y beacons, le recomendamos que inhabilite estas funciones por medio de
 las preferencias de su explorador, pero por favor tome en cuenta que esto limitará el desempeño y la funcionalidad de nuestros sitios de internet anteriormente
mencionados, la documentación de su explorador deberá de proporcionar los
procedimientos específicos para inhabilitar la ayuda de las cookies y beacons.
                  </p>

                  <br />

                  <h1 className='title is-size-5 has-text-centered'>
                    TRANSFERENCIA DE DATOS PERSONALES
                  </h1>

                  <p>
  ORAX no divulga ni comparte la información de la que se hace depositario y la
                  información personal identificable no será rentada o vendida a ningún tercero.
</p>

                  <p>
  En cumplimiento con la Ley, se podrá revelar información personal a terceras personas
                  sin su consentimiento en los siguientes casos: para cumplir con alguna ley, regulación
                  u orden judicial, para colaborar con las investigaciones del gobierno, para prevenir
                  fraudes o el cumplimiento del pago de contribuciones, o bien, para hacer cumplir o
                  proteger los derechos de la responsable obligada.
</p>

                  <p>
  En caso de que se llegaran a transferir datos personales a terceras personas con el fin
                  de llevar a cabo los servicios por parte de ORAX o cualquiera de sus filiales, se hará
                  previa celebración de convenios de confidencialidad, siempre y cuando el proveedor o
                  persona a quien se le transmitan acepte someter el tratamiento de los datos
                  personales al presente aviso de privacidad y, no se trate de alguno de los supuestos
                  establecidos en el artículo 37 de la Ley. Si Usted no manifiesta su oposición para que
                  sus datos personales sean transferidos a terceros, se entenderá que ha otorgado su
                  consentimiento para ello.
</p>

                  <br />

                  <h1 className='title is-size-5 has-text-centered'>
                    DERECHOS DE LOS TITULARES DE DATOS PERSONALES
                  </h1>

                  <p>
  Cualquier titular o, en su caso, su representante legal podrá(n) ejercer los derechos de
                  acceso, rectificación, cancelación y oposición, y nosotros proveeremos los medios que
                  le(s) permita(n) un oportuno ejercicio de sus derechos.
</p>

                  <p>
  El ejercicio de los derechos de acceso, rectificación, cancelación, oposición, limitación
                  de uso o la revocación del consentimiento, podrá solicitarse por escrito en nuestras
                  oficinas ubicadas en Donato Guerra no. 9 Col. Tizapan, San Ángel Delegación Álvaro
</p>

                  <p>
  Obregón, México D.F. C.P. 01090. La revocación del consentimiento puede efectuarse
                  en cualquier momento, sin efectos retroactivos.
</p>
                  <p>
  Para iniciar el proceso de revocación, deberá indicar de forma precisa el
                  consentimiento que desea revocar por escrito o al correo electrónico
                  info@grupoabraxas.com la solicitud, por escrito y/o electrónica, de acceso,
                  rectificación, cancelación u oposición, deberá contener y acompañar lo siguiente:
</p>

                  <div>
                    <ol>
                      <li>
      Nombre completo y domicilio u otro medio para comunicarle la respuesta a su
                  solicitud
    </li>

                      <li>
      Los documentos que acrediten la identidad o, en su caso, la representación legal
                  de quien promueve en representación de otra persona.
    </li>

                      <li>
La descripción clara y precisa de los datos personales respecto de los que se
busca ejercer alguno de los derechos antes mencionados, y
    </li>

                      <li>
      Cualquier otro elemento o documento que facilite la localización de los datos
                  personales.
    </li>
                    </ol>
                  </div>

                  <p>
                    Para el caso de las solicitudes de rectificación el titular deberá indicar las
modificaciones a realizarse y aportar la documentación que sustente su petición.
                  </p>

                  <p>
                    En un plazo de veinte días (20), hábiles contados desde la fecha en que se recibió la
solicitud de acceso, rectificación, cancelación u oposición, se notificará la
determinación adoptada a efecto de que, si resulta procedente, se haga efectiva la
misma dentro de los quince días (15) siguientes a la fecha en que se comunica la
respuesta. Tratándose de solicitudes de acceso a datos personales, procederá la
entrega, previa acreditación de la identidad del solicitante o representante legal,
según corresponda. Los plazos, antes referidos podrán ser ampliados una sola vez por
un periodo igual; siempre y cuando, así lo justifiquen las circunstancias del caso.
                  </p>

                  <p>
                    La obligación de acceso a la información se dará por cumplida cuando se pongan a
disposición del titular los datos personales; o bien, mediante la expedición de copias
simples, documentos electrónicos o cualquier otro medio que proveamos al
interesado.
                  </p>

                  <p>
                    En el caso de que el titular solicite el acceso a los datos a una persona que presume es
el responsable y ésta resulta no serlo, bastará con que así se le indique al titular por
cualquiera de los medios impresos (carta de no procedencia) o electrónicos (correo
electrónico, medios ópticos, etc.) para tener por cumplida la solicitud.
                  </p>

                  <div>
                    <p>
                    Se podrá negar el acceso a los datos personales, la rectificación, cancelación o
concesión de la oposición al tratamiento de los mismos, en cualquiera de los siguientes
supuestos:
                  </p>

                    <ul>
                      <li>
                      Cuando el solicitante no sea el titular de los datos personales, o el
  representante legal no esté debidamente acreditado para ello.
                    </li>
                      <li>
                      Cuando en su base de datos no se encuentren los datos personales del
  solicitante.
                    </li>

                      <li>
                      Cuando se lesionen los derechos de un tercero.
                    </li>

                      <li>
                      Cuando exista un impedimento legal, o la resolución de una autoridad
  competente que restrinja el acceso a los datos personales o que no permita la
  rectificación, cancelación u oposición de los mismos.
                    </li>

                      <li>
                      Cuando la rectificación, cancelación u oposición haya sido previamente
  realizada.
                    </li>
                    </ul>
                  </div>

                  <div>
                    <p>Se limitará el uso de los datos personales y datos personales sensibles a petición
expresa del titular, y no estará obligada a cancelar los datos personales cuando:
</p>
                    <ul>
                      <li>
Se trate de las partes de un contrato privado, social o administrativo, y sean
necesarios para su desarrollo y cumplimiento.
</li>
                      <li>
                        Deban ser tratados por disposición legal.</li>
                      <li>
Obstaculice actuaciones judiciales o administrativas vinculadas a obligaciones
                        fiscales, la investigación y persecución de delitos, o la actualización de
sanciones administrativas.</li>

                      <li>Sean necesarios para proteger los intereses jurídicamente tutelados del titular.</li>
                      <li>Sean necesarios para realizar una acción en función del interés público.</li>
                      <li>Sean necesarios para cumplir con una obligación legalmente adquirida por el titular, </li>
                      <li>
 Sean objeto de tratamiento para la prevención o el diagnóstico médico o la
                      gestión de servicios de salud, siempre que dicho tratamiento se realice por un
                      profesional de la salud sujeto a un deber de secreto.
</li>
                    </ul>
                  </div>

                  <br />

                  <h1 className='title is-size-5 has-text-centered'>
                    TÉRMINOS Y CONDICIONES
                  </h1>

                  <p>
                    La temporalidad del manejo de tus Datos Personales será indefinida, a partir de la
fecha que nos sean proporcionados, pudiendo oponerse al manejo en cualquier
momento en que se considere oportuno, con las limitaciones de La Ley; en caso de que
su solicitud sea procedente, ORAX dejará de manejar sus Datos Personales sin ninguna
responsabilidad de nuestra parte.
                  </p>

                  <p>
                    El área de ORAX, responsable del tratamiento de sus Datos Personales, está obligada
a cumplir con los principios de licitud, consentimiento, información, calidad, finalidad,
lealtad, proporcionalidad y responsabilidad titulados en La Ley; por tal motivo, con
fundamento en los artículos 13 y 14 de La Ley, el área de Jurídico se compromete a
guardar estricta confidencialidad de sus datos personales, así como a mantener las
medidas de seguridad administrativas, técnicas y físicas que permitan protegerlos
contra cualquier daño, pérdida, alteración, acceso o tratamiento no autorizado.
                  </p>

                  <p>
                    ORAX ocasionalmente corregirá y modificará este Aviso de Privacidad, por lo tanto, le
pedimos que revise regularmente este aviso en la página de internet: <a href='www.orax.io'> www.orax.io</a>
                  </p>

                  <br />

                  <h1 className='title is-size-5 has-text-centered'>
                    MODIFICACIONES A ESTE AVISO DE PRIVACIDAD
                  </h1>

                  <p>
    Nos reservamos el derecho de modificar periódicamente este Aviso de Privacidad. Si
                el titular proporciona sus datos personales significa que ha leído, entendido y
                aceptado los términos antes expuestos.
  </p>
                  <p>
    Este Aviso de Privacidad fue modificado por última vez el 1 de julio de 2018.
  </p>

                </div>
              </div>

            </div>
          </div>
        </section>

        <Footer />
      </div>
    )
  }
}

export default Page({
  path: '/privacy',
  exact: true,
  validate: forcePublic,
  component: PrivacyPage
})
