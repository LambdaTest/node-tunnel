// Downloads and extracts the tunnel binary into a fresh dir, then spawns it immediately (as Tunnel.start does), N times.
var fs = require('fs'),
  os = require('os'),
  path = require('path'),
  childProcess = require('child_process'),
  TunnelBinary = require('../lib/tunnel_binary'),
  cfg = require('../lib/cfg/node-tunnel-config-v3-latest.json');

var runs = Number(process.argv[2]) || 10;
var failures = 0;

function once(i, done) {
  var tb = new TunnelBinary({ jsonResponse: cfg, logger: { log: function() {} } }, {});
  var dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lt-'));
  var timer = setTimeout(function() {
    done(new Error('timed out waiting for download/extract'));
  }, 120000);
  tb.download_({}, dir, 1, function(binaryPath) {
    clearTimeout(timer);
    var proc;
    try {
      proc = childProcess.spawn(binaryPath, ['--help'], { stdio: 'ignore' });
    } catch (e) {
      return done(e);
    }
    proc.on('error', done);
    proc.on('spawn', function() {
      proc.kill();
      done();
    });
  });
}

function next(i) {
  if (i > runs) {
    console.log('RESULT ' + (runs - failures) + '/' + runs + ' spawned ok');
    process.exit(failures ? 1 : 0);
  }
  once(i, function(err) {
    if (err) failures++;
    console.log('run ' + i + ': ' + (err ? 'FAIL ' + (err.code || err.message) : 'ok'));
    next(i + 1);
  });
}

next(1);
