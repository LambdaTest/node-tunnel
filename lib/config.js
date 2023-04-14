const httpTunnelConfigPath = 'https://downloads.lambdatest.com/tunnel/node-tunnel-config-v3-latest.json'
const httpTunnelLogUrl = 'https://oinwgsy681.execute-api.us-east-1.amazonaws.com/prod/addLog'
const https = require('https')
const urlParse = require('url')
const HttpsProxyAgent = require('https-proxy-agent')
const util = require('./util')
module.exports = function (options, fnCallback) {
  const reqOptions = urlParse.parse(httpTunnelConfigPath)
  const proxyOpts = util.getProxyOpts_(options)
  if (Object.keys(proxyOpts).length) {
    reqOptions.agent = new HttpsProxyAgent(proxyOpts)
  }
  https
    .get(reqOptions, resp => {
      let json = ''
      resp.on('data', chunk => {
        json += chunk
      })
      resp.on('end', () => {
        if (typeof json === 'string') {
          json = JSON.parse(json)
        }
        return fnCallback(false, {
          jsonResponse: json,
          logger: setupLogger_(options, json)
        })
      })
    })
    .on('error', err => {
      return fnCallback(err, null)
    })
}

/**
 * setupLogger_ is used to configre log
 * @param {Object} jsonResponse path of downloaded binary.
 * @return {Object|Error} Return log method or Error is any
 */
function setupLogger_ (options, jsonResponse) {
  try {
    let logger
    if (jsonResponse.logEnable) {
      logger = true
    }
    const version = require('../package.json').version
    return {
      log: function (username, key, meta, args, msg) {
        if (logger) {
          if (typeof msg !== 'string') {
            msg = JSON.stringify(msg)
          }
          if (typeof meta === 'object') {
            meta.platform = process.platform
            meta.arch = process.arch
            meta.version = version
          }
          const data = JSON.stringify({
            message: 'Some message',
            metaInfo: {
              username,
              key,
              meta,
              arguments: args,
              msg
            }
          })
          const _httpTunnelLogUrl = urlParse.parse(httpTunnelLogUrl)
          const reqOptions = {
            hostname: _httpTunnelLogUrl.hostname,
            port: _httpTunnelLogUrl.port,
            path: _httpTunnelLogUrl.path,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-ml-auth': 'LambdaTest',
              'Content-Length': data.length
            }
          }
          const proxyOpts = util.getProxyOpts_(options)
          if (Object.keys(proxyOpts).length) {
            reqOptions.agent = new HttpsProxyAgent(proxyOpts)
          }
          const req = https.request(reqOptions, res => {
            res.on('data', _ => {})
          })

          req.on('error', _ => {})
          req.write(data)
          req.end()
        }
      }
    }
  } catch (e) {}
}
