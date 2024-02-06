const { ethers, getNamedAccounts } = require("hardhat")

async function main() {
    let fundMe
    let signer
    const sendValue = "1000000000000000000"
    const accounts = await ethers.getSigners()
    signer = accounts[0]
    await deployments.fixture(["all"])
    const FundMeDeployment = await deployments.get("FundMe")
    fundMe = await ethers.getContractAt(
        FundMeDeployment.abi,
        FundMeDeployment.address,
        signer,
    )
    console.log(`Got contract FundMe at ${fundMe.target}`)
    console.log("Withdrawing from contract...")
    const transactionResponse = await fundMe.withdraw()
    await transactionResponse.wait(1)
    console.log("Got it back!")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
