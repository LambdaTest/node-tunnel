declare module "@lambdatest/node-tunnel" {
    interface Options {
      user: string;
      key: string;
      port: string;
      tunnelName: string;
      proxyHost: string;
      proxyPort: string;
      proxyUser: string;
      proxyPass: string;
      localDir: string;
      environment: boolean;
      verbose: string;
      configFile: string;
      sharedTunnel: string;
      localDomains: string;
      outputConfig: string;
      dns: string;
      pidFile: string;
      pac: string;
      logFile: string;
      controller: string;
      [key: string]: string | boolean;
    }
  
    class Tunnel {
      start(options: Partial<Options>, callback: (error?: Error) => void): void;
      isRunning(): boolean;
      stop(callback: (status: boolean, error?: Error) => void): Promise<void>;
    }
  }
  