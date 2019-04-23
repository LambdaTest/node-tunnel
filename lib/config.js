module.exports = {
  elk: {
    ELK_HOST:
      "https://search-kinesis-ingestion-stage-temp-wlmuadurdfgvyhvjjvhlfzr36u.us-east-1.es.amazonaws.com",
    ELK_INDEX: "npm-tunnel",
    ELK_TYPE: "logs",
    level: "info",
    indexSuffixPattern: "DD-MM-YYYY"
  },
  tunnelBinary: {
    mac: {
      httpPath: "https://downloads.lambdatest.com/tunnel/mac/LT_Mac.zip",
      binaryName: "LT_Mac.zip",
      httpHashPath: "https://downloads.lambdatest.com/tunnel/mac/latest",
      localHashFilename: "mac.txt"
    },
    win: {
      httpPath:
        "https://downloads.lambdatest.com/tunnel/windows/LT_Windows.zip",
      binaryName: "LT_Windows.zip",
      httpHashPath: "https://downloads.lambdatest.com/tunnel/windows/latest",
      localHashFilename: "windows.txt"
    },
    linux: {
      httpPath: "https://downloads.lambdatest.com/tunnel/linux/LT_Linux.zip",
      binaryName: "LT_Linux.zip",
      httpHashPath: "https://downloads.lambdatest.com/tunnel/linux/latest",
      localHashFilename: "linux.txt"
    }
  },
  AuthUrl: "https://accounts.lambdatest.com/api/user/token/auth",
  version: require("./../package.json").version
};
