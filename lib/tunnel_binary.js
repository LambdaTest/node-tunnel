var localTunnelConfig_ = require('./cfg/node-tunnel-config-v3-latest.json'),
  logger,
  https = require('https'),
  urlParse = require('url'),
  HttpsProxyAgent = require('https-proxy-agent'),
  util = require('./util'),
  unzip = require('unzipper'),
  fs = require('fs'),
  path = require('path'),
  os = require('os'),
  executableName = 'LT';
/**
 * TunnelBinary is a function based Class.
 */
function TunnelBinary(httpTunnelConfig, options) {
  /**
   * Try to find out binary based on platform arch.
   */
  this.binaryVersion = 'v3';
  // if (options['legacy']) {
  //   this.binaryVersion = 'v2';
  //   executableName = 'ltcomponent';
  // }
  this.httpTunnelConfig = httpTunnelConfig;
  this.hostOS = process.platform;
  this.bits = process.arch === 'x64' || process.arch === 'arm64' ? '64bit' : '32bit';
  if (this.hostOS.match(/darwin|mac os/i)) {
    this.platform = 'mac';
  } else if (this.hostOS.match(/mswin|msys|mingw|cygwin|bccwin|wince|emc|win32/i)) {
    this.platform = 'win';
    this.windows = true;
  } else if (this.hostOS.match(/freebsd/i)) {
    this.platform = 'freebsd';
  } else {
    this.platform = 'linux';
  }
  this.httpPath = this.httpTunnelConfig.jsonResponse.binaryLinks[this.platform][this.binaryVersion][
    this.bits
  ].httpPath;
  this.binaryName = this.httpTunnelConfig.jsonResponse.binaryLinks[this.platform][
    this.binaryVersion
  ][this.bits].binaryName;
  this.httpHashContents = this.httpTunnelConfig.jsonResponse.binaryLinks[this.platform][
    this.binaryVersion
  ][this.bits].hash;
  this.localHashContents =
    localTunnelConfig_.binaryLinks[this.platform][this.binaryVersion][this.bits].hash;
  logger = this.httpTunnelConfig.logger;

  /**
   * retryBinaryDownload_ is used to download binary while getting Error duing
   * download.
   * @param {!Setting} conf is command line argumants passed during Initialize
   *     the Tunnel
   * @param {Object} destParentDir is home Dir for Downloaded binary e.g.
   *     `.lambdatest`.
   * @param {number} retries max tries for download.
   * @param {number} binaryPath path of downloaded binary.
   * @param {Function} fnCallback is a Callable function.
   * @return {Method<download_>|Error} Return download_ method or Error of max
   *     count Exceeded.
   */
  this.retryBinaryDownload_ = function(conf, destParentDir, retries, binaryPath, fnCallback) {
    var self = this;
    if (retries > 0) {
      console.log('Retrying Download. Retries left', retries);
      fs.stat(binaryPath, function(e) {
        if (!e) {
          fs.unlinkSync(binaryPath);
        }
        self.download_(conf, destParentDir, retries - 1, fnCallback);
      });
    } else {
      console.error('Number of retries to download exceeded.');
    }
  };

  /**
   * download_ is used to download binary as zip File.
   * @param {!Setting} conf is command line argumants passed during Initialize
   *     the Tunnel
   * @param {Object} destParentDir is home Dir for Downloaded binary e.g.
   *     `.lambdatest`.
   * @param {number} retries max tries for download.
   * @param {Function} fnCallback is a Callable function.
   * @return {string|Error} Return BinaryPath or Error while Extraction Failed.
   */
  this.download_ = function(conf, destParentDir, retries, fnCallback) {
    try {
      console.log(`Downloading latest binary`);
      // make Dir if not there.
      if (this.checkPath_(destParentDir)) {
        this.rmDir(destParentDir);
      }
      fs.mkdirSync(destParentDir, { recursive: true });
      // Generate binary path.
      var binaryPath = path.join(destParentDir, this.binaryName);
      var fileStream = fs.createWriteStream(binaryPath);
      var self = this;
      // Set Proxy If User passed this to in arguments.
      var options = urlParse.parse(this.httpPath);
      var proxyOpts = util.getProxyOpts_(conf);
      if (Object.keys(proxyOpts).length) {
        options.agent = new HttpsProxyAgent(proxyOpts);
      }
      // Get binary as zip File from https Server and put this to local folder.
      // After fully download, unzip and change mode to excutable.
      https
        .get(options, function(response) {
          response.pipe(fileStream);
          response.on('error', function(e) {
            logger.log(
              conf['user'],
              conf['key'],
              { filename: __filename },
              conf,
              'Got Error while unzip downloading binary' + e
            );
            self.retryBinaryDownload_(conf, destParentDir, retries, binaryPath, fnCallback);
          });
          fileStream.on('error', function(e) {
            logger.log(
              conf['user'],
              conf['key'],
              { filename: __filename },
              conf,
              'Got Error while unzip downloading binary' + e
            );
            self.retryBinaryDownload_(conf, destParentDir, retries, binaryPath, fnCallback);
          });
          fileStream.on('close', function() {
            if (self.checkPath_(binaryPath)) {
              var unzipBinaryPath = path.join(destParentDir, executableName);
              var destBinaryName = executableName;
              if (self.windows) {
                destBinaryName += '.exe';
              }
              var destBinaryPath = path.join(destParentDir, destBinaryName);
              // Reading and Unzipping binary zip File
              console.log(`Extracting binary`);
              fs.createReadStream(binaryPath)
                .pipe(unzip.Extract({ path: destParentDir }))
                .on('error', function(e) {
                  console.log("Error log ------> ", e);
                  logger.log(
                    conf['user'],
                    conf['key'],
                    { filename: __filename },
                    conf,
                    'Got Error while unzip downloading binary' + e
                  );
                  self.retryBinaryDownload_(conf, destParentDir, retries, binaryPath, fnCallback);
                })
                .on('close', function() {
                  // Throw error Error: spawn ETXTBSY sometime. As unzip completion not release binary file.
                  setTimeout(function() {
                    fs.rename(unzipBinaryPath, destBinaryPath, function(err) {
                      if (err) console.error('Got Error while rename binary zip', err);
                      fs.chmod(destBinaryPath, '0755', function() {
                        return fnCallback(destBinaryPath);
                      });
                    });
                  }, 1000);
                });
            } else {
              console.error('Got Error while downloading binary zip');
              logger.log(
                conf['user'],
                conf['key'],
                { filename: __filename },
                conf,
                'Got Error while downloading binary zip'
              );
              self.retryBinaryDownload_(conf, destParentDir, retries, binaryPath, fnCallback);
            }
          });
        })
        .on('error', function(e) {
          logger.log(
            conf['user'],
            conf['key'],
            { filename: __filename },
            conf,
            'Got Error while unzip downloading binary' + e
          );
          self.retryBinaryDownload_(conf, destParentDir, retries, binaryPath, fnCallback);
        });
    } catch (e) {
      console.error('Got Error while downloading binary zip', e);
      logger.log(conf['user'], conf['key'], { filename: __filename }, conf, {
        message: 'Got Error while Extracting binary zip',
        e: e
      });
    }
  };

  /**
   * binaryPath_ is used to find Executable binary File Path.
   * @param {!Setting} conf is command line argumants passed during Initialize
   *     the Tunnel
   * @param {Function} fnCallback is a Callable function.
   * @return {string|Error} Return BinaryPath or Error.
   */
  this.binaryPath_ = function(conf, fnCallback) {
    try {
      var destParentDir = this.availableDirs_();
      var destBinaryName = executableName;
      if (this.windows) {
        destBinaryName += '.exe';
      }
      var binaryPath = path.join(destParentDir, destBinaryName);
      // Check whether executable binary File is exist or need to Downlaod.
      if (this.checkPath_(binaryPath, fs.X_OK) && !process.env.LT_FORCE_DOWNLOAD) {
        var that = this;
        console.log(`Checking for updates`);
        // Comparing with local hash to find out binary changes.
        if (this.httpHashContents === this.localHashContents) {
          console.log(`Binary already at latest version`);
          return fnCallback(binaryPath);
        } else {
          console.log(`Binary is deprecated`);
          try {
            fs.writeFileSync(
              __dirname + '/cfg/node-tunnel-config-v3-latest.json',
              JSON.stringify(this.httpTunnelConfig.jsonResponse)
            );
          } catch (e) {
            console.log(
              'Permission denied! Please execute the command using sudo or provide the required read & write permissions to file : ',
              __dirname + '/cfg/node-tunnel-config-v3-latest.json'
            );
            throw e;
          }
          localTunnelConfig_ = this.httpTunnelConfig.jsonResponse;
          that.download_(conf, destParentDir, 5, fnCallback);
        }
      } else {
        delete process.env.LT_FORCE_DOWNLOAD;
        this.download_(conf, destParentDir, 5, fnCallback);
      }
    } catch (e) {
      logger.log(conf['user'], conf['key'], { filename: __filename }, conf, e);
    }
  };

  /**
   * binaryPath_ is used for verifying exist of File.
   * @param {!string} path is File path
   * @param {!string} mode is File mode
   * @return {boolean}
   */
  this.checkPath_ = function(path, mode) {
    try {
      mode = mode || fs.R_OK | fs.W_OK;
      fs.accessSync(path, mode);
      return true;
    } catch (e) {
      console.log('Error checkPath ----->', e);
      if (typeof fs.accessSync !== 'undefined') {
        return false;
      }
      try {
        fs.statSync(path);
        return true;
      } catch (e) {
        return false;
      }
    }
  };

  /**
   * availableDirs_ Check whether ordered Dir is priviledged for creation.
   * @return {string} Dir that has Required priviledge for creation of Dir.
   */
  this.availableDirs_ = function() {
    var orderedPathLength = this.orderedPaths.length;
    var _path,
      iCounter = 0;
    for (var i = 0; i < orderedPathLength; i++) {
      iCounter++;
      _path = this.orderedPaths[i];
      if (this.makePath_(_path)) {
        break;
      }
    }
    if (iCounter < orderedPathLength) {
      return _path;
    }
    throw Error('Error trying to download LambdaTest Tunnel binary');
  };

  /**
   * makePath_ Make Dir if not there.
   * @return {boolean} Dir is Created or not.
   */
  this.makePath_ = function(path) {
    try {
      if (!this.checkPath_(path)) {
        fs.mkdirSync(path, { recursive: true });
      }
      return true;
    } catch (e) {
      return false;
    }
  };

  /**
   * homeDir_ Find out home Dir of Platform.
   * @return {string|null} home Dir or null.
   */
  this.homeDir_ = function() {
    if (typeof process.cwd === 'function') return process.cwd();
    if (typeof os.homedir === 'function') return os.homedir();

    var env = process.env;
    var home = env.HOME;
    var user = env.LOGNAME || env.USER || env.LNAME || env.USERNAME;

    if (process.platform === 'win32') {
      return env.USERPROFILE || env.HOMEDRIVE + env.HOMEPATH || home || null;
    }

    if (process.platform === 'darwin') {
      return home || (user ? '/Users/' + user : null);
    }

    if (process.platform === 'linux') {
      return home || (process.getuid() === 0 ? '/root' : user ? '/home/' + user : null);
    }

    return home || null;
  };

  /**
   * rmDir remove directory and sub-directory.
   */
  this.rmDir = function(dir) {
    var self = arguments.callee;
    if (fs.existsSync(dir)) {
      fs.readdirSync(dir).forEach(function(file) {
        var C = dir + '/' + file;
        if (fs.statSync(C).isDirectory()) self(C);
        else fs.unlinkSync(C);
      });
      fs.rmdirSync(dir);
    }
  };
  this.orderedPaths = [
    path.join(this.homeDir_(), '.lambdatest', this.binaryVersion),
    path.join(process.cwd(), this.binaryVersion),
    path.join(os.tmpdir(), this.binaryVersion)
  ];
}

module.exports = TunnelBinary;
