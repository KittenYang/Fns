const hre = require("hardhat");
const namehash = require('eth-ens-namehash');
const tld = "test";
const ethers = hre.ethers;
const utils = ethers.utils;
const labelhash = (label) => utils.keccak256(utils.toUtf8Bytes(label))
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const ZERO_HASH = "0x0000000000000000000000000000000000000000000000000000000000000000";
async function main() {
  const ENSRegistry = await ethers.getContractFactory("ENSRegistry")
  const FIFSRegistrar = await ethers.getContractFactory("FIFSRegistrar")
  const ReverseRegistrar = await ethers.getContractFactory("ReverseRegistrar")
  const HashRegistrar = await ethers.getContractFactory("HashRegistrar")
  const BaseRegistrar = await ethers.getContractFactory("BaseRegistrarImplementation")
  const OwnedResolver = await ethers.getContractFactory("OwnedResolver")
  const PriceOracle = await ethers.getContractFactory("StablePriceOracle")
  const ETHRegistrarController  = await ethers.getContractFactory("ETHRegistrarController")
  const BulkRenewal   = await ethers.getContractFactory("BulkRenewal")
  const signers = await ethers.getSigners();
  const accounts = signers.map(s => s.address)
	
  console.log('resolver_namehash',namehash.hash("resolver"))	
  console.log('resolver_labelhash',labelhash("reverse"))	
	
  const ens = await ENSRegistry.deploy();
  await ens.deployed()
  console.log(`address ENSRegistry (tx:${ens.address})...`);
  
  const resolver = await OwnedResolver.deploy();
  await resolver.deployed()
  console.log(`address OwnedResolver (tx:${resolver.address})...`);
  
  const priceoracle = await PriceOracle.deploy("0xf4766552d15ae4d256ad41b6cf2933482b0680dc",[123,234,456]);
  await priceoracle.deployed()
  console.log(`address oracle (tx:${priceoracle.address})...`);
  
  const baseregistrar = await BaseRegistrar.deploy(ens.address,namehash.hash("ftm"));
  await baseregistrar.deployed()
  console.log(`address BaseRegistrar (tx:${baseregistrar.address})...`);
  
  await ens.setSubnodeRecord(ZERO_HASH,labelhash("ftm"),baseregistrar.address,resolver.address,0);
  
  const ethregistrarcontroller = await ETHRegistrarController.deploy(baseregistrar.address, priceoracle.address, 100,86400);
  await ethregistrarcontroller.deployed()
  console.log(`address ETHRegistrarController (tx:${ethregistrarcontroller.address})...`);
  
  const bulkrenewal = await BulkRenewal.deploy(ens.address);
  await bulkrenewal.deployed()
  console.log(`address BulkRenewal (tx:${bulkrenewal.address})...`);
  
  const hashregisgrar = await HashRegistrar.deploy(ens.address, namehash.hash("ftm"), 0 );
  
  
  
  await setupResolver(ens, resolver, accounts);
  
  await resolver.setInterface(namehash.hash("ftm"), '0x6ccb2df4', baseregistrar.address);
  await resolver.setInterface(namehash.hash("ftm"), '0x018fac06', ethregistrarcontroller.address);
  await resolver.setInterface(namehash.hash("ftm"), '0x3150bfba', bulkrenewal.address);
  await resolver.setInterface(namehash.hash("ftm"), '0x7ba18ba1', hashregisgrar.address);
  console.log(`Fixing interface...`);
  
  
  const fifsregistrar = await  FIFSRegistrar.deploy(ens.address, namehash.hash(tld));
  await fifsregistrar.deployed()
  console.log(`address FIFSRegistrar(TEST) (tx:${fifsregistrar.address})...`);
  await setupRegistrar(ens, fifsregistrar);
  
  const reverseRegistrar = await ReverseRegistrar.deploy(ens.address, resolver.address);
  await reverseRegistrar.deployed()
  console.log(`address ReverseRegistrar (tx:${reverseRegistrar.address})...`);
  await setupReverseRegistrar(ens, fifsregistrar, reverseRegistrar, accounts);
};

async function setupResolver(ens, resolver, accounts) {
  const resolverNode = namehash.hash("resolver");
  const resolverLabel = labelhash("resolver");
  await ens.setSubnodeOwner(ZERO_HASH, resolverLabel, accounts[0]);
  await ens.setResolver(resolverNode, resolver.address);
  await resolver['setAddr(bytes32,address)'](resolverNode, resolver.address);
}

async function setupRegistrar(ens, registrar) {
  await ens.setSubnodeOwner(ZERO_HASH, labelhash(tld), registrar.address);
}

async function setupReverseRegistrar(ens, registrar, reverseRegistrar, accounts) {
  await ens.setSubnodeOwner(ZERO_HASH, labelhash("reverse"), accounts[0]);
  await ens.setSubnodeOwner(namehash.hash("reverse"), labelhash("addr"), reverseRegistrar.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });