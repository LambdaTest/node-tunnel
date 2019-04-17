var childProcess = require('child_process'),
    TunnelBinary = require('./tunnel_binary'), logger = require('./logger'),
    split = require('split'), request = require('request'),
    getPort = require('get-port'), os = require('os'),
    AUTH_API_URL = 'https://accounts.lambdatest.com/api/user/token/auth';
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
      throw new Error('It\'s look like you have passed invalid Arguments');
    }
    if (typeof fnCallback !== 'function') {
      fnCallback = fnCallback || function() {};
    }
    this.options = options;
    if (typeof options['onlyCommand'] !== 'undefined') {
      return fnCallback(null, true);
    }
    // Required check
    if ((!options['user']) || (!options['key'])) {
      return fnCallback({message: 'user and key is required'}, false);
    }

    // Verifying User Credentials
    var self = this;
    _verifyToken(options, function(e, res) {
      if (e) {
        logger.log(
            options['user'], options['key'], {filename: __filename}, options,
            ('Getting error while verifying user and key . Error Response is : ' +
             (res || e)));
        console.log(res.message || res || e);
        return fnCallback(res || e, false);
      }
      // On successful verifying of Credential Get binary path to run tunnel
      _getBinaryPath(self, options, function(binaryPath) {
        self.binaryPath = binaryPath;
        // Run binary after getting this and attempting atmost 5 times
        runBinary_(self, 5, fnCallback);
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
   * stop is used to stop the Running Tunnel Process
   * @param {Function} fnCallback is a Callable function.
   * @return {null|Error} Return null if stoped successfully else Error if any
   */
  this.stop = function(fnCallback) {
    if (typeof fnCallback !== 'function') {
      fnCallback = fnCallback || function() {};
    }
    // Using try-catch , possibility of Error during killing process
    try {
      // check tunnel status if not running Return Stop to true
      if (!this.isRunning()) return fnCallback();
      var that = this;
      // Kill the Specified Running process and chield process of this process
      _killRunningProcess(that, function(e) {
        if (e) {
          logger.log(
              that.options['user'], that.options['key'], {filename: __filename},
              that.options,
              ('Getting error while we are trying to kill the running process. Throws Error : ' +
               (e)));
          return fnCallback(e);
        }
        return fnCallback();
      });
    } catch (e) {
      logger.log(
          this.options['user'], this.options['key'], {filename: __filename},
          this.options,
          ('Something unexpected while trying to kill process. Error : ' +
           (e)));
      return fnCallback(e);
    }
  };

  /**
   * getTunnelName is used to get running tunnel name
   * @param {Function} fnCallback is a Callable function.
   * @return {string|null} Return name or null if any
   */
  this.getTunnelName = function(fnCallback) {
    if (typeof fnCallback !== 'function') {
      fnCallback = fnCallback || function() {};
    }
    // check tunnel status and Retry atmost 5 time to get tunnel name.We are
    // doing intentionlly because tunnel may take few times to start server
    if (this.isRunning()) {
      if (this.infoAPIPort) {
        _retryTunnelName(this, this.infoAPIPort, 5, fnCallback);
      } else {
        return fnCallback(null);
      }
    } else {
      console.log('Tunnel is not Running Currently');
      return fnCallback(null);
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
    // _addArguments method return formatted argumants or error if any.
    _addArguments(self, function(e, binaryArguments) {
      if (e) {
        logger.log(
            self.options['user'], self.options['key'], {filename: __filename},
            self.options,
            ('Getting this error while adding argument . Error : ' + (e)));
        return fnCallback(null, false);
      }
      // Run Binary with argumants in spawn process.
      self.proc = childProcess.spawn(self.binaryPath, binaryArguments);
      var isCallback = false;
      self.proc.stdout.pipe(split()).on('data', function(data) {
        if (!isCallback) {
          self.isProcessRunning = true;
          isCallback = true
          return fnCallback(null, true);
        }
      });

      self.proc.stderr.pipe(split()).on('data', function(data) {
        logger.log(
            self.options['user'], self.options['key'], {filename: __filename},
            self.options,
            ('We are getting this error while we are trying to spawning process. Error :  ' +
             (data)));
        self.isProcessRunning = false;
        if (!isCallback) {
          return fnCallback(null, false);
        }
      });

      // On exit if process is exit due to unable to start local Server then
      // Retry else log and exit
      self.proc.on('exit', function(code) {
        if (code && code === 10) {
          runBinary_(self, retries - 1, fnCallback);
        }
        logger.log(
            self.options['user'], self.options['key'], {filename: __filename},
            self.options,
            ('Getting this message while tunnel is being closed. Exit code is : ' +
             (code)));
        self.isProcessRunning = false;
        if (!isCallback) {
          return fnCallback(null, false);
        }
      });
    });

  } else {
    logger.log(
        self.options['user'], self.options['key'], {filename: __filename},
        self.options, 'Number of retries to run binary exceeded.');
    return fnCallback(null, false);
  }
}

/**
 * _verifyToken is used to Run Tunnel Binary
 * @param {Setting} options passed User argumants.
 * @param {Function} fnCallback is a Callable function.
 * @return {Object|Error} Return User Object or Error if any.
 */
function _verifyToken(options, fnCallback) {
  try {
    request.post(
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          url: AUTH_API_URL,
          body: JSON.stringify(
              {'username': options['user'], 'token': options['key']})
        },
        function(e, response, json) {
          if (e) {
            logger.log(
                options['user'], options['key'], {filename: __filename},
                options,
                ('We are getting this error while verifying user and key validity. Error : ' +
                 (e)));
            return fnCallback(true, e);
          } else {
            if (typeof json === 'string') {
              json = JSON.parse(json);
            }
            if (json && json.type === 'error') {
              logger.log(
                  options['user'], options['key'], {filename: __filename},
                  options,
                  ('Getting this issue while user is not valid' + (json)));
              return fnCallback(true, json);
            }
            return fnCallback(false, json);
          }
        });
  } catch (e) {
    logger.log(
        options['user'], options['key'], {filename: __filename}, options,
        ('Something unexpected while verifying the user and key validity. Error : ' +
         (e)));
    return fnCallback(true, e);
  }
};

/**
 * _killRunningProcess is used to Kill passed current Running process
 * @param {Tunnel} that is Current Tunnel Instance.
 * @param {Function} fnCallback is a Callable function.
 * @return {null|Error} Return null if killing of process is successful or Error
 *     if any.
 */
function _killRunningProcess(that, fnCallback) {
  // use try-catch as possibility of Error while killing process.
  try {
    // Check process is running before killing
    if (that.proc) {
      that.proc.on('exit', function() {
        return fnCallback();
      });
      that.proc.kill('SIGINT');
    } else {
      return fnCallback();
    }
  } catch (e) {
    logger.log(
        that.options['user'], that.options['key'], {filename: __filename},
        that.options,
        ('Getting error while killing the running process. Error : ' + (e)));
    return fnCallback(e);
  }
};

/**
 * _addArguments is used generate passed User argumants to formatted Argumants
 * as process is Required to Run
 * @param {Tunnel} self is Current Tunnel Instance.
 * @param {Function} fnCallback is a Callable function.
 * @return {Object|Error} Return Arguments Object or Error if any.
 */
function _addArguments(self, fnCallback) {
  try {
    var options = self.options;
    var binaryArgs = [];
    for (var key in options) {
      var value = options[key];
      if (key) {
        key = key.toLowerCase();
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
            binaryArgs.push(value);
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
            binaryArgs.push(value);
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
      }
    }
    // Get free port with max attempt (5)
    _getFreePort(options, 5, function(e, port) {
      if (typeof port === 'number') {
        binaryArgs.push('--infoAPIPort');
        binaryArgs.push(port);
        // add tunnel name with hostname and port.
        var tunnelNameIndex = binaryArgs.indexOf('--tunnelName');
        if (tunnelNameIndex === -1) {
          binaryArgs.push('--tunnelName');
          binaryArgs.push(os.hostname() + port);
        }
      }
      self.infoAPIPort = port;
      logger.log(
          options['user'], options['key'], {filename: __filename}, options,
          ('Info of passed tunnel arguments ' + (binaryArgs)));
      return fnCallback(false, binaryArgs);
    })
  } catch (e) {
    return fnCallback(true, e);
  }
};

/**
 * _getFreePort is used to find free port on your system
 * @param {Setting} options is User passed arguments.
 * @param {number} retries max attempt, retries to get port.
 * @param {Function} fnCallback is a Callable function.
 * @return {number|Error} Return Free Port or Error if any.
 */
function _getFreePort(options, retries, fnCallback) {
  try {
    getPort(function(e, port) {
      if (e) {
        if (retries >= 0) {
          _getFreePort(options, retries - 1, fnCallback);
        } else {
          logger.log(
              options['user'], options['key'], {filename: __filename}, options,
              ('Error trying to get Free Port on LambdaTest Tunnel' + e));
          throw Error(
              'Error trying to get Free Port on LambdaTest Tunnel, Please contact support' +
              e);
        }
      }
      return fnCallback(false, port);
    });
  } catch (e) {
    logger.log(
        options['user'], options['key'], {filename: __filename}, options,
        ('Error trying to get Free Port on LambdaTest Tunnel' + e));
    throw Error(
        'Error trying to get Free Port on LambdaTest Tunnel, Please contact support' +
        e);
  }
}

/**
 * _getBinaryPath is used for getting binary Path
 * @param {Tunnel} self is Current Tunnel Instance.
 * @param {Setting} options is User passed arguments.
 * @param {Function} fnCallback is a Callable function.
 * @return {string|Error} Return binary path or Error if any.
 */
function _getBinaryPath(that, options, fnCallback) {
  // if path is there then Return path else get from Server
  if (typeof (that.binaryPath) == 'undefined') {
    that.binary = new TunnelBinary();
    var conf = {user: options['user'], key: options['key']};
    // Do this for getting binary using Proxy.
    if ((options['proxyHost'] || options['proxyhost']) &&
        (options['proxyPort'] || options['proxyport'])) {
      conf.proxyHost = options['proxyHost'] || options['proxyhost'];
      conf.proxyPort = options['proxyPort'] || options['proxyport'];
    }
    that.binary.binaryPath_(conf, fnCallback);
  } else {
    return fnCallback(that.binaryPath);
  }
};

/**
 * _retryTunnelName is used to get Running Tunnel Name and Retries to get this
 * atmost 5 attempt.
 * @param {Tunnel} self is Current Tunnel Instance.
 * @param {number} infoAPIPort running local Server Port.
 * @param {number} retries max attempt, retries to get port.
 * @param {Function} fnCallback is a Callable function.
 * @return {string|null} Return tunnelName or null if any.
 */
function _retryTunnelName(self, infoAPIPort, retries, fnCallback) {
  try {
    var timeoutId = null;
    // Check whether max retries is reached ?.
    if (retries >= 0) {
      // local Server path for getting tunnelName
      var url = 'http://127.0.0.1:' + infoAPIPort + '/api/v1.0/info';
      request.get(url, function(e, response, json) {
        if (e) {
          logger.log(
              self.options['user'], self.options['key'], {filename: __filename},
              self.options,
              ('Getting error while trying to get the tunnel name from running local server. Error : ' +
               (e)));
          _clearTimeout(timeoutId);
          // wait 30s for next retries
          timeoutId = setTimeout(function() {
            _retryTunnelName(self, infoAPIPort, retries - 1, fnCallback);
          }, 30000);
        } else {
          // After successfully getting name clear the timeout and return name
          if (response.statusCode === 200) {
            _clearTimeout(timeoutId);
            if (typeof json === 'string') json = JSON.parse(json);
            return fnCallback((json.data && json.data.tunnelName) || null);
          } else {
            _clearTimeout(timeoutId);
            timeoutId = setTimeout(function() {
              _retryTunnelName(self, infoAPIPort, retries - 1, fnCallback);
            }, 30000);
          }
        }
      })
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      logger.log(
          self.options['user'], self.options['key'], {filename: __filename},
          self.options, 'Number of retries to to get tunnel name exceeded.');
      return fnCallback(null);
    }
  } catch (e) {
    logger.log(
        self.options['user'], self.options['key'], {filename: __filename},
        self.options,
        ('Something unexpected while trying to get tunnel name from local server. Error : ' +
         (e)));
    return fnCallback(null);
  }
}

/**
 * _clearTimeout is used to clear setTimeout method.
 * @param {string} timeoutId is setTimeout Instance.
 * @return {null} Return null.
 */
function _clearTimeout(timeoutId) {
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
}

module.exports = Tunnel;
