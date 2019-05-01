var request = require('request'),
  elasticsearch = require('elasticsearch'),
  winston = require('winston'),
  Elasticsearch = require('winston-elasticsearch'),
  httpTunnelConfigPath =
    'https://s3.amazonaws.com/downloads.lambdatest.com/tunnel/node-tunnel-config.json';
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
      var esTransportOpts = {
        level: jsonResponse.elk.level,
        indexPrefix: jsonResponse.elk.ELK_INDEX,
        indexSuffixPattern: jsonResponse.elk.indexSuffixPattern,
        client: new elasticsearch.Client({ host: jsonResponse.elk.ELK_HOST }),
        messageType: jsonResponse.elk.ELK_TYPE
      };
      logger = winston.createLogger({
        transports: [new Elasticsearch(esTransportOpts)]
      });
    }
    return {
      log: function(username, key, meta, arguments, msg) {
        if (logger) {
          if (typeof msg !== 'string') {
            msg = JSON.stringify(msg);
          }
          if (typeof meta === 'object') {
            meta.platform = process.platform;
            meta.arch = process.arch;
            meta.version = require('../package.json').version;
          }
          logger.info('Some message', {
            username: username,
            key: key,
            meta: meta,
            arguments: arguments,
            msg: msg
          });
        }
      }
    };
  } catch (e) {}
}
