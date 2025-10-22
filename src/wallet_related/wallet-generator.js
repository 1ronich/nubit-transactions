const askQuestion = require("./functions.js");
const { createWallets } = require("./functions.js");

const readline = require("readline");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function main() {
  const numberOfWallets = await askQuestion(
    "How many wallets do you want?: ",
    Number
  );
  rl.close();
  const wasap = await createWallets(numberOfWallets);
  console.log(wasap);
}

main();
