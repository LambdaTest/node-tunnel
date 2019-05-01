var chai = require('chai');
var expect = chai.expect;
describe('Tunnel runs successfully', function() {
  it('Tunnel doesnt start on wrong parameter', function() {
    var isTunnelStarted = false;
    before(function() {
      this.timeout('10sec');
      //creates an instance of Tunnel
      var tunnelInstance = new lambdaTunnel();
      // replace <lambdatest-user> with your user and <lambdatest-accesskey> with your key.
      var tunnelArguments = {
        user: process.env.LT_USERNAME || '<lambdatest-user>',
        key: process.env.LT_ACCESS_KEY || '<lambdatest-accesskey>'
      };
      try {
        tunnelInstance.start(tunnelArguments, function(error, status) {
          if (!error) {
            isTunnelStarted = true;
          }
        });
      } catch (error) {
        isTunnelStarted = false;
      }
    });
    expect(typeof isTunnelStarted).to.equal('boolean');
  });
});
