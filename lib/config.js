var httpTunnelConfigPath = 'https://downloads.lambdatest.com/tunnel/node-tunnel-config-v3-latest.json',
  httpTunnelLogUrl = 'https://oinwgsy681.execute-api.us-east-1.amazonaws.com/prod/addLog',
  https = require('https'),
  urlParse = require('url'),
  HttpsProxyAgent = require('https-proxy-agent'),
  util = require('./util');
module.exports = function(options, fnCallback) {
  var reqOptions = urlParse.parse(httpTunnelConfigPath);
  var proxyOpts = util.getProxyOpts_(options);
  if (Object.keys(proxyOpts).length) {
    reqOptions.agent = new HttpsProxyAgent(proxyOpts);
  }
  https
    .get(reqOptions, resp => {
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
          logger: setupLogger_(options, json)
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
function setupLogger_(options, jsonResponse) {
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
          var reqOptions = {
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
          var proxyOpts = util.getProxyOpts_(options);
          if (Object.keys(proxyOpts).length) {
            reqOptions.agent = new HttpsProxyAgent(proxyOpts);
          }
          var req = https.request(reqOptions, res => {
            res.on('data', _ => {});
          });

          req.on('error', _ => {});
          req.write(data);
          req.end();
        }
      }
    };
  } catch (e) {}
}
