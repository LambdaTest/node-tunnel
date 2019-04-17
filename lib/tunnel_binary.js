var https = require('https'), logger = require('./logger'),
    request = require('request'), unzip = require('unzip'), fs = require('fs'),
    path = require('path'), os = require('os'),
    httpHashPath = 'https://downloads.lambdatest.com/tunnel/linux/latest',
    localHashFilename = 'linux.txt';
/**
 * TunnelBinary is a function based Class.
 */
function TunnelBinary() {
  /**
   * Try to find out binary based on platform arch.
   */
  this.hostOS = process.platform;
  this.is64bits = process.arch === 'x64';
  if (this.hostOS.match(/darwin|mac os/i)) {
    this.httpPath = 'https://downloads.lambdatest.com/tunnel/mac/LT_Mac.zip';
    this.binaryName = 'LT_Mac.zip';
    httpHashPath = 'https://downloads.lambdatest.com/tunnel/mac/latest';
    localHashFilename = 'mac.txt';
  } else if (this.hostOS.match(
                 /mswin|msys|mingw|cygwin|bccwin|wince|emc|win32/i)) {
    this.windows = true;
    this.httpPath =
        'https://downloads.lambdatest.com/tunnel/windows/LT_Windows.zip';
    this.binaryName = 'LT_Windows.zip';
    httpHashPath = 'https://downloads.lambdatest.com/tunnel/windows/latest';
    localHashFilename = 'windows.txt';
  } else {
    if (this.is64bits) {
      this.httpPath =
          'https://downloads.lambdatest.com/tunnel/linux/LT_Linux.zip';
      this.binaryName = 'LT_Linux.zip';
    } else {
      this.httpPath =
          'https://downloads.lambdatest.com/tunnel/linux/LT_Linux.zip';
      this.binaryName = 'LT_Linux.zip';
    }
    httpHashPath = 'https://downloads.lambdatest.com/tunnel/linux/latest';
    localHashFilename = 'linux.txt';
  }

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
  this.retryBinaryDownload_ = function(
      conf, destParentDir, retries, binaryPath, fnCallback) {
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
      // make Dir if not there.
      if (!this.checkPath_(destParentDir)) {
        fs.mkdirSync(destParentDir);
      }
      // Generate binary path.
      var binaryPath = path.join(destParentDir, this.binaryName);

      var self = this;
      // Set Proxy If User passed this to in arguments.
      var pathConfig = {url: this.httpPath};
      if (conf.proxyHost && conf.proxyPort) {
        pathConfig.proxy = conf.proxyHost + ':' + conf.proxyPort;
      }
      // Get binary as zip File from https Server and put this to local folder.
      // After fully download, unzip and change mode to excutable.
      request.get(pathConfig)
          .pipe(fs.createWriteStream(binaryPath))
          .on('close', function() {
            if (self.checkPath_(binaryPath)) {
              var destBinaryName = this.windows ? 'LT.exe' : 'LT';
              var destBinaryPath = path.join(destParentDir, destBinaryName);

              if (self.checkPath_(destBinaryPath)) {
                fs.unlinkSync(destBinaryPath);
              }
              // Reading and Unzipping binary zip File
              fs.createReadStream(binaryPath)
                  .pipe(unzip.Extract({path: destParentDir}))
                  .on('error',
                      function(e) {
                        logger.log(
                            conf['user'], conf['key'], {filename: __filename},
                            conf,
                            'Got Error while unzip downloading binary' + e);
                        self.retryBinaryDownload_(
                            conf, destParentDir, retries, binaryPath,
                            fnCallback);
                      })
                  .on('close', function() {
                    fs.chmod(destBinaryPath, '0755', function() {
                      return fnCallback(destBinaryPath);
                    });
                  });
            } else {
              console.error('Got Error while downloading binary zip');
              logger.log(
                  conf['user'], conf['key'], {filename: __filename}, conf,
                  'Got Error while downloading binary zip');
              self.retryBinaryDownload_(
                  conf, destParentDir, retries, binaryPath, fnCallback);
            }
          });
    } catch (e) {
      console.error('Got Error while downloading binary zip');
      logger.log(
          conf['user'], conf['key'], {filename: __filename}, conf,
          {message: 'Got Error while Extracting binary zip', e: e});
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
      var destBinaryName = this.windows ? 'LT.exe' : 'LT';
      var binaryPath = path.join(destParentDir, destBinaryName);
      var localHashPath = path.join(destParentDir, localHashFilename);
      // Check whether executable binary File is exist or need to Downlaod.
      if (this.checkPath_(binaryPath, fs.X_OK)) {
        var that = this;
        // Fetching Hash content for comparing with local hash to find out
        // binary changes.
        this.fetchHash_(conf, 5, function(httpHashContents) {
          // Check for local Hash File exist . If not there create and update
          // with newly hash content and Start to download else return
          // binaryPath
          if (!that.checkPath_(localHashPath)) {
            var writeStream = fs.createWriteStream(localHashPath);
            writeStream.write(httpHashContents);
            writeStream.end();
            that.download_(conf, destParentDir, 5, fnCallback);
          } else {
            var localHashContents = fs.readFileSync(localHashPath, 'utf8');
            localHashContents = localHashContents.trim();
            if (httpHashContents === localHashContents) {
              return fnCallback(binaryPath);
            } else {
              fs.writeFileSync(localHashPath, httpHashContents);
              that.download_(conf, destParentDir, 5, fnCallback);
            }
          }
        });
      } else {
        this.download_(conf, destParentDir, 5, fnCallback);
      }
    } catch (e) {
      console.log(e);
      logger.log(conf['user'], conf['key'], {filename: __filename}, conf, e);
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
      if (typeof fs.accessSync !== 'undefined') return false;
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
    for (var i = 0; i < orderedPathLength; i++) {
      var path = this.orderedPaths[i];
      if (this.makePath_(path)) {
        return path;
      }
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
        fs.mkdirSync(path);
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
      return (
          home ||
          (process.getuid() === 0 ? '/root' : user ? '/home/' + user : null));
    }

    return home || null;
  };

  /**
   * fetchHash_ fetching hash content from https Server.
   * @param {!Setting} conf passed arguments by User
   * @param {number} retries max tries for download hash.
   * @return {string|Error} Return hash content or Error
   */
  this.fetchHash_ = function(conf, retries, fnCallback) {
    try {
      var that = this;
      if (retries >= 0) {
        var httpHashContents = '';
        https
            .get(
                httpHashPath,
                function(response) {
                  response.on('error', function(e) {
                    console.error('Got Error in binary download response', e);
                    logger.log(
                        conf['user'], conf['key'], {filename: __filename}, conf,
                        e);
                    that.fetchHash_(conf, retries - 1, fnCallback);
                  });
                  response.on('data', function(chunk) {
                    httpHashContents += chunk;
                  });
                  response.on('end', () => {
                    httpHashContents = httpHashContents.trim();
                    return fnCallback(httpHashContents);
                  });
                })
            .on('error', function(e) {
              console.error('Got Error in hash downloading request', e);
              logger.log(
                  conf['user'], conf['key'], {filename: __filename}, conf, e);
              that.fetchHash_(conf, retries - 1, fnCallback);
            });
      } else {
        console.error('Number of retries to download hash exceeded.');
        logger.log(
            conf['user'], conf['key'], {filename: __filename}, conf,
            'Number of retries to download hash exceeded.');
        throw Error(
            'Error trying to download hash. Please reinstall this newly updated package');
      }
    } catch (e) {
      logger.log(conf['user'], conf['key'], {filename: __filename}, conf, e);
      throw Error(
          'Error trying to download hash. Please reinstall this newly updated package');
    }
  };

  this.orderedPaths =
      [path.join(this.homeDir_(), '.lambdatest'), process.cwd(), os.tmpdir()];
}

module.exports = TunnelBinary;
