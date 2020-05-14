var childProcess = require('child_process'),
  TunnelBinary = require('./tunnel_binary'),
  split = require('split'),
  https = require('https'),
  http = require('http'),
  urlParse = require('url'),
  HttpsProxyAgent = require('https-proxy-agent'),
  util = require('./util'),
  getPort = require('get-port'),
  os = require('os'),
  logger,
  httpTunnelConfig,
  Config_ = require('./config'),
  package_ = require('../package.json'),
  packageVersion = package_.version,
  packageName = package_.name,
  usingPorts = [];
/**
 * Tunnel is a function based Class.
 */
function Tunnel() {
  this.isProcessRunning = false;
  this.options = null;
  /**
   * start is used to run tunnel binary File
   * @param {!Setting} options is command line argumants passed during
   *     Initialize the Tunnel
   * @param {Function} fnCallback is a Callable function.
   * @return {Object|Error} Return Object with success or Error if any
   */
  this.start = function(options, fnCallback) {
    if (typeof options !== 'object') {
      throw new Error("It's look like you have passed invalid Arguments");
    }
    this.options = options;
    var self = this;

    if (typeof fnCallback !== 'function') {
      return new Promise(function(resolve, reject) {
        if (typeof options['onlyCommand'] !== 'undefined') {
          return resolve(true);
        }
        // Required check
        if (!options['user'] || !options['key']) {
          return reject({ message: 'user and key is required' });
        }
        // Configure logger
        Config_(options, function(error, response) {
          if (error) {
            throw new Error(error);
          }
          if (response.jsonResponse.supportedVersions.indexOf(packageVersion) === -1) {
            throw new Error(
              "\nIt's seems you have unsupported version of " +
                packageName +
                '.' +
                'Please remove and install newer version \n ' +
                'npm uninstall ' +
                packageName +
                ' \nnpm i ' +
                packageName
            );
          } else if (packageVersion !== response.jsonResponse.latest) {
            console.warn(
              "\nIt's seems you have older version of " +
                packageName +
                '.' +
                'For better experience , please update using: ' +
                '\nnpm update ' +
                packageName
            );
          }
          logger = response.logger;
          httpTunnelConfig = response;
          // Verifying User Credentials
          console.log(`Verifying credentials`);
          verifyToken_(options, function(e, res) {
            if (e) {
              console.log(`Auth failed! `);
              logger.log(
                options['user'],
                options['key'],
                { filename: __filename },
                options,
                'Getting error while verifying user and key . Error Response is : ' + (res || e)
              );
              console.log(res.message || res || e);
              return reject(res || e);
            }
            console.log(`Auth succeeded`);
            // On successful verifying of Credential Get binary path to run tunnel
            getBinaryPath_(self, options, function(binaryPath) {
              self.binaryPath = binaryPath;
              // Run binary after getting this and attempting atmost 5 times
              console.log(`Starting tunnel`);
              runBinary_(self, 5, function(e, response) {
                if (e) {
                  return reject(e);
                } else {
                  return resolve(response);
                }
              });
            });
          });
        });
      });
    }

    if (typeof options['onlyCommand'] !== 'undefined') {
      return fnCallback(null, true);
    }
    // Required check
    if (!options['user'] || !options['key']) {
      return fnCallback({ message: 'user and key is required' }, false);
    }

    // Configure looger
    Config_(options, function(error, response) {
      if (error) {
        throw new Error(error);
      }
      if (response.jsonResponse.supportedVersions.indexOf(packageVersion) === -1) {
        throw new Error(
          "\nIt's seems you have unsupported version of " +
            packageName +
            '.' +
            'Please remove and install newer version \n ' +
            'npm uninstall ' +
            packageName +
            ' \nnpm i ' +
            packageName
        );
      } else if (packageVersion !== response.jsonResponse.latest) {
        console.warn(
          "\nIt's seems you have older version of " +
            packageName +
            '.' +
            'For better experience , please update using: ' +
            '\nnpm update ' +
            packageName
        );
      }
      logger = response.logger;
      httpTunnelConfig = response;
      // Verifying User Credentials
      console.log(`Verifying credentials`);
      verifyToken_(options, function(e, res) {
        if (e) {
          console.log(`Auth failed! `);
          console.log(res.message || res || e);
          return fnCallback(res || e, false);
        }
        console.log(`Auth succeeded`);
        // On successful verifying of Credential Get binary path to run tunnel
        getBinaryPath_(self, options, function(binaryPath) {
          self.binaryPath = binaryPath;
          // Run binary after getting this and attempting atmost 5 times
          console.log(`Starting tunnel`);
          runBinary_(self, 5, fnCallback);
        });
      });
    });
  };

  /**
   * isRunning method is used to determine the running status
   * @return {boolean} Return true/false.
   */
  this.isRunning = function() {
    return this.isProcessRunning && this.proc && true;
  };
  /**
   * getTunnelName is used to get running tunnel name
   * @param {Function} fnCallback is a Callable function.
   * @return {string|null} Return name or null if any
   */
  this.getTunnelName = function(fnCallback) {
    if (typeof fnCallback !== 'function') {
      var that = this;
      return new Promise(function(resolve, reject) {
        if (that.isRunning()) {
          if (that.infoAPIPort) {
            retryTunnelName_(that, that.infoAPIPort, 100, function(tunnelName) {
              if (tunnelName === null) {
                return reject(null);
              } else {
                return resolve(tunnelName);
              }
            });
          } else {
            return reject(null);
          }
        } else {
          console.log('Tunnel is not Running Currently');
          return reject(null);
        }
      });
    }
    // check tunnel status and Retry atmost 100 time to get tunnel name.We are
    // doing intentionlly because tunnel may take few times to start server
    if (this.isRunning()) {
      if (this.infoAPIPort) {
        retryTunnelName_(this, this.infoAPIPort, 100, fnCallback);
      } else {
        return fnCallback(null);
      }
    } else {
      console.log('Tunnel is not Running Currently');
      return fnCallback(null);
    }
  };
  /**
   * stop is used to stop the Running Tunnel Process
   * @param {Function} fnCallback is a Callable function.
   * @return {null|Error} Return null if stoped successfully else Error if any
   */
  this.stop = function(fnCallback) {
    if (typeof fnCallback !== 'function') {
      var that = this;
      return new Promise(function(resolve, reject) {
        // Using try-catch , possibility of Error during killing process
        try {
          // check tunnel status if not running Return Stop to true
          if (!that.isRunning()) {
            return resolve(true);
          }
          // Kill the Specified Running process and chield process of this process
          killRunningProcess_(that, function(e) {
            if (e) {
              logger.log(
                that.options['user'],
                that.options['key'],
                { filename: __filename },
                that.options,
                'Getting error while we are trying to kill the running process. Throws Error : ' + e
              );
              return reject(e);
            }
            return resolve(true);
          });
        } catch (e) {
          logger.log(
            this.options['user'],
            this.options['key'],
            { filename: __filename },
            this.options,
            'Something unexpected while trying to kill process. Error : ' + e
          );
          return reject(e);
        }
      });
    }
    // Using try-catch , possibility of Error during killing process
    try {
      // check tunnel status if not running Return Stop to true
      if (!this.isRunning()) {
        return fnCallback(false, true);
      }
      var that = this;
      // Kill the Specified Running process and chield process of this process
      killRunningProcess_(that, function(e) {
        if (e) {
          logger.log(
            that.options['user'],
            that.options['key'],
            { filename: __filename },
            that.options,
            'Getting error while we are trying to kill the running process. Throws Error : ' + e
          );
          return fnCallback(e, false);
        }
        return fnCallback(false, true);
      });
    } catch (e) {
      logger.log(
        this.options['user'],
        this.options['key'],
        { filename: __filename },
        this.options,
        'Something unexpected while trying to kill process. Error : ' + e
      );
      return fnCallback(e, false);
    }
  };
}

