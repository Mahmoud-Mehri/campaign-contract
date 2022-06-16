const HDWalletProvider = require('@truffle/hdwallet-provider');
const Web3 = require('web3');
const factory = require('./build/CampaignFactory.json');
const env = require('dotenv');

env.config();

const abi = factory.abi;
const bytecode = factory.evm.bytecode.object;

const provider = new HDWalletProvider(
    process.env.MNEMONIC,
    process.env.ENDPOINT
);
const web3 = new Web3(provider);

const deploy = async () => {
    const accounts = await web3.eth.getAccounts();

    const result = await new web3.eth.Contract(abi)
        .deploy({ data: bytecode })
        .send({ from: accounts[0], gas: '3000000' });

    console.log('Contract deployed in Rinkeby network with this address: \n', result.options.address);
}
deploy();
