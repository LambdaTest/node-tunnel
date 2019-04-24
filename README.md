![LambdaTest Logo](https://www.lambdatest.com/static/images/logo.svg)

Nodejs bindings for Tunnel.

## Installation

```
npm i @lambdatest/node-tunnel
```

## Example

```js
var lambdaTunnel = require("@lambdatest/node-tunnel");

//creates an instance of Tunnel
var tunnelInstance = new lambdaTunnel();

// replace <lambdatest-user> with your user and <lambdatest-accesskey> with your key.
var tunnelArguments = {
  user: process.env.LT_USERNAME || "<lambdatest-user>",
  key: process.env.LT_ACCESS_KEY || "<lambdatest-accesskey>"
};

// starts the Tunnl instance with the required arguments
tunnelInstance.start(tunnelArguments, function(error, status) {
  if (!error) {
    console.log("Started Tunnel " + status);
    // check if Tunnel instance is running
    console.log(tunnelInstance.isRunning());
    tunnelInstance.getTunnelName(function(tunnelName) {
      console.log("Tunnel Name : " + tunnelName);
    });
  }
});
```

## Methods

#### tunnelInstance.stop(callback)

Stop the Running tunnel Instance.

- `callback` (`function(error, status)`): A callback to invoke when the API call is
complete.

```js
tunnelInstance.start(tunnelArguments, function(error, status) {
  if (!error) {
    // Do whatever you want..
    tunnelInstance.stop(function(error, status) {
      console.log("Tunnel is Stpooed ? " + status);
    });
  }
});
```

#### tunnelInstance.getTunnelName(callback)

Get name of the Running tunnel Instance.

- `callback` (`function(tunnelName)`): A callback to invoke when the API call is
complete.

```js
tunnelInstance.start(tunnelArguments, function(error, status) {
  if (!error) {
    tunnelInstance.getTunnelName(function(tunnelName) {
      console.log("Tunnel Name : " + tunnelName);
    });
  }
});
```

#### tunnelInstance.isRunning()

Get Running Status of tunnel Instance.

```js
tunnelInstance.start(tunnelArguments, function(error, status) {
  if (!error) {
    var tunnelRunningStatus = tunnelInstance.isRunning();
    console.log("Tunnel is Running ? " + tunnelRunningStatus);
  }
});
```

## Arguments

Every modifier except user and key is optional. Visit LambdaTest tunnel modifiers for an entire list of modifiers. Below are demonstration of some modifiers for your reference.

#### LambdaTest Basic Credentials

Below credentials will be used to perform basic authentication of your LambdaTest account.

- user (Username of your LambdaTest account)
- key (Access Key of your LambdaTest account)

### Port

If you wish to connect tunnel on a specific port.

- port : (optional) Local port to connect tunnel.

```js
tunnelArguments = {
  user: process.env.LT_USERNAME || "<lambdatest-user>",
  key: process.env.LT_ACCESS_KEY || "<lambdatest-accesskey>",
  port: "<port>"
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
  user: process.env.LT_USERNAME || "<lambdatest-user>",
  key: process.env.LT_ACCESS_KEY || "<lambdatest-accesskey>",
  proxyHost: "127.0.0.1",
  proxyPort: "8000",
  proxyUser: "user",
  proxyPass: "password"
};
```

#### Tunnel Name

Human readable tunnel identifier

- tunnelName: (Name of the tunnel)

````js
tunnelArguments = {
  user: process.env.LT_USERNAME || "<lambdatest-user>",
  key: process.env.LT_ACCESS_KEY || "<lambdatest-accesskey>",
  tunnelName: "<your-tunnel-name>"
};

#### Testing Local Folder

Populate the path of the local folder you want to test in your internal server as a value in the below modifier.

- dir/localdir/localdirectory : Path of the local folder you want to test

```js
tunnelArguments = {
  user: process.env.LT_USERNAME || "<lambdatest-user>",
  key: process.env.LT_ACCESS_KEY || "<lambdatest-accesskey>",
  dir: "<path of the local folder you want to test>"
};
````

#### Testing With Tunnel On Different Environments

Use this modifier to specify whether you wish to perform test on LambdaTest production environment or stage environment.

- env/environment: stage or production

```js
tunnelArguments = {
  user: process.env.LT_USERNAME || "<lambdatest-user>",
  key: process.env.LT_ACCESS_KEY || "<lambdatest-accesskey>",
  env: "<stage/production>"
};
```

#### Enable Verbose Logging

To log every request to stdout.

- v/verbose : true or false

```js
tunnelArguments = {
  user: process.env.LT_USERNAME || "<lambdatest-user>",
  key: process.env.LT_ACCESS_KEY || "<lambdatest-accesskey>",
  v: true
};
```

#### Connect Configuration File With Lambda Tunnel

Below modifier is used to connect a config file with an SSH Tunnel provided by LambdaTest.

- configfile/conffile/configurationfile : Local path to a YAML file

```js
tunnelArguments = {
  user: process.env.LT_USERNAME || "<lambdatest-user>",
  key: process.env.LT_ACCESS_KEY || "<lambdatest-accesskey>",
  configfile: "<Local path to a YAML file>"
};
```

#### Share Tunnel With Teammates

Below modifier is used for sharing an SSH tunnel connection between your colleagues.

- shared-tunnel/sharedtunnel: true or false

```js
tunnelArguments = {
  user: process.env.LT_USERNAME || "<lambdatest-user>",
  key: process.env.LT_ACCESS_KEY || "<lambdatest-accesskey>",
  sharedtunnel: true
};
```

Note: If an admin shares a tunnel then it would be visible to every team member.

#### Specify Domains To Route Through Tunnel

Below modifier is used to route the Lambda Tunnel through a specific domain.
Note: Separate your values with comma, and do not use and spaces. For example, mydomain.com,lambdatest.com,mysite.com, instead of mydomain.com, lambdatest.com, mysite.com
Another key thing to note would be to use only the domain name without preceeding it with http: or https: or anything else.

- local-domains/localdomains : domain1.com , domain2.com , domain3.com

```js
tunnelArguments = {
  user: process.env.LT_USERNAME || "<lambdatest-user>",
  key: process.env.LT_ACCESS_KEY || "<lambdatest-accesskey>",
  localdomains: "<domain1.com, domain2.com, domain3.com>"
};
```

#### Print JSON Configuration

Below modifier is used for printing JSON configurations to stdout. The value of this flag is to be understood by LambdaTest Jenkins plugin and is irrelavant to an end-user.

- output-config/outputconfiguration/outputconf/outputconfig : true or false

```js
tunnelArguments = {
  user: process.env.LT_USERNAME || "<lambdatest-user>",
  key: process.env.LT_ACCESS_KEY || "<lambdatest-accesskey>",
  outputconf: true
};
```

#### Specify DNS(Domain Name System)

Below modifier is used for specifying a DNS. To specify multiple DNS use comma separated format without spaces along with IP addresses. You may specify a port number with an IP address if you like.

- dns : <server[,server..]>

```js
tunnelArguments = {
  user: process.env.LT_USERNAME || "<lambdatest-user>",
  key: process.env.LT_ACCESS_KEY || "<lambdatest-accesskey>",
  dns: "<server[,server..]>"
};
```

#### Process ID For A Tunnel Process

Specify a file wherein you would wish to write the process ID of Lambda Tunnel. This would be help you to stop Lambda Tunnel programatically. When you terminate your SSH connection through Lambda Tunnel then there may be times where the pidfile may not be removed along with the termination of the SSH connection.

- pidfile : <file>

```js
tunnelArguments = {
  user: process.env.LT_USERNAME || "<lambdatest-user>",
  key: process.env.LT_ACCESS_KEY || "<lambdatest-accesskey>",
  pidfile: "<file>"
};
```

#### Proxy Autoconfiguration File

Can be a http(s) or localfile:// URL. https://findproxyforurl.com/example-pac-file/ Absolute paths are required when specifying a local PAC file (EG. file:///Users/Andrew/Desktop/MyPac.pac).

- pac : <URL>

```js
tunnelArguments = {
  user: process.env.LT_USERNAME || "<lambdatest-user>",
  key: process.env.LT_ACCESS_KEY || "<lambdatest-accesskey>",
  pac: "<URL>"
};
```

#### Additional Arguments

Logfile
You can provide a specific path to this file. If you won't provide a path then the logs would be saved in your present working directory by the filename: tunnel.log. For providing a specific path use the below argument:

- logFile : path

```js
tunnelArguments = {
  user: process.env.LT_USERNAME || "<lambdatest-user>",
  key: process.env.LT_ACCESS_KEY || "<lambdatest-accesskey>",
  logFile: "/lambdatest/logs.txt"
};
```

## Contribute

#### Reporting bugs

Our GitHub Issue Tracker will help you log bug reports.

Tips for submitting an issue:
Keep in mind, you don't end up submitting two issues with the same information. Make sure you add a unique input in every issue that you submit. You could also provide a "+1" value in the comments.

Always provide the steps to reproduce before you submit a bug.
Provide the environment details where you recieved the issue i.e. Browser Name, Browser Version, Operating System, Screen Resolution and more.
Describe the situation that led to your encounter with bug.
Describe the expected output, and the actual output precisely.

#### Pull Requests

We don't want to pull breaks in case you want to customize your LambdaTest experience. Before you proceed with implementing pull requests, keep in mind the following.
Make sure you stick to coding conventions.
Once you include tests, ensure that they all pass.
Make sure to clean up your Git history, prior your submission of a pull-request. You can do so by using the interactive rebase command for committing and squashing, simultaneously with minor changes + fixes into the corresponding commits.