/**
 * runBinary_ is used to Run Tunnel Binary
 * @param {Tunnel} self is Current Tunnel Instance.
 * @param {number} retries max attempt try to Run tunnel.
 * @param {Function} fnCallback is a Callable function.
 * @return {boolean} Return true/false whether tunnel is Running Successfully or
 *     not.
 */
function runBinary_(self, retries, fnCallback) {
  if (retries >= 0) {
    // addArguments_ method return formatted argumants or error if any.
    addArguments_(self, function(e, binaryArguments) {
      if (e) {
        logger.log(
          self.options['user'],
          self.options['key'],
          { filename: __filename },
          self.options,
          'Getting this error while adding argument . Error : ' + e
        );
        return fnCallback(
          new Error('Getting this error while adding argument . Error : ' + e),
          false
        );
      }
      // Run Binary with argumants in spawn process.
      self.proc = childProcess.spawn(self.binaryPath, binaryArguments);
      var isCallback = false;
      self.proc.stdout.pipe(split()).on('data', function(data) {
        if (!isCallback) {
          self.isProcessRunning = true;
          isCallback = true;
          self.getTunnelName(function(tunnelName) {
            console.log(`Tunnel successfully initiated. You can start testing now`);
            return fnCallback(null, true);
          });
        }
      });

      self.proc.stderr.pipe(split()).on('data', function(data) {
        logger.log(
          self.options['user'],
          self.options['key'],
          { filename: __filename },
          self.options,
          'We are getting this error while we are trying to spawning process. Error :  ' + data
        );
        self.isProcessRunning = false;
        if (!isCallback) {
          var logFileIndex = binaryArguments.indexOf('--logFile');
          if (logFileIndex === -1) {
            console.log(
              `Tunnel couldn't start. Please see  ${__dirname}/${
                binaryArguments[logFileIndex + 1]
              } for more details`
            );
          }
          return fnCallback(null, false);
        }
      });

      // On exit if process is exit due to unable to start local Server then
      // Retry else log and exit
      self.proc.on('exit', function(code) {
        if (code && code === 10) {
          runBinary_(self, retries - 1, fnCallback);
        }
        console.log(`Tunnel successfully stopped`);
        logger.log(
          self.options['user'],
          self.options['key'],
          { filename: __filename },
          self.options,
          'Getting this message while tunnel is being closed. Exit code is : ' + code
        );
        self.isProcessRunning = false;
        if (!isCallback) {
          return fnCallback(null, false);
        }
      });
    });
  } else {
    logger.log(
      self.options['user'],
      self.options['key'],
      { filename: __filename },
      self.options,
      'Number of retries to run binary exceeded.'
    );
    return fnCallback(new Error('Number of retries to run binary exceeded.'), false);
  }
}

