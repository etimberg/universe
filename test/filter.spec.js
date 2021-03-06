var chai = require('chai')
var chaiAsPromised = require('chai-as-promised')

chai.use(chaiAsPromised)
var expect = chai.expect

var universe = require('../universe');
var crossfilter = require('crossfilter2');


var data = require('./data');


describe('universe filter', function() {

  var u = universe(data)

  beforeEach(function() {
    return u.then(function(u) {
      return u.clear()
    })
  })

  it('has the filter method', function() {
    return u.then(function(u) {
      expect(typeof(u.filter)).to.deep.equal('function')
    })
  })

  it('can not filter on a non-existent column', function() {
    return u.then(function(u) {
      return u.query({
          groupBy: 'total',
          select: {
            $max: 'total'
          }
        })
        .then(function(res) {
          return res.universe.filter('someOtherColumn', {
            $gt: 95
          })
        })
        .catch(function(err) {
          expect(err).to.be.defined
        })
    })
  })

  it('can filter based on a single column that is not defined yet, then recycle that column', function() {
    var data
    return u.then(function(u) {
      return u.query({
          groupBy: 'tip',
          select: {
            $max: 'total'
          }
        })
        .then(function(res) {
          data = res.data
          return res.universe.filter('total', {
            $gt: 95
          })
        })
        .then(function(u) {
          expect(data).to.deep.equal([
            {"key": 0, "value": {"max": 200, "valueList": [100, 200]}},
            {"key": 100, "value": {"max": 200, "valueList": [190, 190, 200]}},
            {"key": 200, "value": {"max": 300, "valueList": [300]}}
          ])
          return u.filter('total')
        })
        .then(function(u){
          expect(u.columns.length).to.deep.equal(1)
        })
    })
  })

  it('can filter based on a complex column regardless of key order', function() {
    var data
    return u.then(function(u) {
      return u.query({
          groupBy: ['tip', 'total'],
          select: {
            $max: 'total'
          }
        })
        .then(function(res) {
          data = res.data
          return res.universe.filter(['total', 'tip'], {
            $gt: 95
          })
        })
        .then(function(res) {
          expect(data).to.deep.equal([
            {"key": [0, 100],"value": {"valueList": [100],"max": 100}},
            {"key": [0, 200],"value": {"valueList": [200],"max": 200}},
            {"key": [0, 90],"value": {"valueList": [90, 90, 90, 90, 90, 90],"max": 90}},
            {"key": [100, 190],"value": {"valueList": [190, 190],"max": 190}},
            {"key": [100, 200],"value": {"valueList": [200],"max": 200}},
            {"key": [200, 300],"value": {"valueList": [300],"max": 300}}
          ])
        })
    })
  })

  it('can toggle filters using simple values', function() {
    var data
    return u.then(function(u) {
      return u.query({
          groupBy: 'tip',
          select: {
            $count: true
          }
        })
        .then(function(res) {
          data = res.data
          return res.universe.filter('type', 'cash')
        })
        .then(function(u) {
          expect(data).to.deep.equal([
            { key: 0, value: { count: 2 } },
            { key: 100, value: { count: 0 } },
            { key: 200, value: { count: 0 } }
          ])
          return u
        })
        .then(function(u) {
          return u.filter('type', 'cash')
        })
        .then(function(){
          expect(data).to.deep.equal([
            { key: 0, value: { count: 8 } },
            { key: 100, value: { count: 3 } },
            { key: 200, value: { count: 1 } }
          ])
        })
    })
  })

  it('can toggle filters using an array as a range', function() {
    var data
    return u.then(function(u) {
      return u.query({
          groupBy: 'type',
          select: {
            $count: true
          }
        })
        .then(function(res) {
          data = res.data
          return res.universe.filter('total', [85, 101], true)
        })
        .then(function(u) {
          expect(data).to.deep.equal([
            { key: 'cash', value: { count: 1 } },
            { key: 'tab', value: { count: 6 } },
            { key: 'visa', value: { count: 0 } }
          ])
          return u
        })
        .then(function(u) {
          return u.filter('total', [85, 91], true)
        })
        .then(function(){
          expect(data).to.deep.equal([
            { key: 'cash', value: { count: 0 } },
            { key: 'tab', value: { count: 6 } },
            { key: 'visa', value: { count: 0 } }
          ])
        })
    })
  })

  it('can toggle filters using an array as an include', function() {
    var data
    return u.then(function(u) {
      return u.query({
          groupBy: 'type',
          select: {
            $count: true
          }
        })
        .then(function(res) {
          data = res.data
          return res.universe.filter('total', [90, 100])
        })
        .then(function(u) {
          expect(data).to.deep.equal([
            { key: 'cash', value: { count: 1 } },
            { key: 'tab', value: { count: 6 } },
            { key: 'visa', value: { count: 0 } }
          ])
          return u
        })
        .then(function(u) {
          return u.filter('total', [90, 300, 200])
        })
        .then(function(){
          expect(data).to.deep.equal([
            { key: 'cash', value: { count: 1 } },
            { key: 'tab', value: { count: 0 } },
            { key: 'visa', value: { count: 2 } }
          ])
        })
    })
  })
})
