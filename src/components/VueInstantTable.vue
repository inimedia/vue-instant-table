<template>
  <div class="table-responsive">
    <table class="table table-hover"
           :class="tableClass">
      <thead>
      <tr>
        <th v-for="(column, key) in columns" @click="sortBy(key)" class="sortable"
            :class="{ active: sortKey == column.key}">
          {{ column.label | capitalize }}
          <span class="fa" :class="sortOrders[key] > 0 ? 'fa-sort-up' : 'fa-sort-down'">
            </span>
        </th>
        <th v-if="isRowActionsValid()"></th>
        <!-- space for item actions -->
      </tr>
      </thead>
      <tbody>
      <tr v-for="(row, index) in visibleData" :class="customRowClass(row, index)">
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
    <div class="row" :class="paginationClass" v-if="tableOptions.pagination && tableOptions.pagination.visible">
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
        <p>Hal <span>{{ activePageNumber }}</span> dari <span>{{ totalPages }}</span>, untuk <span>{{ filteredData.length }}</span>
          data</p>
      </div>
    </div>
    <!-- row -- pagination -->
  </div>
  <!-- empty div -->
</template>
<script>
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
  const randomString = (length, chars) => {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
    return result;
  }

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
      paginationClass: String,
      rowKey: String
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
            itemsPerPageList: [10, 30, 50],
            visible: true
          };
        }
      }
      else {
        options.pagination = {
          itemsPerPageList: [10, 30, 50],
          visible: true
        };
      }
      if (typeof options.pagination.visible === 'undefined') {
        options.pagination.visible = true;
      }
      else if (options.pagination.visible === false) {
        options.pagination.itemsPerPageList[0] = 500;
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
      seekData: function () {
        let rowKey = '_id';
        if (this.rowKey)
          rowKey = this.rowKey;
        return this.value.map(item => {
          if (!item[rowKey])
            item[rowKey] = randomString(16, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
          return item[rowKey];
        });
      },
      filteredData: function () {
        var columnKey = Object.keys(this.columns);
        var filter = this.filter && this.filter.toLowerCase();
        var sortKey = this.sortKey;
        var order = this.sortOrders[sortKey];
        var data = this.value;

        if (filter) {
          data = data.filter(function (row) {
            return columnKey.some((key) => {
              return String(get(row, key, '')).toLowerCase().indexOf(filter) > -1
            });
          })
        }

        if (sortKey) {
          data = data.slice().sort(function (a, b) {
            a = a[sortKey];
            b = b[sortKey];
            return (a === b ? 0 : a > b ? 1 : -1) * order
          })
        }

        this.$emit('filter', data)
        return data
      },
      visibleData: function () {
        var data = this.filteredData;
        var begin = this.activePageNumber * this.itemsPerPage - this.itemsPerPage
        var end = begin + this.itemsPerPage;
        return data.slice(begin, end);
      },
      totalPages: function () {
        return parseInt(this.filteredData.length / this.itemsPerPage) + (this.filteredData.length % this.itemsPerPage !== 0 ? 1 : 0)
      },
      visiblePagesRange: function () {
        var range = [];
        var activePageNumber = this.activePageNumber;
        var pivotPageNumber = this.pivotPageNumber;
        var totalPages = this.totalPages;
        if (totalPages > 5) {
          totalPages = 5;
        }
        for (var i = (1 - pivotPageNumber); i <= (totalPages - pivotPageNumber); i++) {
          range.splice(range.length, 0, activePageNumber + i);
        }
        return range;

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
        for (var i = 0; i < this.visiblePagesRange.length; i++) {
          if (this.visiblePagesRange[i] === page) {
            this.pivotPageNumber = i+1;
            break;
          }
        }
        this.activePageNumber = page;
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
        var page = this.activePageNumber - 1;
        if (page < 1) {
          page = 1;
        }
        this.activePageNumber = page;
      },
      remainingPagesRange: function () {
        if (this.visiblePagesRange[this.visiblePagesRange.length - 1] >= this.totalPages) {
          return
        }
        var page = this.activePageNumber + 1;
        if (page > this.totalPages) {
          page = this.totalPages;
        }
        this.activePageNumber = page;
      },
      setItemsPerPage: function (count) {
        var indexToPreserve = this.activePageNumber * this.itemsPerPage - this.itemsPerPage
        this.itemsPerPage = count;
        var page = parseInt(indexToPreserve / this.itemsPerPage) + 1;
        this.gotoPage(page);
      },
      doActions: function (action, rowData, index) {
        let rowKey = '_id';
        if (this.rowKey)
          rowKey = this.rowKey;
        let globalIndex = this.seekData.indexOf(rowData[rowKey]);
        this.$emit('row-' + action, cloneDeep(rowData), globalIndex)
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
            var val = get(rowData, key, '-');
            return columnSpec.clickable.class(val, rowData, key, index, columnSpec);
          }
        }
        return '';
      },
      clickableColumnHandler: function (rowData, key, index, columnSpec) {
        var val = get(rowData, key, '-');
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
          let rowKey = '_id';
          if (this.rowKey)
            rowKey = this.rowKey;
          let globalIndex = this.seekData.indexOf(rowData[rowKey]);

          this.$emit('cell-clicked',
            val,
            Object.assign({}, rowData),
            key,
            globalIndex,
            Object.assign({}, columnSpec)
          )
        }
      },
      customRowClass: function (rowData, index) {
        if (this.tableOptions.customRowClass && isFunction(this.tableOptions.customRowClass)) {
          return this.tableOptions.customRowClass(rowData, index);
        }
        return ''
      },
      customRawValue: function (rowData, key, index, columnSpec) {
        var val = get(rowData, key, '-');

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
  .pagination > .active > span {
    background-color: transparent !important;
    font-weight: bolder;
  }
</style>