/**
 * verifyToken_ is used to Run Tunnel Binary
 * @param {Setting} options passed User argumants.
 * @param {Function} fnCallback is a Callable function.
 * @return {Object|Error} Return User Object or Error if any.
 */
function verifyToken_(options, fnCallback) {
  try {
    var data = JSON.stringify({
      username: options['user'],
      token: options['key']
    });

    var _httpAuthUrl = urlParse.parse(httpTunnelConfig.jsonResponse.AuthUrl);
    var reqOptions = {
      hostname: _httpAuthUrl.hostname,
      port: _httpAuthUrl.port,
      path: _httpAuthUrl.path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        Accept: 'application/json',
        client: 'npm-tunnel',
        version: packageVersion
      }
    };
    var proxyOpts = util.getProxyOpts_(options);
    if (Object.keys(proxyOpts).length) {
      reqOptions.agent = new HttpsProxyAgent(proxyOpts);
    }
    var req = https.request(reqOptions, resp => {
      let json = '';
      resp.on('data', chunk => {
        json += chunk;
      });
      resp.on('end', () => {
        if (typeof json === 'string') {
          json = JSON.parse(json);
        }
        if (json && json.type === 'error') {
          logger.log(
            options['user'],
            options['key'],
            { filename: __filename },
            options,
            'Getting this issue while user is not valid' + json
          );
          return fnCallback(true, json);
        }
        return fnCallback(false, json);
      });
    });

    req.on('error', e => {
      logger.log(
        options['user'],
        options['key'],
        { filename: __filename },
        options,
        'We are getting this error while verifying user and key validity. Error : ' + e
      );
      return fnCallback(true, e);
    });
    req.write(data);
    req.end();
  } catch (e) {
    logger.log(
      options['user'],
      options['key'],
      { filename: __filename },
      options,
      'Something unexpected while verifying the user and key validity. Error : ' + e
    );
    return fnCallback(true, e);
  }
}

