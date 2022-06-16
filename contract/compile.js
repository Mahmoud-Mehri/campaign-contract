const path = require('path');
const solc = require('solc');
const fs = require('fs-extra');

const buildPath = path.resolve(__dirname, 'build');
fs.removeSync(buildPath);

const contractFilePath = path.resolve(__dirname, 'campaign.sol');
const source = fs.readFileSync(contractFilePath, 'utf8');

const input = {
    language: "Solidity",
    sources: {
        "campaign.sol": {
            content: source
        }
    },
    settings: {
        outputSelection: {
            "*": {
                "*": ["*"]
            }
        }
    }
}

const output = JSON.parse(solc.compile(JSON.stringify(input)));
const compiledContracts = output.contracts['campaign.sol'];

fs.ensureDirSync(buildPath); // Create new build directory
for (let contract in compiledContracts) {
    fs.outputJSONSync(
        path.resolve(buildPath, contract + '.json'),
        compiledContracts[contract]
    );
}

