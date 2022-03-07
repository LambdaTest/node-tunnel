var lambdaTunnel = require('../index')
var chai = require('chai');
var expect = chai.expect;

describe('Tunnel runs successfully', function() {
  var isTunnelStarted = false;
  beforeEach(function(done) {
    //start tunnel
    this.timeout(10000)
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
          done()
        }
      });
    } catch (error) {
      isTunnelStarted = false;
    }
  })
  it('Tunnel doesnt start on wrong parameter', function() {
    expect(typeof isTunnelStarted).to.equal('boolean');
    expect(isTunnelStarted).to.equal(true);
  });
});
