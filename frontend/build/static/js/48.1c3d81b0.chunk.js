(window.webpackJsonp=window.webpackJsonp||[]).push([[48],{569:function(e,t,a){"use strict";a.r(t);var n=a(307),r=a.n(n),s=a(247),l=a(308),o=a(87),i=a(88),c=a(90),d=a(89),u=a(86),m=a(91),p=a(1),h=a.n(p),f=a(317),E=a(250),v=a(251),g=a(253),y=a(254),x=a(282),b=a(570),w=a(378),_=a(315),j=a(316),k=a(255),N=a(283),C=a(92),z=a.n(C),S=a(309),O=a.n(S),I=(a(148),a(534)),D=a.n(I),M=a(535),T=a.n(M),P=function(e){function t(e){var a;return Object(o.a)(this,t),(a=Object(c.a)(this,Object(d.a)(t).call(this,e))).loading=function(){return h.a.createElement("div",{className:"animated fadeIn pt-1 text-center"},"Loading...")},a.loadData=a.loadData.bind(Object(u.a)(a)),a.handleChange=a.handleChange.bind(Object(u.a)(a)),a.percentage=a.percentage.bind(Object(u.a)(a)),a.toggleCustom=a.toggleCustom.bind(Object(u.a)(a)),a.downloadReport=a.downloadReport.bind(Object(u.a)(a)),a.sendReport=a.sendReport.bind(Object(u.a)(a)),a.handleKeyPress=a.handleKeyPress.bind(Object(u.a)(a)),a.loadProfile=a.loadProfile.bind(Object(u.a)(a)),a.input_search=h.a.createRef(),a.textInput=null,a.state={indicadorsCollapsed:!1,canEdit:!0,user:{},indicators:{},ind_transit:0,ind_exists:0,ind_safety_stock:0,ind_adjustments:0,ind_transit_money:0,ind_exists_money:0,ind_safety_stock_money:0,ind_adjustment_money:0,rows:[],date:"",page_number:1},a}return Object(m.a)(t,e),Object(i.a)(t,[{key:"componentWillMount",value:function(){window.localStorage.getItem("jwt")||this.props.history.push("/login"),this.loadProfile(),this.loadData()}},{key:"percentage",value:function(e,t){var a=(t-e)/e*100;return!isNaN(a)&&isFinite(a)||(a=0),Math.round(a)}},{key:"toggleCustom",value:function(e){var t=this.state.indicadorsCollapsed;this.setState({indicadorsCollapsed:!t})}},{key:"sendReport",value:function(){var e=Object(l.a)(r.a.mark(function e(t){var a,n=this;return r.a.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:t.preventDefault(),this.setState({user:Object(s.a)({},this.state.user,{canEdit:!1})}),(a=T()(D.a)).fire({title:"\xbfEnviar reporte?",text:"Despu\xe9s de enviarlo ya no prodras modificar el pedido sugerido.",type:"warning",showCancelButton:!0,confirmButtonColor:"#3085d6",confirmButtonText:"Enviar",cancelButtonColor:"#d33",cancelButtonText:"Cancelar"}).then(function(){var e=Object(l.a)(r.a.mark(function e(t){var l;return r.a.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:if(!t.value){e.next=6;break}return l={headers:{Authorization:"Bearer "+window.localStorage.getItem("jwt")}},e.next=4,O.a.get("api/v2/datasetrows/send",l).then(function(e){a.fire("\xa1Enviado!","Tu reporte ha sido enviado a tu supervisor con copia a tu email.","success")}).catch(function(e){console.error(e)});case 4:e.next=7;break;case 6:n.setState({user:Object(s.a)({},n.state.user,{canEdit:!0})});case 7:case"end":return e.stop()}},e)}));return function(t){return e.apply(this,arguments)}}());case 4:case"end":return e.stop()}},e,this)}));return function(t){return e.apply(this,arguments)}}()},{key:"handleChange",value:function(){var e=Object(l.a)(r.a.mark(function e(t,a){var n,s,l,o,i,c,d,u,m,p,h,f=this;return r.a.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:if(t.preventDefault(),n={headers:{Authorization:"Bearer "+window.localStorage.getItem("jwt")}},s=0,l=0,o=0,i=0,c=!1,this.state.rows.map(function(e){if(e.id===a){if(e.adjustment==t.target.value)return c=!0,e;s=e.adjustment,e.adjustment=t.target.value,e.bed=Math.round(e.adjustment/e.product.bed),e.pallet=Math.round(e.adjustment/e.product.pallet),o=e.bed,i=e.pallet,l=e.product.price}return e}),!c){e.next=10;break}return e.abrupt("return");case 10:return d=this.state,u=d.ind_adjustments,m=d.ind_adjustment_money,s>t.target.value?(p=s-t.target.value,u-=p,m-=p*l):(h=t.target.value-s,u+=h,m+=h*l),o=o===1/0?0:o,i=i===1/0?0:i,e.next=16,O.a.patch("api/v2/datasetrows/"+a,{adjustment:t.target.value,bed:o,pallet:i},n).then(function(e){f.setState({ind_adjustment_money:m,ind_adjustments:u})}).catch(function(e){console.error(e)});case 16:case"end":return e.stop()}},e,this)}));return function(t,a){return e.apply(this,arguments)}}()},{key:"loadProfile",value:function(){var e=this,t={headers:{Authorization:"Bearer "+window.localStorage.getItem("jwt")}};O.a.get("api/v2/me",t).then(function(t){e.setState({user:t.data})}).catch(function(e){console.error(e)})}},{key:"loadData",value:function(){var e=Object(l.a)(r.a.mark(function e(t){var a,n,s,l,o=this;return r.a.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return a="",t&&(t.preventDefault(),a=z.a.findDOMNode(this.textInput).value),n={headers:{Authorization:"Bearer "+window.localStorage.getItem("jwt")}},s="api/v2/datasetrows/indicators?q="+a,e.next=6,O.a.get(s,n).then(function(e){var t=e.data,a=t.totalTransit,n=t.totalStock,r=t.totalSafetyStock,s=t.totalAdjustment,l=t.transitMoney,i=t.existsMoney,c=t.safetyStockMoney,d=t.adjustmentMoney;o.setState({ind_transit:a,ind_exists:n,ind_safety_stock:r,ind_adjustments:s,ind_transit_money:l,ind_exists_money:i,ind_safety_stock_money:c,ind_adjustment_money:d})}).catch(function(e){console.error(e)});case 6:return l="api/v2/datasetrows?q="+a,e.next=9,O.a.get(l,n).then(function(e){var t="";e.data.results.length>0&&(t=(t=new Date(e.data.results[0].date)).getUTCDate()+" de "+["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"][t.getUTCMonth()]+" del "+t.getUTCFullYear()),o.setState({rows:e.data.results,date:t})}).catch(function(e){console.error(e)});case 9:case"end":return e.stop()}},e,this)}));return function(t){return e.apply(this,arguments)}}()},{key:"getTableRows",value:function(){for(var e=this,t=[],a=function(a){var n=e.state.rows[a];t.push(h.a.createElement("tr",{key:"row_"+a},h.a.createElement("td",{key:"cell_product_name_"+n.product.externalId},h.a.createElement("div",null,n.product.name),h.a.createElement("div",{className:"small text-muted"},h.a.createElement("span",null,"ID")," | ",n.product.externalId)),h.a.createElement("td",{key:"cell_adjustment_"+n.product.externalId,className:"text-center justify-content-center align-items-center",style:{width:"120px"}},e.state.user.canEdit&&e.state.user.project.canAdjust?h.a.createElement(f.a,{className:"text-center",tabIndex:a+1,type:"number",id:"input3-group2",name:"input3-group2",defaultValue:n.adjustment,onBlur:function(t){e.handleChange(t,n.id)},onKeyPress:function(t){e.handleKeyPress(t,n.id)}}):h.a.createElement("div",null,n.adjustment)),h.a.createElement("td",{key:"cell_empty_"+n.product.externalId}),h.a.createElement("td",{key:"cell_stocks_"+n.product.externalId+"_"+Math.random()},h.a.createElement("div",{className:"medium text-muted"},h.a.createElement("span",null,h.a.createElement("strong",null,"Transito:"))," ",n.transit),h.a.createElement("div",{className:"medium text-muted"},h.a.createElement("span",null,h.a.createElement("strong",null,"Existencia:"))," ",n.inStock),h.a.createElement("div",{className:"medium text-muted"},h.a.createElement("span",null,h.a.createElement("strong",null,"Safety Stock:"))," ",n.safetyStock)),h.a.createElement("td",{key:"cell_prediction_"+n.product.externalId+"_"+Math.random()},h.a.createElement("div",{className:"medium text-muted"},h.a.createElement("span",null,h.a.createElement("strong",null,"Ajustado: ")),e.percentage(e.state.rows[a].prediction,e.state.rows[a].adjustment)," ","%"),h.a.createElement("div",{className:"medium text-muted"},h.a.createElement("span",null,h.a.createElement("strong",null,"Sugerido: "))," ",n.prediction),h.a.createElement("div",{className:"medium text-muted"},h.a.createElement("span",null,h.a.createElement("strong",null,"Pedido Camas: "))," ",n.bed),h.a.createElement("div",{className:"medium text-muted"},h.a.createElement("span",null,h.a.createElement("strong",null,"Pedido Tarimas: "))," ",n.pallet)),h.a.createElement("td",{key:"corrugados"+n.product.externalId+"_"+Math.random()},h.a.createElement("div",{className:"medium text-muted"},h.a.createElement("span",null,h.a.createElement("strong",null,"C/ Camas: "))," ",n.product.bed),h.a.createElement("div",{className:"medium text-muted"},h.a.createElement("span",null,h.a.createElement("strong",null,"C/ Tarimas: "))," ",n.product.pallet))))},n=0;n<this.state.rows.length;n++)a(n);return t}},{key:"getIconCollapse",value:function(){return this.state.indicadorsCollapsed?"fa fa-angle-up":"fa fa-angle-down"}},{key:"downloadReport",value:function(){var e=Object(l.a)(r.a.mark(function e(t){var a,n;return r.a.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return t&&t.preventDefault(),a={headers:{Authorization:"Bearer "+window.localStorage.getItem("jwt")}},n="adjustment_report_ceve_"+this.state.user_sale_center+"_"+this.state.date.replace(/ /g,"_")+".csv","api/v2/datasetrows/download","blob",e.next=7,O.a.get("api/v2/datasetrows/download",a,"blob").then(function(e){var t=window.URL.createObjectURL(new Blob([e.data])),a=document.createElement("a");a.href=t,a.setAttribute("download",n),document.body.appendChild(a),a.click()}).catch(function(e){console.error(e)});case 7:case"end":return e.stop()}},e,this)}));return function(t){return e.apply(this,arguments)}}()},{key:"handleKeyPress",value:function(e,t){"Enter"===e.key&&this.handleChange(e,t)}},{key:"render",value:function(){var e=this;return h.a.createElement("div",{className:"animated fadeIn"},h.a.createElement(E.a,null,h.a.createElement(v.a,null,h.a.createElement(g.a,null,h.a.createElement(y.a,null,h.a.createElement("div",{className:"chart-wrapper",style:{marginTop:"20px"}},h.a.createElement(x.a,{isOpen:!0},h.a.createElement(E.a,{className:"row"},h.a.createElement(v.a,{xs:{size:12,offset:0},sm:{size:6,offset:0},md:{size:3},lg:{size:3}},h.a.createElement(g.a,{className:"text-white bg-primary"},h.a.createElement(y.a,null,h.a.createElement("div",{className:"text-value"},this.state.ind_transit+" - $"+Math.round(this.state.ind_transit_money)),h.a.createElement("div",null,"Tr\xe1nsito")))),h.a.createElement(v.a,{xs:{size:12,offset:0},sm:{size:6,offset:0},md:{size:3},lg:{size:3}},h.a.createElement(g.a,{className:"text-white bg-primary"},h.a.createElement(y.a,null,h.a.createElement("div",{className:"text-value"},this.state.ind_exists+" - $"+Math.round(this.state.ind_exists_money)),h.a.createElement("div",null,"Existencia")))),h.a.createElement(v.a,{xs:{size:12,offset:0},sm:{size:6,offset:0},md:{size:3},lg:{size:3}},h.a.createElement(g.a,{className:"text-white bg-primary"},h.a.createElement(y.a,null,h.a.createElement("div",{className:"text-value"},this.state.ind_safety_stock+" - $"+Math.round(this.state.ind_safety_stock_money)),h.a.createElement("div",null,"Safety Stock")))),h.a.createElement(v.a,{xs:{size:12,offset:0},sm:{size:6,offset:0},md:{size:3},lg:{size:3}},h.a.createElement(g.a,{className:"text-white bg-primary"},h.a.createElement(y.a,null,h.a.createElement("div",{className:"text-value"},this.state.ind_adjustments+" - $"+Math.round(this.state.ind_adjustment_money)),h.a.createElement("div",null,"Pedido Final"))))))))))),h.a.createElement(E.a,null,h.a.createElement(v.a,null,h.a.createElement(g.a,null,h.a.createElement(y.a,null,h.a.createElement(E.a,null,this.state.user.saleCenter&&h.a.createElement(v.a,{xs:"12",sm:"12",md:"5"},h.a.createElement(b.a,{className:"mb-0"},"Centro de Venta ",this.state.user.saleCenter[0].externalId," - "," ",this.state.user.saleCenter[0].name,this.state.user.saleCenter.length>1?" y "+(this.state.user.saleCenter.length-1)+" m\xe1s.":""),h.a.createElement("div",{className:"small text-muted"},"Pedido sugerido para el ",this.state.date)),h.a.createElement(v.a,{xs:"12",sm:"12",md:"7",className:"d-none d-sm-inline-block"},h.a.createElement(E.a,{className:"justify-content-end"},h.a.createElement(v.a,{xs:"10",sm:"10",md:"9",lg:"10"},h.a.createElement(w.a,{onSubmit:this.loadData,autoComplete:"off"},h.a.createElement(_.a,null,h.a.createElement(f.a,{type:"text",id:"input3-group2",name:"input3-group2",placeholder:"Search",ref:function(t){e.textInput=t}}),h.a.createElement(j.a,{addonType:"append"},h.a.createElement(k.a,{type:"button",color:"primary",onClick:this.loadData,title:"Buscar productos por nombre o ID"},h.a.createElement("i",{className:"fa fa-search"})))))),this.state.user.project&&h.a.createElement(v.a,{xs:{size:1,offset:0},sm:{size:1,offset:0},md:{size:1,offset:1},lg:{size:1,offset:0}},h.a.createElement(k.a,{disabled:!this.state.user.project.canDowloadReport,color:"primary",className:"float-right",title:"Descargar reporte",onClick:this.downloadReport},h.a.createElement("i",{className:"icon-cloud-download"}))),this.state.user.project&&h.a.createElement(v.a,{xs:{size:1,offset:0},sm:{size:1,offset:0},md:{size:1,offset:0},lg:{size:1,offset:0}},h.a.createElement(k.a,{disabled:!(this.state.user.project.canSendReport&&this.state.user.canEdit),color:"primary",className:"float-right",title:"Enviar pedido por E-mail",onClick:this.sendReport},h.a.createElement("i",{className:"fa fa-envelope"})))))),h.a.createElement("div",{className:"chart-wrapper",style:{marginTop:"40px"}},h.a.createElement(N.a,{hover:!0,responsive:!0,className:"table-outline mb-0 d-sm-table"},h.a.createElement("thead",{className:"thead-light"},h.a.createElement("tr",null,h.a.createElement("th",{className:"text-center"},"Producto"),h.a.createElement("th",{className:"text-center"},"Pedido Final"),h.a.createElement("th",{className:"text-center"}),h.a.createElement("th",{className:"text-center"}),h.a.createElement("th",{className:"text-center"}),h.a.createElement("th",{className:"text-center"}))),h.a.createElement("tbody",null,this.getTableRows()))))))))}}]),t}(p.Component);t.default=P}}]);
//# sourceMappingURL=48.1c3d81b0.chunk.js.map