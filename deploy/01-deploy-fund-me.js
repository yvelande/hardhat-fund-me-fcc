// function deployFunc(hre) {
//     console.log("hi")
//       hre.getNameAccounts();
//       hre.deployments;
// }

// function deployFunc() {
//     console.log("hi")
// }

// module.exports.default = deployFunc

// module.exports=async(hre)=>{
//     const{getNameAccounts,deployments}=hre
// }
const {
    networkConfig,
    developmentChains,
} = require("../helper-hardhat-config.js")
const { network } = require("hardhat")
module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    if (developmentChains.includes(network.name)) {
        //测试
        const ethUsdAggregator = await deployments.get("MockV3Aggregator")
        ethUsdPriceFeedAddress = ethUsdAggregator.address
    } else {
        //本地开发 远程
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    }
    //when going for localhost or hardhat network we want to use a mock
    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: [ethUsdPriceFeedAddress],
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })
    log("----------------------------------------------------")
}
module.exports.tags = ["all", "fundme"]
