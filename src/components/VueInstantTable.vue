<template>
  <div>
    <table class="table table-hover table-responsive"
           :class="tableClass">
      <thead>
      <tr>
        <th v-for="(column, key) in columns" @click="sortBy(key)" class="sortable"
            :class="{ active: sortKey == column.key}">
          {{ column.label|capitalize }}
          <span class="fa" :class="sortOrders[key] > 0 ? 'fa-sort-up' : 'fa-sort-down'">
            </span>
        </th>
        <th v-if="isRowActionsValid()"></th>
        <!-- space for item actions -->
      </tr>
      </thead>
      <tbody>
      <tr v-for="(row, index) in filteredData">
        <td v-for="(column, key) in columns">
          <span v-if="!isColumnClickable(column)" v-html="customRawValue(row, key, index, column)"></span>
          <a v-if="isColumnClickable(column)"
             :href="clickableColumnHref(column)"
             :target="clickableColumnTarget(column)"
             :class="clickableColumnClass(row, key, index, column)"
             @click.prevent="clickableColumnHandler(row, key, index, column)">
            {{ customRawValue(row, key, index, column) }}
          </a>
          <!-- v-html="customColumn(row[column.key], column.filter)"> -->
        </td>
        <td v-if="isRowActionsValid()">
                    <span v-for="(action, name) in rowActions"
                          v-if="actionIsShown(action, row)">
                        <span> </span>
                        <button type="button" :class="action.class"
                                @click="doActions(name, row, index)">
                            <span :class="action.icon"></span> {{ action.label }}
                        </button>
                    </span>
        </td>
      </tr>
      </tbody>
    </table>
    <div class="row" :class="paginationClass">
      <div class="col-xs-3 text-left">
        <div class="btn-group">
          <button type="button" v-for="count in tableOptions.pagination.itemsPerPageList" class="btn btn-default"
                  :class="{ active: itemsPerPage == count }" @click.prevent="setItemsPerPage(count)">
            {{ count }}
          </button>
        </div>
      </div>
      <!-- item per page count -->
      <div class="col-xs-6 text-center">
        <ul class="pagination btn-group" style="margin: 0">
          <button type="button" class="btn btn-default"
                  @click.prevent="previousPagesRange()">
            &laquo;
          </button>
          <button v-for="pageNumber in visiblePagesRange" type="button" class="btn btn-default"
                  :class="{ active: pageNumber == activePageNumber }" @click.prevent="gotoPage(pageNumber)">
            <span>{{ pageNumber }}</span>
            <span class="sr-only" ng-if="classNumPage(numPage)">(current)</span>
          </button>
          <!-- <li ng-class="classPageMaxRange"> -->
          <button type="button" class="btn btn-default"
                  @click.prevent="remainingPagesRange()">
            &raquo;
          </button>
        </ul>
      </div>
      <!-- page -->
      <div class="col-xs-3 text-right">
        <p>Page <span>{{ activePageNumber }}</span> of <span>{{ totalPages }}</span>, of <span>{{ value.length }}</span>
          entries</p>
      </div>
    </div>
    <!-- row -- pagination -->
  </div>
  <!-- empty div -->
