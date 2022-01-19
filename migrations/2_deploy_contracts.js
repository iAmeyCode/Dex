var Tachyontoken = artifacts.require("./Tachyontoken.sol");
var Exchange = artifacts.require("./Exchange.sol");

module.exports = async function(deployer) {
  
  await deployer.deploy(Tachyontoken);

  const accounts = await web3.eth.getAccounts();

  const feeAccount = accounts[0];
  const feePercent = 1;

  await deployer.deploy(Exchange, feeAccount, feePercent);

};
