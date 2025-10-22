const { DirectSecp256k1HdWallet } = require("@cosmjs/proto-signing");
const fs = require("fs");
const path = require("path");

const walletsPath = "./wallets/wallets.js";

const askQuestion = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(Number(answer));
    });
  });
};

const createWallets = async (number) => {
  try {
    let walleets = [];
    //let wallets1 = [ ];
    for (let i = 1; i <= number; i++) {
      const genWallet = await DirectSecp256k1HdWallet.generate(12);
      const mnemonic = genWallet.mnemonic;
      const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
        prefix: "nubit",
      });
      const [firstAccount] = await wallet.getAccounts();
      const address = firstAccount.address;
      fs.appendFileSync("./misc/wallets2.txt", `\n${address} \n ${mnemonic}`);
      walleets.push([address], [mnemonic]);
    }
    return { walleets };
  } catch (err) {
    console.error("Error while creating wallets", err);
  }
};

const organizeWallets = async (
  wallets,
  groupSizes,
  organizedGroups,
  mainAddress
) => {
  try {
    let groups = [[], [], []];
    let walletIndex = 0;

    for (let groupIndex = 0; groupIndex < groupSizes.length; groupIndex++) {
      for (let i = 0; i < groupSizes[groupIndex]; i++) {
        groups[groupIndex].push(wallets[walletIndex]);
        walletIndex++;
      }
    }

    organizedGroups.push([[mainAddress], groups]);
    const updatedContent = `let organizedGroups = ${JSON.stringify(
      organizedGroups,
      null,
      2
    )};\nmodule.exports = { organizedGroups };`;
    fs.writeFileSync("groups.js", updatedContent, "utf8");

    console.log("Wallets have been organized into groups");
    return { groups };
  } catch (err) {
    console.error("Error organizing wallets", err);
  }
};

const storeGroups = async (location, content) => {
  try {
    fs.appendFileSync(location, content);
  } catch (err) {
    console.error("Error appending", err);
  }
};

async function main(wallets) {
  try {
    let groupsAa = [1, 25, 13];
    let numToGen = 39;

    let { organizedGroups } = require("./src/wallet_Storage/groups.js");

    for (let mainAddress of wallets) {
      const { walleets } = await createWallets(numToGen);
      const { groups } = await organizeWallets(
        walleets,
        groupsAa,
        organizedGroups,
        mainAddress
      );
      //console.log(walleets)
      console.log("groups");
      console.log(groups);

      const formattedGroups = groups.join("\n");
      const newWalletsGroup = `\n\nMAIN ADDRESS: \n${mainAddress} \nGROOPS: \n${formattedGroups}\n\n`;
      await storeGroups("./groups.txt", newWalletsGroup);
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

//main(wallets1)

module.exports = { createWallets };
