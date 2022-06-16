const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');

const web3 = new Web3(ganache.provider());

const compiledFactory = require('../contract/build/CampaignFactory.json');
const compiledCampaign = require('../contract/build/Campaign.json');
const compiledSelfDeployCampaign = require('../contract/build/SelfDeployCampaign.json');

let accounts;
let deployedFactory;
let campaignAddress;
let deployedCampaign;

beforeEach(async () => {
    accounts = await web3.eth.getAccounts();

    deployedFactory = await new web3.eth.Contract(compiledFactory.abi)
        .deploy({ data: compiledFactory.evm.bytecode.object })
        .send({ from: accounts[0], gas: '3000000' });

    await deployedFactory.methods.createCampaign(web3.utils.toWei('0.1', 'ether'))
        .send({ from: accounts[0], gas: '3000000' });

    [campaignAddress] = await deployedFactory.methods.getDeployedCampaigns().call();
    deployedCampaign = await new web3.eth.Contract(compiledCampaign.abi, campaignAddress);
});

describe('Testing Factory', () => {
    it('Deploying Factory and new Campaign contract', async () => {
        assert.ok(deployedFactory.options.address);
        assert.ok(deployedCampaign.options.address);
    });

    it('Mark caller as Campaign Manager', async () => {
        const manager = await deployedCampaign.methods.manager().call();
        assert.equal(manager, accounts[0]);
    });

    it('Contribute to the campaign', async () => {
        await deployedCampaign.methods.contribute().send({
            from: accounts[1],
            value: web3.utils.toWei('0.5', 'ether')
        });
        const isContributor = await deployedCampaign.methods.contributors(accounts[1]).call();
        assert(isContributor);
    });

    it('Requiring minimum value limit for contribution', async () => {
        try {
            await deployedCampaign.methods.contribute().send({
                from: accounts[2],
                value: web3.utils.toWei('0.01', 'ether')
            });

            assert(false);
        } catch (err) {
            assert.ok(err);
        }
    });

    it('Allowing manager to create new request', async () => {
        await deployedCampaign.methods
            .createRequest('Hiring a developer', web3.utils.toWei('0.2', 'ether'), accounts[3])
            .send({ from: accounts[0], gas: '1000000' });

        const request = await deployedCampaign.methods.requests(0).call();
        assert.equal(request.description, 'Hiring a developer');
    });

    it('All steps of processing request', async () => {
        await deployedCampaign.methods.contribute().send({
            from: accounts[1],
            value: web3.utils.toWei('3', 'ether')
        });

        await deployedCampaign.methods.contribute().send({
            from: accounts[2],
            value: web3.utils.toWei('2', 'ether')
        });

        await deployedCampaign.methods.contribute().send({
            from: accounts[3],
            value: web3.utils.toWei('0.5', 'ether')
        });

        await deployedCampaign.methods.createRequest(
            'Buying some stuff',
            web3.utils.toWei('2.5', 'ether'),
            accounts[4]
        ).send({
            from: accounts[0],
            gas: '1000000'
        });

        await deployedCampaign.methods.approveRequest(0).send({
            from: accounts[1],
            gas: '1000000'
        });

        await deployedCampaign.methods.approveRequest(0).send({
            from: accounts[2],
            gas: '1000000'
        });

        // await deployedCampaign.methods.approveRequest(0).send({
        //     from: accounts[3],
        //     gas: '1000000'
        // });

        let balanceBefore = await web3.eth.getBalance(accounts[4]);
        balanceBefore = web3.utils.fromWei(balanceBefore, 'ether');
        balanceBefore = parseFloat(balanceBefore);
        // console.log('Account balance before finalizing request: ', balanceBefore);

        await deployedCampaign.methods.finalizeRequest(0).send({
            from: accounts[0],
            gas: '1000000'
        });

        let balanceAfter = await web3.eth.getBalance(accounts[4]);
        balanceAfter = web3.utils.fromWei(balanceAfter, 'ether');
        balanceAfter = parseFloat(balanceAfter);
        // console.log('Account balance after finalizing request: ', balanceAfter);

        // console.log(Math.abs(balanceAfter - balanceBefore));
        assert(Math.abs(balanceAfter - balanceBefore > 2.4));
    })
});

