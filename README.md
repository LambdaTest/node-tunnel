![LambdaTest Logo](https://www.lambdatest.com/static/images/logo.svg)

# LambdaTest Nodejs bindings for Tunnel 

[![Node Tunnel health check](https://github.com/LambdaTest/node-tunnel/actions/workflows/healthcheck.yml/badge.svg?branch=master)](https://github.com/LambdaTest/node-tunnel/actions/workflows/healthcheck.yml)

## Installation

```
npm i @lambdatest/node-tunnel
```

## Example

```js
var lambdaTunnel = require('@lambdatest/node-tunnel');

//Creates an instance of Tunnel
var tunnelInstance = new lambdaTunnel();

// Replace <lambdatest-user> with your user and <lambdatest-accesskey> with your key.
var tunnelArguments = {
  user: process.env.LT_USERNAME || '<lambdatest-user>',
  key: process.env.LT_ACCESS_KEY || '<lambdatest-accesskey>'
};

// Callback Style
// Atarts the Tunnel instance with the required arguments
tunnelInstance.start(tunnelArguments, function(error, status) {
  if (!error) {
    console.log('Tunnel is Running Successfully');
  }
});

// Promise Style
tunnelInstance
  .start(tunnelArguments)
  .then(status => {
    console.log('Tunnel is Running Successfully');
  })
  .catch(error => {
    console.log(error);
  });

// Async/Await Style
(async function() {
  try {
    const istunnelStarted = await tunnelInstance.start(tunnelArguments);
    console.log('Tunnel is Running Successfully');
  } catch (error) {
    console.log(error);
  }
})();
```

## Methods

#### tunnelInstance.start(tunnelArguments, callback)

Start tunnel Instance.

- `tunnelArguments`: credentials for secure tunnel connection.
  - `user`: The username for the LambdaTest account.
  - `key`: The accessKey for the LambdaTest account.
- `callback` (`function(error, status)`): A callback to invoke when the API call is
  complete.

```js
// Callback Style
tunnelInstance.start(tunnelArguments, function(error, status) {
  if (!error) {
    console.log('Tunnel is Running Successfully');
  }
});

// Promise Style
tunnelInstance
  .start(tunnelArguments)
  .then(status => {
    console.log('Tunnel is Running Successfully');
  })
  .catch(error => {
    console.log(error);
  });

// Async/Await Style
(async function() {
  try {
    const istunnelStarted = await tunnelInstance.start(tunnelArguments);
    console.log('Tunnel is Running Successfully');
  } catch (error) {
    console.log(error);
  }
})();
```

#### tunnelInstance.isRunning()

Get Status of tunnel Instance.

```js
// Callback Style
tunnelInstance.start(tunnelArguments, function(error, status) {
  if (!error) {
    console.log('Tunnel is Running Successfully');
    var tunnelRunningStatus = tunnelInstance.isRunning();
    console.log('Tunnel is Running ? ' + tunnelRunningStatus);
  }
});

// Promise Style
tunnelInstance
  .start(tunnelArguments)
  .then(status => {
    console.log('Tunnel is Running Successfully');
    const tunnelRunningStatus = tunnelInstance.isRunning();
    console.log('Tunnel is Running ? ' + tunnelRunningStatus);
  })
  .catch(error => {
    console.log(error);
  });

// Async/Await Style
(async function() {
  try {
    const istunnelStarted = await tunnelInstance.start(tunnelArguments);
    console.log('Tunnel is Running Successfully');
    const tunnelRunningStatus = tunnelInstance.isRunning();
    console.log('Tunnel is Running ? ' + tunnelRunningStatus);
  } catch (error) {
    console.log(error);
  }
})();
```

#### tunnelInstance.getTunnelName(callback)

Get name of the Running tunnel Instance.

- `callback` (`function(tunnelName)`): A callback to invoke when the API call is
  complete.

```js
// Callback Style
tunnelInstance.start(tunnelArguments, function(error, status) {
  if (!error) {
    console.log('Tunnel is Running Successfully');
    tunnelInstance.getTunnelName(function(tunnelName) {
      console.log('Tunnel Name : ' + tunnelName);
    });
  }
});

// Promise Style
tunnelInstance
  .start(tunnelArguments)
  .then(status => {
    console.log('Tunnel is Running Successfully');
    tunnelInstance.getTunnelName().then(tunnelName => {
      console.log('Tunnel Name : ' + tunnelName);
    });
  })
  .catch(error => {
    console.log(error);
  });

// Async/Await Style
(async function() {
  try {
    const istunnelStarted = await tunnelInstance.start(tunnelArguments);
    console.log('Tunnel is Running Successfully');
    const tunnelName = await tunnelInstance.getTunnelName();
    console.log('Tunnel Name : ' + tunnelName);
  } catch (error) {
    console.log(error);
  }
})();
```

#### tunnelInstance.stop(callback)

Stop the Running tunnel Instance.

- `callback` (`function(error, status)`): A callback to invoke when the API call is
  complete.

```js
// Callback Style
tunnelInstance.start(tunnelArguments, function(error, status) {
  if (!error) {
    console.log('Tunnel is Running Successfully');
    tunnelInstance.stop(function(error, status) {
      console.log('Tunnel is Stopped ? ' + status);
    });
  }
});

// Promise Style
tunnelInstance
  .start(tunnelArguments)
  .then(status => {
    console.log('Tunnel is Running Successfully');
    tunnelInstance.stop().then(status => {
      console.log('Tunnel is Stopped ? ' + status);
    });
  })
  .catch(error => {
    console.log(error);
  });

// Async/Await Style
(async function() {
  try {
    const istunnelStarted = await tunnelInstance.start(tunnelArguments);
    console.log('Tunnel is Running Successfully');
    const status = await tunnelInstance.stop();
    console.log('Tunnel is Stopped ? ' + status);
  } catch (error) {
    console.log(error);
  }
})();
```

## Arguments

Every modifier except user and key is optional. Visit LambdaTest <a href="https://www.lambdatest.com/support/docs/lambda-tunnel-modifiers/" target="_blank">tunnel modifiers</a> for an entire list of modifiers. Below are demonstration of some modifiers for your reference.

#### LambdaTest Basic Credentials

Below credentials will be used to perform basic authentication of your LambdaTest account.

- user (Username of your LambdaTest account)
- key (Access Key of your LambdaTest account)

### Port

If you wish to connect tunnel on a specific port.

- port : (optional) Local port to connect tunnel.

```js
tunnelArguments = {
  user: process.env.LT_USERNAME || '<lambdatest-user>',
  key: process.env.LT_ACCESS_KEY || '<lambdatest-accesskey>',
  port: '<port>'
};
```

#### Proxy

If you wish to perform tunnel testing using a proxy.

- proxyhost: Hostname/IP of proxy, this is a mandatory value.
- proxyport: Port for the proxy, by default it would consider 3128 if proxyhost is used For Basic Authentication, we use the below proxy options:
- proxyuser: Username for connecting to proxy, mandatory value for using 'proxypass'
- proxypass: Password for the USERNAME option.

```js
tunnelArguments = {
  user: process.env.LT_USERNAME || '<lambdatest-user>',
  key: process.env.LT_ACCESS_KEY || '<lambdatest-accesskey>',
  proxyHost: '127.0.0.1',
  proxyPort: '8000',
  proxyUser: 'user',
  proxyPass: 'password'
};
```

#### Tunnel Name

Human readable tunnel identifier

- tunnelName: (Name of the tunnel)

```js
tunnelArguments = {
  user: process.env.LT_USERNAME || '<lambdatest-user>',
  key: process.env.LT_ACCESS_KEY || '<lambdatest-accesskey>',
  tunnelName: '<your-tunnel-name>'
};
```

#### Testing Local Folder

Populate the path of the local folder you want to test in your internal server as a value in the below modifier.

- dir/localdir/localdirectory : Path of the local folder you want to test

```js
tunnelArguments = {
  user: process.env.LT_USERNAME || '<lambdatest-user>',
  key: process.env.LT_ACCESS_KEY || '<lambdatest-accesskey>',
  dir: '<path of the local folder you want to test>'
};
```

#### Enable Verbose Logging

To log every request to stdout.

- v/verbose : true or false

```js
tunnelArguments = {
  user: process.env.LT_USERNAME || '<lambdatest-user>',
  key: process.env.LT_ACCESS_KEY || '<lambdatest-accesskey>',
  v: true
};
```

#### Additional Arguments

Logfile
You can provide a specific path to this file. If you won't provide a path then the logs would be saved in your present working directory by the filename: tunnel.log. For providing a specific path use the below argument:

- logFile : path

```js
tunnelArguments = {
  user: process.env.LT_USERNAME || '<lambdatest-user>',
  key: process.env.LT_ACCESS_KEY || '<lambdatest-accesskey>',
  logFile: '/lambdatest/logs.txt'
};
```
- egressOnly:  Uses proxy settings only for outbound requests.
- ingressOnly: Uses proxy settings only for inbound requests.
- dns:         Comma separated list of dns servers
- sshConnType: Specify type of ssh connection (over_22, over_443, over_ws)
- mode:        Specifies in which mode tunnel should run [ssh,ws] 
- nows:        Force tunnel to run in non websocket mode
- mitm:        MITM mode, used for testing websites with private certificates

## Contribute

#### Reporting bugs

Our GitHub Issue Tracker will help you log bug reports.

Tips for submitting an issue:
Keep in mind, you don't end up submitting two issues with the same information. Make sure you add a unique input in every issue that you submit. You could also provide a "+1" value in the comments.

Always provide the steps to reproduce before you submit a bug.
Provide the environment details where you received the issue i.e. Browser Name, Browser Version, Operating System, Screen Resolution and more.
Describe the situation that led to your encounter with bug.
Describe the expected output, and the actual output precisely.

#### Pull Requests

We don't want to pull breaks in case you want to customize your LambdaTest experience. Before you proceed with implementing pull requests, keep in mind the following.
Make sure you stick to coding conventions.
Once you include tests, ensure that they all pass.
Make sure to clean up your Git history, prior your submission of a pull-request. You can do so by using the interactive rebase command for committing and squashing, simultaneously with minor changes + fixes into the corresponding commits.

## About LambdaTest

[LambdaTest](https://www.lambdatest.com/) is a cloud based selenium grid infrastructure that can help you run automated cross browser compatibility tests on 2000+ different browser and operating system environments. LambdaTest supports all programming languages and frameworks that are supported with Selenium, and have easy integrations with all popular CI/CD platforms. It's a perfect solution to bring your [selenium automation testing](https://www.lambdatest.com/selenium-automation) to cloud based infrastructure that not only helps you increase your test coverage over multiple desktop and mobile browsers, but also allows you to cut down your test execution time by running tests on parallel.
