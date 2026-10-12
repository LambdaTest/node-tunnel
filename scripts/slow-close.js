// Preload that delays closing the extracted LT binary by 800ms, mimicking real-time AV scan-on-close on Windows.
var fs = require('fs');
var binaryFds = {};
var origOpen = fs.open;
var origClose = fs.close;

fs.open = function(file) {
  var args = Array.prototype.slice.call(arguments);
  var cb = args[args.length - 1];
  args[args.length - 1] = function(err, fd) {
    if (!err && /[\\/]LT(\.exe)?$/.test(String(file))) binaryFds[fd] = true;
    cb(err, fd);
  };
  return origOpen.apply(fs, args);
};

fs.close = function(fd, cb) {
  if (binaryFds[fd]) {
    delete binaryFds[fd];
    return setTimeout(function() {
      origClose.call(fs, fd, cb);
    }, 800);
  }
  return origClose.apply(fs, arguments);
};
