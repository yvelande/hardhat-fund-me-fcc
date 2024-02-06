const { network, ethers, getNamedAccounts } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
const { assert } = require("chai")
//development只在sepolia测试
developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async function () {
          let fundMe
          let signer
          const sendValue = "1000000000000000000"
          beforeEach(async function () {
              const accounts = await ethers.getSigners()
              signer = accounts[0]
              await deployments.fixture(["all"])
              const FundMeDeployment = await deployments.get("FundMe")
              fundMe = await ethers.getContractAt(
                  FundMeDeployment.abi,
                  FundMeDeployment.address,
                  signer,
              )
          })
          it("allows people to fund and withdraw", async function () {
              await fundMe.fund({ value: sendValue })
              await fundMe.withdraw()
              const endingBalance = await ethers.provider.getBalance(
                  fundMe.target,
              )
              assert.equal(endingBalance.toString(), "0")
          })
      })