/**
 * killRunningProcess_ is used to Kill passed current Running process
 * @param {Tunnel} that is Current Tunnel Instance.
 * @param {Function} fnCallback is a Callable function.
 * @return {null|Error} Return null if killing of process is successful or Error
 *     if any.
 */
function killRunningProcess_(that, fnCallback) {
  // use try-catch as possibility of Error while killing process.
  try {
    // Check process is running before killing
    if (that.proc && that.infoAPIPort) {
      var url = 'http://127.0.0.1:' + that.infoAPIPort + '/api/v1.0/stop';
      var parseURL = urlParse.parse(url);
      var reqOptions = {
        hostname: parseURL.hostname,
        port: parseURL.port,
        path: parseURL.path,
        method: 'DELETE'
      };

      var req = http.request(reqOptions, resp => {
        resp.on('data', () => {})
        resp.on('end', () => {
          if (resp.statusCode != 200) {
            killProcess_(that, fnCallback);
          }
          return fnCallback();
        });
      });

      req.on('error', e => {
        killProcess_(that, fnCallback);
        logger.log(
          that.options['user'],
          that.options['key'],
          { filename: __filename },
          that.options,
          'Getting error while killing the running process. Error : ' + e
        );
        return fnCallback(e);
      });
      req.write('');
      req.end();
    } else {
      return fnCallback();
    }
  } catch (e) {
    logger.log(
      that.options['user'],
      that.options['key'],
      { filename: __filename },
      that.options,
      'Getting error while killing the running process. Error : ' + e
    );
    return fnCallback(e);
  }
}

/**
 * addArguments_ is used generate passed User argumants to formatted Argumants
 * as process is Required to Run
 * @param {Tunnel} self is Current Tunnel Instance.
 * @param {Function} fnCallback is a Callable function.
 * @return {Object|Error} Return Arguments Object or Error if any.
 */
