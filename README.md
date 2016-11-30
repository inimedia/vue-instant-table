# vue-instant-table

> Instant table generator with awesome Vue

## Installation

### Quick Install
``` bash
# yarn
yarn add vue-instant-table

# npm
npm install --save vue-instant-table
```

### Dependencies
* Jquery
* Font Awesome
* Bootstrap
* Vue 2.x
* Lodash
* Moment.js
* [Vue Common Filters](static/vue-commons.js)

## Usage

### Javascript Section
``` javascript
import VueInstantTable from 'vue-instant-table';

const app = new Vue({
    el: '#app',
    components: {
        'vue-instant-table': VueInstantTable
    },
    data: function () {
        return {
            table: {
                data: ...,
                columns: ...,
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
        openEditModal: function (rowData, index) {
        },
        openRemoveModal: function (rowData, index) {
        },
    }
});
```

### HTML Section
``` html
<vue-instant-table
    v-model="table.data"
    :columns="table.columns"
    :filter="table.filter"
    :options="table.options"
    :row-actions="table.rowActions"
    v-on:row-update="openUpdateModal"
    v-on:row-delete="openDeleteModal">
</vue-instant-table>
```

## TODO

* reduce dependencies

## Build Setup

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:8080
npm run dev

# build for production with minification
npm run build

# run unit tests
npm run unit

# run e2e tests
npm run e2e

# run all tests
npm test
```
