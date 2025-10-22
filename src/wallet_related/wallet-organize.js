const readline = require("readline");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const wallets = require("./wallet_Storage/wallets");
const { askQuestion } = require("../wallet-generator");

const main = async () => {
  //let { groups1 } = require('./walletsgroup')

  const totalWallets = await askQuestion("Total number of wallets?: ", Number);
  const groupSize1 = await askQuestion("Size of group 1?: ", Number);
  const groupSize2 = await askQuestion("Size of group 2?: ", Number);
  const groupSize3 = await askQuestion("Size of group 3?: ", Number);

  try {
    const groups = organizeWallets(
      totalWallets,
      [groupSize1, groupSize2, groupSize3],
      wallets
    );
    console.log("Group 1:", groups[0]);
    console.log("Group 2:", groups[1]);
    console.log("Group 3:", groups[2]);
    //groups1.push(groups[0], groups[1], groups[2])
  } catch (error) {
    console.error(error.message);
  } finally {
    rl.close();
  }
};

main();
