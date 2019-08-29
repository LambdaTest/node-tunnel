const LambdatTestTunnel = require('./lib/tunnel');
const tunnelInstance = new LambdatTestTunnel();
const tunnelArguments = {
  user: '<Username>',
  key: '<AccessKey>',
  env: 'stage'
};
(async function() {
  try {
    await tunnelInstance.start(tunnelArguments);
    console.log('Tunnel is Running Successfully');
  } catch (err) {
    console.log(err);
  }
})();