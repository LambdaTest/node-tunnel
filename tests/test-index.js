const lambdaTunnel = require('../index')
const chai = require('chai')
const expect = chai.expect

describe('Tunnel runs successfully', function () {
  let isTunnelStarted = false
  beforeEach(function (done) {
    // start tunnel
    this.timeout(20000)
    const tunnelInstance = new lambdaTunnel()
    // replace <lambdatest-user> with your user and <lambdatest-accesskey> with your key.
    const tunnelArguments = {
      user: process.env.LT_USERNAME || '<lambdatest-user>',
      key: process.env.LT_ACCESS_KEY || '<lambdatest-accesskey>'
    }
    try {
      tunnelInstance.start(tunnelArguments, function (error, status) {
        if (!error) {
          isTunnelStarted = true
          tunnelInstance.stop().then(status => {
            console.log('Tunnel is Stopped ? ' + status)
          })
          done()
        }
      })
    } catch (error) {
      isTunnelStarted = false
    }
  })
  it('Tunnel doesnt start on wrong parameter', function () {
    expect(typeof isTunnelStarted).to.equal('boolean')
    expect(isTunnelStarted).to.equal(true)
  })
})
