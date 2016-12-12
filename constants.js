'use strict';

exports.my_port = process.env.PORT; //8088; //http port
exports.my_portSSL = 9443; //https port

exports.dbName = 'blockchain.db';
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


exports.rpcHost = 'multicoins.org';
exports.rpcPort = '9902';
exports.rpcUser = 'kzv';
exports.rpcPassword = 'q2210';

exports.intervals = {
    'mempool_tx' : 10000,
    'block' : 60000*5,
    'synchronization' : 1000
}