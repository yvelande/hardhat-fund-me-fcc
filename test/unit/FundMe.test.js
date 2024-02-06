const { assert, expect } = require("chai")
const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
//unti只在本地测试网络测试
!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async function () {
          let fundMe
          let signer
          let mockV3Aggregator
          const sendValue = "1000000000000000000" //等于1乘以18个0 1ETH
          beforeEach(async function () {
              //deploy funme contract using hardhat deploy

              // 也可以如下设置账号
              const accounts = await ethers.getSigners()
              signer = accounts[0]
              // signer = (await getNamedAccounts()).deployer不行
              await deployments.fixture(["all"])
              //获取最近部署的fundme合约 链接到deployer账户上
              // fundMe = await ethers.getContractAt("FundMe", deployer)

              // there is no getContract function in ethers, so using getContractAt
              const FundMeDeployment = await deployments.get("FundMe")
              fundMe = await ethers.getContractAt(
                  FundMeDeployment.abi,
                  FundMeDeployment.address,
                  signer,
              )
              // mockV3Aggregator = await ethers.getContractAt(
              //     "MockV3Aggregator",
              //     deployer
              // )
              const MockV3AggregatorDeployment =
                  await deployments.get("MockV3Aggregator")
              mockV3Aggregator = await ethers.getContractAt(
                  MockV3AggregatorDeployment.abi,
                  MockV3AggregatorDeployment.address,
                  signer,
              )
          })
          describe("constructor", async function () {
              it("sets the aggregator addresses correctly", async function () {
                  const response = await fundMe.getPriceFeed()
                  //target不是address
                  assert.equal(response, mockV3Aggregator.target)
              })
          }) //部署这个tag下的所有合约
          describe("fund", function () {
              it("Fails if you don't send enough ETH", async function () {
                  // await expect(fundMe.fund()).to.be.revertedWith(
                  //     "You need to spend more ETH!"
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "You need to spend more ETH!",
                  )
              })
              it("Updates the amount funded data structure", async () => {
                  await fundMe.fund({ value: sendValue })
                  //获得deployer捐助的钱
                  const response = await fundMe.getAddressToAmountFunded(signer)
                  assert.equal(response.toString(), sendValue.toString())
              })

              it("Adds funder to array of funders", async () => {
                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.getFunder(0)
                  assert.equal(response, signer.address)
              })
          })

          describe("withdraw", async function () {
              beforeEach(async function () {
                  //withdraw函数首先会被注入资金
                  await fundMe.fund({ value: sendValue })
              })
              it("withdraws ETH from a single funder", async function () {
                  // Arrange
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(fundMe.target)
                  const startingDeployerBalance =
                      await ethers.provider.getBalance(signer)

                  // Act
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  //从receipt获得price和used
                  const { gasUsed, gasPrice } = transactionReceipt
                  const gasCost = gasUsed * gasPrice

                  const endingFundMeBalance = await ethers.provider.getBalance(
                      fundMe.target,
                  )
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(signer)

                  // Assert
                  // Maybe clean up to understand the testing
                  //取出所有钱 所以合同金额为0
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance + startingDeployerBalance,
                      endingDeployerBalance + gasCost,
                  )
              })

              it("is allows us to withdraw with multiple funders", async function () {
                  // Arrange
                  const accounts = await ethers.getSigners()
                  for (i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i],
                      )
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }
                  //每个账户都发送1ETH
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(fundMe.target)
                  const startingDeployerBalance =
                      await ethers.provider.getBalance(signer)

                  // Act
                  const transactionResponse = await fundMe.cheaperWithdraw()
                  // const transactionResponse = await fundMe.cheaperWithdraw()
                  // Let's comapre gas costs :)
                  // const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait()
                  const { gasUsed, gasPrice } = transactionReceipt
                  const gasCost = gasUsed * gasPrice
                  // console.log(`GasCost: ${withdrawGasCost}`)
                  // console.log(`GasUsed: ${gasUsed}`)
                  // console.log(`GasPrice: ${effectiveGasPrice}`)
                  const endingFundMeBalance = await ethers.provider.getBalance(
                      fundMe.target,
                  )
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(signer)
                  // Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance + startingDeployerBalance,
                      endingDeployerBalance + gasCost,
                  )
                  // Make a getter for storage variables 期待数组被重置所以访问0或报错
                  await expect(fundMe.getFunder(0)).to.be.reverted

                  for (i = 1; i < 6; i++) {
                      //判断mapping也被置零
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address,
                          ),
                          0,
                      )
                  }
              })

              it("Only allows the owner to withdraw", async function () {
                  const accounts = await ethers.getSigners()
                  const fundMeConnectedContract = await fundMe.connect(
                      accounts[1],
                  )
                  // await expect(fundMeConnectedContract.withdraw()).to.be.revertedWith(
                  //     "FundMe__NotOwner"
                  // )
                  // await expect(fundMeConnectedContract.withdraw()).to.be.reverted
                  await expect(
                      fundMeConnectedContract.withdraw(),
                  ).to.be.revertedWithCustomError(
                      fundMeConnectedContract,
                      "FundMe__NotOwner",
                  )
              })
          })
      })