function addArguments_(self, fnCallback) {
  try {
    var options = self.options;
    var binaryArgs = [];
    for (var key in options) {
      var value = options[key];
      if (key) {
        key = key.toLowerCase().trim();
      }
      switch (key) {
        case 'user':
        case 'key':
        case 'port':
          if (value) {
            binaryArgs.push('--' + key);
            binaryArgs.push(value);
          }
          break;

        case 'tunnelname':
          if (value) {
            binaryArgs.push('--tunnelName');
            binaryArgs.push(value);
          }
          break;
        case 'proxyhost':
          if (value) {
            binaryArgs.push('--proxy-host');
            binaryArgs.push(value);
          }
          break;

        case 'proxyport':
          if (value) {
            binaryArgs.push('--proxy-port');
            binaryArgs.push(value);
          }
          break;

        case 'proxyuser':
          if (value) {
            binaryArgs.push('--proxy-user');
            binaryArgs.push(value);
          }
          break;

        case 'proxypass':
          if (value) {
            binaryArgs.push('--proxy-pass');
            binaryArgs.push(value);
          }
          break;

        case 'localdirectory':
        case 'localdir':
        case 'dir':
          if (value) {
            binaryArgs.push('--dir');
            binaryArgs.push(value);
          }
          break;

        case 'env':
        case 'environment':
          if (value) {
            binaryArgs.push('--env');
            binaryArgs.push(value);
          }
          break;

        case 'verbose':
        case 'v':
          if (value) {
            binaryArgs.push('--v');
          }
          break;

        case 'configurationfile':
        case 'conffile':
        case 'configfile':
          if (value) {
            binaryArgs.push('--config');
            binaryArgs.push(value);
          }
          break;

        case 'sharedtunnel':
        case 'shared-tunnel':
          if (value) {
            binaryArgs.push('--shared-tunnel');
          }
          break;

        case 'localdomains':
        case 'local-domains':
          if (value) {
            binaryArgs.push('--local-domains');
            binaryArgs.push(value);
          }
          break;

        case 'outputconfiguration':
        case 'outputconf':
        case 'outputconfig':
        case 'output-config':
          if (value) {
            binaryArgs.push('--output-config');
            binaryArgs.push(value);
          }
          break;

        case 'dns':
          if (value) {
            binaryArgs.push('--dns');
            binaryArgs.push(value);
          }
          break;

        case 'pidfile':
          if (value) {
            binaryArgs.push('--pidfile');
            binaryArgs.push(value);
          }
          break;

        case 'pac':
          if (value) {
            binaryArgs.push('--pac');
            binaryArgs.push(value);
          }
          break;

        case 'logfile':
          if (value) {
            binaryArgs.push('--logFile');
            binaryArgs.push(value);
          }
          break;
        case 'controller':
          if (value) {
            binaryArgs.push('--controller');
            binaryArgs.push(value);
          }
          break;
      }
    }
    if (binaryArgs.indexOf('--controller') === -1) {
      binaryArgs.push('--controller');
      binaryArgs.push('npm');
    }

    // Get free port with max attempt (5)
    getFreePort_(options, 5, function(e, port) {
      if (typeof port === 'number') {
        binaryArgs.push('--infoAPIPort');
        binaryArgs.push(port);
        // add tunnel name with hostname and port.
        var tunnelNameIndex = binaryArgs.indexOf('--tunnelName');
        var hostnamePort = os.hostname() + port;
        if (tunnelNameIndex === -1) {
          binaryArgs.push('--tunnelName');
          binaryArgs.push(hostnamePort);
        }
        // add logfile name if not given.
        var logFileIndex = binaryArgs.indexOf('--logFile');
        if (logFileIndex === -1) {
          binaryArgs.push('--logFile');
          binaryArgs.push(hostnamePort + '.log');
        }
      }
      self.infoAPIPort = port;
      logger.log(
        options['user'],
        options['key'],
        { filename: __filename },
        options,
        'Info of passed tunnel arguments ' + binaryArgs
      );
      getFreePort_(options, 5, function(e, port_) {
        if (typeof port_ === 'number') {
          binaryArgs.push('--port');
          binaryArgs.push(port_);
          return fnCallback(false, binaryArgs);
        }
      });
    });
  } catch (e) {
    return fnCallback(true, e);
  }
}

/**
 * getFreePort_ is used to find free port on your system
 * @param {Setting} options is User passed arguments.
 * @param {number} retries max attempt, retries to get port.
 * @param {Function} fnCallback is a Callable function.
 * @return {number|Error} Return Free Port or Error if any.
 */
function getFreePort_(options, retries, fnCallback) {
  try {
    getPort(function(e, port) {
      if (e || usingPorts.indexOf(port) > -1) {
        if (retries >= 0) {
          getFreePort_(options, retries - 1, fnCallback);
        } else {
          logger.log(
            options['user'],
            options['key'],
            { filename: __filename },
            options,
            'Error trying to get Free Port on LambdaTest Tunnel' + e
          );
          throw Error(
            'Error trying to get Free Port on LambdaTest Tunnel, Please contact support' + e
          );
        }
      }
      usingPorts.push(port);

      return fnCallback(false, port);
    });
  } catch (e) {
    logger.log(
      options['user'],
      options['key'],
      { filename: __filename },
      options,
      'Error trying to get Free Port on LambdaTest Tunnel' + e
    );
    throw Error('Error trying to get Free Port on LambdaTest Tunnel, Please contact support' + e);
  }
}

/**
 * getBinaryPath_ is used for getting binary Path
 * @param {Tunnel} self is Current Tunnel Instance.
 * @param {Setting} options is User passed arguments.
 * @param {Function} fnCallback is a Callable function.
 * @return {string|Error} Return binary path or Error if any.
 */