</template>
<script style="text/babel">
  import {cloneDeep, get, isFunction} from 'lodash'
  import Vue from 'vue';
  import moment from 'moment';
  /**********************************************************************
   ** Useful Vue filter
   ***********************************************************************/
  Vue.filter('json', function (value) {
    return JSON.stringify(value);
  });
  Vue.filter('date', function (value, format) {
    if (value === null)
      return '-';
    if (format) {
      return moment(value).format(format);
    }
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

  export default {
//    mounted: function () {
//             console.log('IniTable ready.', this.value.length, this.value);
//    },
    props: {
      columns: Object,
      value: Array,
      filter: String,
      options: Object,
      rowActions: Object,
      tableClass: String,
      paginationClass: String
    },
    data: function () {
      if (!this.value) {
        console.warn('Undefined value of table v-model!');
      }

      var sortOrders = {};
      Object.keys(this.columns).forEach(function (key) {
        sortOrders[key] = 1
      });
//            this.columns.forEach(function (column) {
//                sortOrders[column.key] = 1
//            });
      var itemsPerPage = 10;

      var options = {};
      if (!Object.is(this.options, undefined)) {
        options = this.options;
        if (Object.is(this.options.pagination, undefined)) {
          options.pagination = {
            itemsPerPageList: [10, 30, 50]
          };
        }
      }
      else {
        options.pagination = {
          itemsPerPageList: [10, 30, 50]
        };
      }
      itemsPerPage = options.pagination.itemsPerPageList[0];

//            if (!Object.is(this.tablePagination, undefined) && !Object.is(this.tablePagination.itemsPerPageList, undefined)) {
//                itemsPerPage = this.tablePagination.itemsPerPageList[0]
//            }
      var activePageNumber = 1;
      return {
        sortKey: '',
        sortOrders: sortOrders,
        itemsPerPage: itemsPerPage,
        activePageNumber: activePageNumber,
        pivotPageNumber: activePageNumber,
        tableOptions: options
      }
    },
    computed: {
      filteredData: function () {
        var filter = this.filter && this.filter.toLowerCase();
        // console.log('filter', filter);
        var sortKey = this.sortKey;
        var order = this.sortOrders[sortKey];
        var data = this.value;

        if (filter) {
          data = data.filter(function (row) {
            return Object.keys(row).some(function (key) {
              return String(row[key]).toLowerCase().indexOf(filter) > -1
            })
          })
        }

        if (sortKey) {
          data = data.slice().sort(function (a, b) {
            a = a[sortKey];
            b = b[sortKey];
            return (a === b ? 0 : a > b ? 1 : -1) * order
          })
        }

        var begin = this.activePageNumber * this.itemsPerPage - this.itemsPerPage
        var end = begin + this.itemsPerPage;
        data = data.slice(begin, end);
        return data
      },
      totalPages: function () {
        return parseInt(this.value.length / this.itemsPerPage) + (this.value.length % this.itemsPerPage !== 0 ? 1 : 0)
      },
      visiblePagesRange: function () {
        var range = [];
        // var activePageNumber = this.activePageNumber;
        var activePageNumber = this.pivotPageNumber;
        var pageNum = activePageNumber - 4;
        if (pageNum <= 0) {
          pageNum = 1;
        }

        var count = 0;
        var totalPages = this.totalPages;
        while (count < 5 && pageNum <= totalPages) {
          range.push(pageNum);
          pageNum++;
          count++
        }
        return range
      }
    },
    methods: {
      sortBy: function (column) {
        this.sortKey = column;
        this.sortOrders[column] = this.sortOrders[column] * -1;
      },
      gotoPage: function (page) {
        this.activePageNumber = page;
        // this.pivotPageNumber = this.activePageNumber
      },
      computeVisiblePagesRange: function (activePage) {
        var range = [];
        var pageNum = activePage - 2;
        if (pageNum <= 0) {
          pageNum = 1
        }
//                console.info(activePage, pageNum)
        var count = 0;
        var totalPages = this.totalPages;
        while (count < 5 && pageNum <= totalPages) {
          range.push(pageNum);
          pageNum++;
          count++
        }
//                console.log(range)
        return range
      },
      previousPagesRange: function () {
        if (this.visiblePagesRange[0] <= 1) {
          return
        }
        this.pivotPageNumber--
      },
      remainingPagesRange: function () {
        if (this.visiblePagesRange[this.visiblePagesRange.length - 1] >= this.totalPages) {
          return
        }
        this.pivotPageNumber++
      },
      setItemsPerPage: function (count) {
        var indexToPreserve = this.activePageNumber * this.itemsPerPage - this.itemsPerPage
        this.itemsPerPage = count;
        var page = parseInt(indexToPreserve / this.itemsPerPage) + 1;
        this.activePageNumber = page;
        this.pivotPageNumber = this.activePageNumber
      },
      doActions: function (action, rowData, index) {
        this.$emit('row-' + action, cloneDeep(rowData), index)
      },
      isColumnClickable: function (columnSpec) {
        return columnSpec.clickable ? true : false;
      },
      clickableColumnHref: function (columnSpec) {
        return (columnSpec.clickable && columnSpec.clickable.href) ? columnSpec.clickable.href : '';
      },
      clickableColumnTarget: function (columnSpec) {
        return (columnSpec.clickable && columnSpec.clickable.target) ? columnSpec.clickable.target : '';
      },
      clickableColumnClass: function (rowData, key, index, columnSpec) {
        if (columnSpec.clickable && columnSpec.clickable.class) {
          if (typeof columnSpec.clickable.class === 'string') {
            return columnSpec.clickable.class;
          }
          else if (isFunction(columnSpec.clickable.class)) {
//            console.log(rowData, key, index, columnSpec);
            var val = get(rowData, key, '?');
            return columnSpec.clickable.class(val, rowData, key, index, columnSpec);
          }
        }
        return '';
      },
      clickableColumnHandler: function (rowData, key, index, columnSpec) {
        var val = get(rowData, key, '?');
        if (columnSpec.clickable && columnSpec.clickable.handler) {
          columnSpec.clickable.handler(
            val,
            Object.assign({}, rowData),
            key,
            index,
            Object.assign({}, columnSpec)
          );
        }
        else {
          this.$emit('cell-clicked',
            val,
            Object.assign({}, rowData),
            key,
            index,
            Object.assign({}, columnSpec)
          )
        }
      },
      customRawValue: function (rowData, key, index, columnSpec) {
        var val = get(rowData, key, '?');

        if (columnSpec.customValue && isFunction(columnSpec.customValue)) {
          val = columnSpec.customValue(val, rowData, key, index, columnSpec);
        }

        if (columnSpec.customFilter && isFunction(columnSpec.customFilter)) {
          val = columnSpec.customFilter(val)
        }
        else if (columnSpec.filter) {
          const filterSpec = columnSpec.filter.split(':');
          switch (filterSpec[0]) {
            case 'currency':
              val = this.$options.filters.currency(val, filterSpec[1]);
              break;
            case 'date':
              val = this.$options.filters.date(val, filterSpec[1]);
              break;
          }
        }

        if (columnSpec.customRenderer && isFunction(columnSpec.customRenderer)) {
          val = columnSpec.customRenderer(val)
        }
        return val
      },
      actionIsShown: function (action, rowData) {
        if (action.hideOn && isFunction(action.hideOn)) {
          return !action.hideOn(rowData)
        }
        else if (action.showOn && isFunction(action.showOn)) {
          return action.showOn(rowData)
        }
        else {
          return true
        }
      },
      isRowActionsValid: function () {
        return (Object.keys(this.rowActions).length > 0)
      }
    },
    filters: {
      capitalize: function (str) {
        return str.charAt(0).toUpperCase() + str.slice(1)
      }
    }
  }
</script>
<style>
</style>
