Nodejs bindings for Tunnel.

## Installation

```
npm install @kanhaiyalalsingh/tunnel
```

## Example

```js
var lambdaTunnel = require('@kanhaiyalalsingh/tunnel');

//creates an instance of Tunnel
var tunnelInstance = new lambdaTunnel();

// replace <lambdatest-user> with your user and <lambdatest-accesskey> with your key.
var tunnelArguments = { 'user': '<lambdatest-user>', 'key': '<lambdatest-accesskey>' };

// starts the Tunnl instance with the required arguments
tunnelInstance.start(tunnelArguments, function(e, status) {
  if(!e) {
    console.log("Started Tunnel " + status);
  }
  // check if Tunnel instance is running
  console.log(tunnelInstance.isRunning());
});
```

## Arguments
Every modifier except key is optional. Visit LambdaTest local modifiers for an entire list of modifiers. Below are demonstration of some modifiers for your reference.

#### Enable Verbose Logging
```js
lt_local_args = { 'key': '<lambdatest-accesskey>', 'verbose': 'true' }
or
lt_local_args = { 'key': '<lambdatest-accesskey>', 'v': 'true' }
```

#### Testing Local Folder
Populate the path of the local folder you want to test in your internal server as a value in the below modifier
```js
lt_local_args = { 'key': '<lambdatest-accesskey>', 'f': '/my/awesome/folder'}
```
#### Force Start
For terminating all other local instances running on your LambdaTest account.
```js
lt_local_args = { 'key': '<lambdatest-accesskey>', 'force': 'true' }
```
#### Only Automate
Use the below modifier if you wish to run only Automation testing, and abort Real-time testing and Screenshot testing.
```js
lt_local_args = { 'key': '<lambdatest-accesskey>', 'onlyAutomate': 'true' }
or
lt_local_args = { 'key': '<lambdatest-accesskey>', 'onlyautomate': 'true' }
```
#### Force Local
Use the below modifier for routing all the traffic through your local machine.
```js
lt_local_args = { 'key': '<lambdatest-accesskey>', 'forceLocal': 'true' }
or 
lt_local_args = { 'key': '<lambdatest-accesskey>', 'forcelocal': 'true' }
```
#### Proxy
If you wish to perform local testing using a proxy.
proxyHost/proxyhost: Hostname/IP of proxy, this is a mandatory value.
proxyPort/proxyport: Port for the proxy, by default it would consider 3128 if -proxyHost is used
For Basic Authentication, we use the below proxy options:
proxyUser/proxyuser: Username for connecting to proxy, mandatory value for using proxyPass
proxyPass/proxypass: Password for the USERNAME option.
```js
lt_local_args = { 'key': '<lambdatest-accesskey>', 'proxyHost': '127.0.0.1', 'proxyPort': '8000', 'proxyUser': 'user', 'proxyPass': 'password' }
or
bs_local_args = { 'key': '<lambdatest-accesskey>', 'proxyhost': '127.0.0.1', 'proxyport': '8000', 'proxyuser': 'user', 'proxypass': 'password' }
```
#### Local Identifier
This identifier should be populated with a unique value when performing several tests on your locally hosted files simultaneously.
```js
lt_local_args = { 'key': '<lambdatest-accesskey>', 'localIdentifier': 'randomstring' }
```

## Additional Arguments

#### Binary Path
Local wrappers at LambdaTest, by default, will download & execute the latest version of Lambda Tunnel binary file in ~/.lambdatest or the present working directory or the tmp folder by order. However, if you wish to override these,then you can do so by passing the -binarypath argument. Below is the path where you would have to specify your local binary path -
```js
lt_local_args = { 'key': '<lambdatest-accesskey>', 'binarypath': '/lambdatest/LambdaTestLocal' }
or
lt_local_args = { 'key': '<lambdatest-accesskey>', 'binarypath': '/lambdatest/lambdatestlocal' }
```
#### Logfile
While executing the '-verbose' or '-v' argument, you can save the entire logs in a file. You can provide a specific path to this file. If you won't provide a path then the logs would be saved in your present working directory by the filename: local.log. For providing a specific path use the below argument:
```js
lt_local_args = { 'key': '<lambdatest-accesskey>', 'verbose': 'true', 'logFile': '/lambdatest/logs.txt' }
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
Make sure you stick to coding conventions.Once you include tests, ensure that they all pass.Make sure to clean up your Git history, prior your submission of a pull-request. You can do so by using the interactive rebase command for committing and squashing, simultaneously with minor changes + fixes into the corresponding commits.
