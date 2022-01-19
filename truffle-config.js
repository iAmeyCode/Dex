require('babel-register');
require('babel-polyfill');
require('dotenv').config();

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  // contracts_build_directory: path.join(__dirname, "client/src/contracts"),
  networks: {
    develop: {
      host: '127.0.0.1',
      port: '7545',
      networkId: '*'
    }
  },

//  contracts_directory : './src/contracts/',
//  contracts_build_directory : './src/abis/',

  compilers: {
    solc : {
      version: "^0.8.1",
      settings: {
        optimizer: {
          enabled: true, // Default: false
          runs: 200, // Default: 200
        },
      
      },
    },
  },

};
