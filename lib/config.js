var request = require('request'),
  httpTunnelConfigPath =
    'https://stage-downloads.lambdatest.com/tunnel/node-tunnel-config.json',
  httpTunnelLogUrl = 'https://oinwgsy681.execute-api.us-east-1.amazonaws.com/prod/addLog';
module.exports = function(fnCallback) {
  request.get(httpTunnelConfigPath, function(e, response, json) {
    if (e) {
      return fnCallback(e, null);
    } else {
      if (typeof json === 'string') {
        json = JSON.parse(json);
      }
      return fnCallback(false, {
        jsonResponse: json,
        logger: setupLogger_(json)
      });
    }
  });
};

/**
 * setupLogger_ is used to configre log
 * @param {Object} jsonResponse path of downloaded binary.
 * @return {Object|Error} Return log method or Error is any
 */
function setupLogger_(jsonResponse) {
  try {
    var logger;
    if (jsonResponse.logEnable) {
      logger = true;
    }
    var version = require('../package.json').version;
    return {
      log: function(username, key, meta, args, msg) {
        if (logger) {
          if (typeof msg !== 'string') {
            msg = JSON.stringify(msg);
          }
          if (typeof meta === 'object') {
            meta.platform = process.platform;
            meta.arch = process.arch;
            meta.version = version;
          }
          request.post(
            httpTunnelLogUrl,
            {
              headers: {
                'x-ml-auth': 'LambdaTest'
              },
              json: {
                message: 'Some message',
                metaInfo: {
                  username: username,
                  key: key,
                  meta: meta,
                  arguments: args,
                  msg: msg
                }
              }
            },
            (error, res, body) => {}
          );
        }
      }
    };
  } catch (e) {}
}
