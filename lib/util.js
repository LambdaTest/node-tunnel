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
    if ((options.proxyUser && !options.proxyPass) || (!options.proxyUser && options.proxyPass)) {
      throw Error('proxyUser and proxyPass must be both or none');
    } else if (options.proxyUser && options.proxyPass) {
      proxyOpts.auth = options.proxyUser + ':' + options.proxyPass;
    }
  } else if (process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy) {
    proxyOpts = urlParse.parse(process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy);
  }
  return proxyOpts
}
