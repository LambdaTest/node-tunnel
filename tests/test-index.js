var chai = require('chai');
var expect = chai.expect;
var localTunnelConfig = require('../lib/conf/localTunnelConfig.json')
describe('Hello world', function() {
  it('Hello world equality', function() {
    expect(typeof localTunnelConfig).to.equal('object');
  });
});