// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

contract CampaignFactory {
    address[] private deployedCampaigns;

    function createCampaign(uint256 minimum) public {
        Campaign newCampaign = new Campaign(minimum, msg.sender);
        deployedCampaigns.push(address(newCampaign));
    }

    function getDeployedCampaigns() public view returns (address[] memory) {
        return deployedCampaigns;
    }
}

contract Campaign {
    struct Request {
        string description;
        uint256 amount;
        address receipt;
        bool complete;
        mapping(address => bool) approvers;
        uint256 approveCount;
    }

    address public manager;
    uint256 private minimumContribution;
    mapping(address => uint256) public contributors;
    uint256 private contributorCount;
    Request[] public requests;

    constructor(uint256 minimum, address creator) {
        manager = creator;
        minimumContribution = minimum;
    }

    modifier onlyManager() {
        require(
            msg.sender == manager,
            "Only manager is allowed to call this function"
        );
        _;
    }

    function contribute() public payable {
        require(
            msg.value >= minimumContribution,
            "You have not send enough money to contribute"
        );

        contributors[msg.sender] = msg.value;
        contributorCount++;
    }

    function createRequest(
        string memory desc,
        uint256 amnt,
        address rec
    ) public onlyManager {
        Request storage newRequest = requests.push();

        newRequest.description = desc;
        newRequest.amount = amnt;
        newRequest.receipt = rec;
        newRequest.complete = false;
        newRequest.approveCount = 0;
    }

    function approveRequest(uint256 index) public {
        Request storage req = requests[index];

        require(contributors[msg.sender] > 0, "You are not a contributor");
        require(!req.approvers[msg.sender], "You have already voted!");

        req.approvers[msg.sender] = true;
        req.approveCount++;
    }

    function finalizeRequest(uint256 index) public onlyManager {
        Request storage req = requests[index];
        require(!req.complete, "The request is already finalized");
        require(
            req.approveCount > (contributorCount / 2),
            "The request does not get enough approvement yet"
        );

        payable(req.receipt).transfer(req.amount);
        req.complete = true;
    }
}

contract SelfDeployCampaign is Campaign {
    constructor(uint256 minimum) Campaign(minimum, msg.sender) {}
}
