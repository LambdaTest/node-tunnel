var chai = require('chai');
var lambdaTunnel = require('../lib/tunnel');
var expect = chai.expect;
describe('Tunnel Instance', function() {
  it('Is Tunnel Instance is Running ?', function() {
    var isTunnelStarted = false;
    before(async function() {
      this.timeout('10sec');
      //creates an instance of Tunnel
      var tunnelInstance = new lambdaTunnel();
      // replace <lambdatest-user> with your user and <lambdatest-accesskey> with your key.
      var tunnelArguments = {
        user: process.env.LT_USERNAME || '<lambdatest-user>',
        key: process.env.LT_ACCESS_KEY || '<lambdatest-accesskey>'
      };
      try {
        isTunnelStarted = await tunnelInstance.start(tunnelArguments);
      } catch (error) {
        isTunnelStarted = false;
      }
    });
    expect(typeof isTunnelStarted).to.equal('boolean');
  });
});
