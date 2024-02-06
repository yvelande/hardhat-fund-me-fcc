const { network } = require("hardhat")
const DECIMALS = "8"
const INITIAL_PRICE = "200000000000" // 2000
const { developmentChains } = require("../helper-hardhat-config")
module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    if (developmentChains.includes(network.name)) {
        log("Local network detected !deploying mocks")
        await deploy("MockV3Aggregator", {
            contract: "MockV3Aggregator",
            from: deployer,
            log: true,
            args: [DECIMALS, INITIAL_PRICE],
        })
        log("Mocks Deployed!")
        log("------------------------------------------------")
    }
}

module.exports.tags = ["all", "mocks"]
