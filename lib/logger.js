/**
 * logger Class to logging tunnel log to ELK for debugging purpose.
 */
var elasticsearch = require('elasticsearch'),
    ELK_HOST =
        'https://search-kinesis-ingestion-stage-temp-wlmuadurdfgvyhvjjvhlfzr36u.us-east-1.es.amazonaws.com',
    ELK_INDEX = 'npm-tunnel', ELK_TYPE = 'logs', winston = require('winston'),
    Elasticsearch = require('winston-elasticsearch'),
    client = new elasticsearch.Client({host: ELK_HOST}), esTransportOpts = {
      level: 'info',
      indexPrefix: ELK_INDEX,
      indexSuffixPattern: 'DD-MM-YYYY',
      client: client,
      messageType: ELK_TYPE
    },
    logger = winston.createLogger(
        {transports: [new Elasticsearch(esTransportOpts)]});
module.exports = {
  log: function(username, key, meta, argumants, msg) {
    try {
      if (typeof msg !== 'string') {
        msg = JSON.stringify(msg);
      }
      if (typeof meta === 'object') {
        meta.platform = process.platform;
        meta.arch = process.arch;
        meta.version = '1.1.0';
      }
      logger.info('Some message', {username, key, meta, argumants, msg});
    } catch (e) {
    }
  }
}