/**
 * logger Class to logging tunnel log to ELK for debugging purpose.
 */
var elasticsearch = require("elasticsearch"),
  Config = require('./config'),
  ELK_HOST = Config.elk.ELK_HOST,
  ELK_INDEX = Config.elk.ELK_INDEX,
  ELK_TYPE = Config.elk.ELK_TYPE,
  winston = require("winston"),
  Elasticsearch = require("winston-elasticsearch"),
  client = new elasticsearch.Client({ host: ELK_HOST }),
  esTransportOpts = {
    level: Config.elk.level,
    indexPrefix: ELK_INDEX,
    indexSuffixPattern: Config.elk.indexSuffixPattern,
    client: client,
    messageType: ELK_TYPE
  },
  logger;
module.exports = {
  log: function(username, key, meta, arguments, msg) {
    try {
      if(!logger) {
        logger = winston.createLogger({
          transports: [new Elasticsearch(esTransportOpts)]
        });
      }
      if (typeof msg !== "string") {
        msg = JSON.stringify(msg);
      }
      if (typeof meta === "object") {
        meta.platform = process.platform;
        meta.arch = process.arch;
        meta.version = Config.version;
      }
      logger.info("Some message", { username : username, key: key, meta: meta, arguments: arguments, msg: msg });
    } catch (e) {}
  }
};