function getBinaryPath_(that, options, fnCallback) {
  // if path is there then Return path else get from Server
  if (typeof that.binaryPath == 'undefined') {
    that.binary = new TunnelBinary(httpTunnelConfig);
    var conf = { user: options['user'], key: options['key'] };
    // Do this for getting binary using Proxy.
    if (
      (options['proxyHost'] || options['proxyhost']) &&
      (options['proxyPort'] || options['proxyport'])
    ) {
      conf.proxyHost = options['proxyHost'] || options['proxyhost'];
      conf.proxyPort = options['proxyPort'] || options['proxyport'];
    }
    if (
      (options['proxyUser'] || options['proxyuser']) &&
      (options['proxyPass'] || options['proxypass'])
    ) {
      conf.proxyUser = options['proxyUser'] || options['proxyuser'];
      conf.proxyPass = options['proxyPass'] || options['proxypass'];
    }
    that.binary.binaryPath_(conf, fnCallback);
  } else {
    return fnCallback(that.binaryPath);
  }
}

/**
 * retryTunnelName_ is used to get Running Tunnel Name and Retries to get this
 * atmost 5 attempt.
 * @param {Tunnel} self is Current Tunnel Instance.
 * @param {number} infoAPIPort running local Server Port.
 * @param {number} retries max attempt, retries to get port.
 * @param {Function} fnCallback is a Callable function.
 * @return {string|null} Return tunnelName or null if any.
 */
function retryTunnelName_(self, infoAPIPort, retries, fnCallback) {
  try {
    var timeoutId = null;
    // Check whether max retries is reached ?.
    if (retries >= 0) {
      // local Server path for getting tunnelName
      var url = 'http://127.0.0.1:' + infoAPIPort + '/api/v1.0/info';
      var reqOptions = urlParse.parse(url);
      http
        .get(reqOptions, response => {
          let json = '';
          response.on('data', chunk => {
            json += chunk;
          });
          response.on('end', () => {
            // After successfully getting name clear the timeout and return name
            if (response.statusCode === 200) {
              clearTimeout_(timeoutId);
              if (typeof json === 'string') json = JSON.parse(json);
              return fnCallback((json.data && json.data.tunnelName) || null);
            } else {
              clearTimeout_(timeoutId);
              timeoutId = setTimeout(function() {
                retryTunnelName_(self, infoAPIPort, retries - 1, fnCallback);
              }, 500);
            }
          });
        })
        .on('error', e => {
          logger.log(
            self.options['user'],
            self.options['key'],
            { filename: __filename },
            self.options,
            'Getting error while trying to get the tunnel name from running local server. Error : ' +
              e
          );
          clearTimeout_(timeoutId);
          // wait .5s for next retries
          timeoutId = setTimeout(function() {
            retryTunnelName_(self, infoAPIPort, retries - 1, fnCallback);
          }, 500);
        });
    } else {
      clearTimeout_(timeoutId);
      logger.log(
        self.options['user'],
        self.options['key'],
        { filename: __filename },
        self.options,
        'Number of retries to to get tunnel name exceeded.'
      );
      return fnCallback(null);
    }
  } catch (e) {
    logger.log(
      self.options['user'],
      self.options['key'],
      { filename: __filename },
      self.options,
      'Something unexpected while trying to get tunnel name from local server. Error : ' + e
    );
    return fnCallback(null);
  }
}

/**
 * clearTimeout_ is used to clear setTimeout method.
 * @param {string} timeoutId is setTimeout Instance.
 * @return {null} Return null.
 */
function clearTimeout_(timeoutId) {
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
}
/**
 * killProcess_ is used to kill process method.
 * @param {Object} that is Instance.
 * @param {Function} fnCallback is Callback Method.
 * @return {null} Return null.
 */
function killProcess_(that, fnCallback) {
  that.proc.on('exit', function() {
    if (that.proc.pid) {
      setTimeout(function() {
        try {
          process.kill(that.proc.pid);
        } catch (err) {}
        return fnCallback();
      }, 500);
    }
    return fnCallback();
  });
  if (os.platform() == 'win32') {
    childProcess.exec('taskkill /F /PID ' + that.proc.pid);
  } else {
    that.proc.stdin.pause();
    that.proc.kill('SIGINT');
  }
}
module.exports = Tunnel;
module.exports.Tunnel = Tunnel;
