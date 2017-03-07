'use strict';
const fs = require("fs");

const currentCoin = 'd51';

exports.views = __dirname + '/views';
exports.static = __dirname + '/site';

const coinInfo = {
  d51 : {
    httpPort  : 11080,
    httpsPort : 11443,
    rpcPort   : 8435
  },
  e51 : {
    httpPort  : 12080,
    httpsPort : 12443,
    rpcPort   : 8535
  },
  r51 : {
    httpPort  : 13080,
    httpsPort : 13443,
    rpcPort   : 8635
  },
  y51 : {
    httpPort  : 14080,
    httpsPort : 14443,
    rpcPort   : 8735
  },
};

exports.rpcHost = '198.54.121.57';
exports.rpcProtocol = 'http';
exports.rpcUser = 'blablablaUser';
exports.rpcPassword = 'blablablaPassword';

exports.options = {
    key: fs.readFileSync(__dirname + "/server.key"),
    cert: fs.readFileSync(__dirname + "/server.crt")
};

exports.dbTables = [
    {
      'name' : 'Blocks',
      'cols' : [
        ['hash', 'TEXT'], 
        ['size', 'INT'], 
        ['height', 'INT'],
        ['version', 'INT'],
        ['merkleroot', 'TEXT'],
        ['time', 'TEXT'], 
        ['nonce', 'TEXT'], 
        ['bits', 'TEXT'],
        ['difficulty', 'TEXT'],
        ['previousblockhash', 'TEXT'],
        ['nextblockhash', 'TEXT'],
        ['ip', 'TEXT'],
        ['tx', 'TEXT']
      ],
      'commands' : 'PRIMARY KEY (hash, height, time)'
    },
    {
      'name' : 'Transactions',
      'cols' : [
        ['blockHash', 'TEXT'],
        ['blockHeight', 'INT'],
        ['txid', 'TEXT PRIMARY KEY'],
        ['time', 'INT'],
        ['vin', 'TEXT'],
        ['vout', 'TEXT']
      ],
      'commands' : 'FOREIGN KEY(blockHash, blockHeight, time) REFERENCES Blocks(hash, height, time)'
    },
    {
      'name' : 'Address',
      'cols' : [
        ['key', 'TEXT PRIMARY KEY'],
        ['address', 'TEXT'],
        ['scriptPubKey', 'TEXT'],
        ['value', 'TEXT'],
        ['txin', 'TEXT'],
        ['txout', 'TEXT'],
        ['time', 'TEXT'],
        ['number', 'INT'],
        ['height', 'INT']
      ],
      'commands' : 'FOREIGN KEY(txin) REFERENCES Transactions(txid)'
    },
    {
      'name' : 'KeyValue',
      'cols' : [
          ['key', 'TEXT PRIMARY KEY'],
          ['value', 'TEXT']
        ]
    }
];

exports.dbIndexes = [
  {
    'name' : 'addr',
    'table' : 'Address',
    'fields' : 'address'
  },
  {
    'name' : 'txHash',
    'table' : 'Transactions',
    'fields' : 'txid'
  },
  {
    'name' : 'blk',
    'table' : 'Blocks',
    'fields' : 'hash, height, time'
  }
];
exports.dbPath = __dirname+"/"+currentCoin;
exports.dbName = exports.dbPath+'/blockchain.db';

exports.my_port = process.env.PORT || coinInfo[currentCoin].httpPort;   //http port
exports.my_portSSL = coinInfo[currentCoin].httpsPort;                   //https port
exports.rpcPort = coinInfo[currentCoin].rpcPort;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";


