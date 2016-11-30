import Vue from 'vue';
import VueInstantTable from '../';

import moment from 'moment';
import _ from 'lodash';
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

/* eslint-disable no-new */
const app = new Vue({
  el: '#app',
  mounted: function () {
    console.log('Mounted!');
  },
  components: {
    'vue-instant-table': VueInstantTable
  },
  data: function () {
    return {
      table: {
        data: [
          { name: 'Alice', birthdate: new Date(), wealth: '100000.00' },
          { name: 'Bob', birthdate: new Date(), wealth: '250000.10' }
        ],
        columns: {
          name: {
            label: 'Name'
          },
          birthdate: {
            label: 'Birthdate',
            filter: 'date'
          },
          wealth: {
            label: 'Wealth',
            filter: 'currency'
          }
        },
        filter: '',
        options: {
          pagination: {
            itemsPerPageList: [10, 30, 50]
          }
        },
        rowActions: {
          update: {
            label: 'Edit',
            icon: 'fa fa-pencil',
            class: 'btn btn-xs btn-primary btn-circle'
          },
          delete: {
            label: 'Remove',
            icon: 'fa fa-trash',
            class: 'btn btn-xs btn-danger btn-circle'
          }
        }
      }
    }
  },
  methods: {
    openUpdateModal: function (rowData, index) {
      console.log('openUpdateModal');
    },
    openDeleteModal: function (rowData, index) {
      console.log('openDeleteModal');
    }
  }
});
