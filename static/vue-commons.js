window.Vue = require('vue');
window.moment = require('moment');
window._ = require('lodash');
/**********************************************************************
 ** Useful Vue filter
 ***********************************************************************/
//import Vue from 'vue'
Vue.filter('json', function (value) {
  return JSON.stringify(value);
});
Vue.filter('date', function (value) {
  if (value === null)
    return '-';
  return moment(value).format('DD MMMM YYYY HH:mm:ss');
});
Number.prototype.formatMoney = function (c, d, t) {
  var n = this,
    c = isNaN(c = Math.abs(c)) ? 2 : c,
    d = d == undefined ? "." : d,
    t = t == undefined ? "," : t,
    s = n < 0 ? "-" : "",
    i = String(parseInt(n = Math.abs(Number(n) || 0).toFixed(c))),
    j = (j = i.length) > 3 ? j % 3 : 0;
  return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
};
Vue.filter('currency', function (value) {
  var val = 'Rp. ' + parseFloat(value).formatMoney(2, ',', '.')
  return val
});
Vue.filter('blank', function (value) {
  if (!value || value == '') {
    return ' - ';
  }
  else {
    return value;
  }
});
