var request = require('request'),
  httpTunnelConfigPath =
    'https://s3.amazonaws.com/downloads.lambdatest.com/tunnel/node-tunnel-config.json',
  httpTunnelLogUrl = 'https://oinwgsy681.execute-api.us-east-1.amazonaws.com/prod/addLog';
module.exports = function(fnCallback) {
  request.get(httpTunnelConfigPath, function(e, response, json) {
    if (e) {
      return fnCallback(e, null);
    } else {
      json = {
        "tunnelBinary": {
          "mac": {
            "32bit": {
              "httpPath": "https://downloads.lambdatest.com/tunnel/mac/32bit/ltcomponent.zip",
              "binaryName": "ltcomponent.zip",
              "hash": "90a5fc3174a5737edcc8f7a5e0fd7b9f"
            },
            "64bit": {
              "httpPath": "https://downloads.lambdatest.com/tunnel/mac/64bit/ltcomponent.zip",
              "binaryName": "ltcomponent.zip",
              "hash": "a7defc432aaf9af8712eb461c0144693"
            }
          },
          "win": {
            "32bit": {
              "httpPath": "https://downloads.lambdatest.com/tunnel/windows/32bit/ltcomponent.zip",
              "binaryName": "ltcomponent.zip",
              "hash": "eddd5b42fcfacdd4b695d526bda439c5"
            },
            "64bit": {
              "httpPath": "https://downloads.lambdatest.com/tunnel/windows/64bit/ltcomponent.zip",
              "binaryName": "ltcomponent.zip",
              "hash": "06f2389abbe0e2da992e5e95496ad918"
            }
          },
          "linux": {
            "32bit": {
              "httpPath": "https://downloads.lambdatest.com/tunnel/linux/32bit/ltcomponent.zip",
              "binaryName": "ltcomponent.zip",
              "hash": "5278c5efe53bd2919ad6e6d46b9ee1d1"
            },
            "64bit": {
              "httpPath": "https://downloads.lambdatest.com/tunnel/linux/64bit/ltcomponent.zip",
              "binaryName": "ltcomponent.zip",
              "hash": "c67cd26242534194261ef693a34ad078"
            }
          },
          "freebsd": {
            "32bit": {
              "httpPath": "https://downloads.lambdatest.com/tunnel/freebsd/32bit/ltcomponent.zip",
              "binaryName": "ltcomponent.zip",
              "hash": "5278c5efe53bd2919ad6e6d46b9ee1d1"
            },
            "64bit": {
              "httpPath": "https://downloads.lambdatest.com/tunnel/freebsd/64bit/ltcomponent.zip",
              "binaryName": "ltcomponent.zip",
              "hash": "c67cd26242534194261ef693a34ad078"
            }
          }
        },
        "AuthUrl": "https://accounts.lambdatest.com/api/user/token/auth",
        "logEnable": true,
        "latest": "1.0.7",
        "supportedVersions": [
          "1.0.0",
          "1.0.1",
          "1.0.2",
          "1.0.3",
          "1.0.4",
          "1.0.5",
          "1.0.6",
          "1.0.7",
          "1.0.8",
          "1.0.8",
          "1.1.0",
          "1.1.1",
          "2.0.0",
          "3.0.0",
          "4.0.0",
          "5.0.0"
        ]
      };
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
