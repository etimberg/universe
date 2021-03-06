'use strict'

var Promise = require('q')
var _ = require('./lodash')

module.exports = universe

function universe(data) {

  var service = {
    columns: [],
    filters: {},
  }

  var cf = require('./crossfilter')(service)

  return cf.build(data)
    .then(function(data) {
      service.cf = data
      return _.assign(service, {
        add: cf.add,
        remove: cf.remove,
        column: require('./column')(service),
        query: require('./query')(service),
        filter: require('./filters')(service).filter,
        clear: require('./clear')(service),
      })
    })
}
