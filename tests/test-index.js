var chai = require('chai');
var expect = chai.expect;
var localTunnelConfig = require('../lib/conf/node-tunnel-config.json');
describe('Tunnel Test', function() {
  it('File for config tunnel is exist ? ', function() {
    expect(typeof localTunnelConfig).to.equal('object');
  });
});
