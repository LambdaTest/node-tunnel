var urlParse = require('url');
module.exports = {
  getProxyOpts_
};

/**
 * getProxyOpts_ is used to configre request
 * @param {Object} options.
 * @return {Object|Error} Return proxyOpts
 */
function getProxyOpts_(options) {
  var proxyOpts = {};
  if (options.proxyHost && options.proxyPort) {
    proxyOpts = {
      host: options.proxyHost,
      port: options.proxyPort
    };
  } else if (process.env.http_proxy) {
    proxyOpts = urlParse.parse(process.env.http_proxy);
  }
  if ((options.proxyUser && !options.proxyPass) || (!options.proxyUser && options.proxyPass)) {
    throw Error('proxyUser and proxyPass must be both or none');
  } else if (options.proxyUser && options.proxyPass) {
    if (Object.keys(proxyOpts).length) {
      proxyOpts.auth = options.proxyUser + ':' + options.proxyPass;
    }
  }
  return proxyOpts
}
