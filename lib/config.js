var httpTunnelConfigPath =
    'https://s3.amazonaws.com/downloads.lambdatest.com/tunnel/node-tunnel-config.json',
  httpTunnelLogUrl = 'https://oinwgsy681.execute-api.us-east-1.amazonaws.com/prod/addLog';
var https = require('https');
var urlParse = require('url');
module.exports = function(fnCallback) {
  https
    .get(httpTunnelConfigPath, resp => {
      let json = '';
      resp.on('data', chunk => {
        json += chunk;
      });
      resp.on('end', () => {
        if (typeof json === 'string') {
          json = JSON.parse(json);
        }
        return fnCallback(false, {
          jsonResponse: json,
          logger: setupLogger_(json)
        });
      });
    })
    .on('error', err => {
      return fnCallback(err, null);
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
          var data = JSON.stringify({
            message: 'Some message',
            metaInfo: {
              username: username,
              key: key,
              meta: meta,
              arguments: args,
              msg: msg
            }
          });
          var _httpTunnelLogUrl = urlParse.parse(httpTunnelLogUrl);
          var options = {
            hostname: _httpTunnelLogUrl.hostname,
            port: _httpTunnelLogUrl.port,
            path: _httpTunnelLogUrl.path,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-ml-auth': 'LambdaTest',
              'Content-Length': data.length
            }
          };
          var req = https.request(options, res => {
            res.on('data', d => {
              process.stdout.write(d);
            });
          });

          req.on('error', _ => {});
          req.write(data);
          req.end();
        }
      }
    };
  } catch (e) {}
}
