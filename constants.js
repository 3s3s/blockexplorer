'use strict';

exports.my_port = 9098; //8088; //http port
exports.my_portSSL = 9443; //https port

exports.dbName = './PeercoinDB/blockchain.db';
exports.rpcHost = '3s3s.ru';
exports.rpcPort = '6553';
exports.rpcProtocol = 'https';
exports.rpcUser = 'kzv_rpc';
exports.rpcPassword = 'kzv_q221';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

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
