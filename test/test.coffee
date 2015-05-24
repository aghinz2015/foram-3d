# Project
main = require('../src/main')

# Chai
chai = require('chai')

assert = chai.assert
should = chai.should()
expect = chai.expect


describe 'something', (done) ->

  describe "when given something", ->

    it "should do this", ->
        # tests using chai API here
