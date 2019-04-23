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

## Arguments

Every modifier except user and key is optional. Visit LambdaTest tunnel modifiers for an entire list of modifiers. Below are demonstration of some modifiers for your reference.

#### LambdaTest Basic Credentials

Below credentials will be used to perform basic authentication of your LambdaTest account.

- user (Username of your LambdaTest account)
- key (Access Key of your LambdaTest account)

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

#### Testing Local Folder

Populate the path of the local folder you want to test in your internal server as a value in the below modifier.

- dir/localdir/localdirectory : Path of the local folder you want to test

```js
tunnelArguments = {
  user: process.env.LT_USERNAME || "<lambdatest-user>",
  key: process.env.LT_ACCESS_KEY || "<lambdatest-accesskey>",
  dir: "<path of the local folder you want to test>"
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


#### Additional Arguments

Logfile
While executing the '-verbose' or '-v' argument, you can save the entire logs in a file. You can provide a specific path to this file. If you won't provide a path then the logs would be saved in your present working directory by the filename: tunnel.log. For providing a specific path use the below argument:

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
