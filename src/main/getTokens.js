const fs = require("fs");

const start = async () => {
  const { wallets } = require("./wallets/wallets.js");

  let getNotFound = [];
  let successTax = [];
  let retryIn24h = [];
  let getLength = getNotFound.length;
  let successLength = successTax.length;
  let retry24hLength = retryIn24h.length;

  try {
    for (i = 52; i < wallets.length; i++) {
      let address = wallets[i];

      const { connect } = await import("puppeteer-real-browser");

      const { browser, page } = await connect({
        slowMo: 250,
        headless: "auto",
        args: [],
        customConfig: {},
        skipTarget: [],
        fingerprint: false,
        turnstile: true,
        connectOption: {},
        fpconfig: {},
        proxy: {
          host: "",
          port: "",
          username: "",
          password: "",
        },
      });
      try {
        await enterPage("https://faucet.nubit.org", page);
        await waitFor(3000);
        await heheha(page);
        await sendAddress(address, page, browser);
        await waitFor(3000);
        await checkAddressFull(page, address);
        await waitFor(9000);

        const get = await page.$('button[type="submit"]:not([disabled])');
        //const status = await verifStatus(page)

        if (get) {
          await waitFor(3000);
          await enterClick(page);
          await checkTaxStatus(page, address, successTax, retryIn24h);
        } else {
          getNotFound.push(address);
          let time = new Date();
          let data = `\n${time}\n${address}\n`;
          await saveToFile("./misc/failedTaxes.txt", data);
          console.log(`Get button wasn't found`);
        }

        await waitFor(3000);
      } finally {
        console.log(`Browser closing\n`);
        await browser.close();
        await waitFor(5000);
      }
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    console.log(getLength + successLength + retry24hLength);
  }
};

async function waitFor(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function saveToFile(location, data) {
  fs.appendFileSync(location, data);
}

async function enterClick(page) {
  console.log("Pressing Enter");
  await page.focus("#address");
  await page.keyboard.press("Enter");
}

async function enterPage(webPage, page) {
  try {
    await page.goto(webPage, { waitUntil: "domcontentloaded" });
  } catch (err) {
    console.error("Error while trying to enter the page:", err);
  }
}

async function heheha(page) {
  const ip = await page.evaluate(async () => {
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    return data.ip;
  });

  console.log("IP Address:", ip);
}

async function verifStatus(page) {
  const success = await page.waitForSelector("#success", {
    visible: true,
    timeout: 10000,
  });
  const fail = await page.waitForSelector("#fail", {
    visible: true,
    timeout: 10000,
  });
  //const success = await page.$('#success', { visible: true})
  //const fail = await page.$('#fail', { visible: true})

  if (success.includes("Success!")) {
    console.log("Cloudflare has been passed successfully");
    return true;
  } else if (fail.includes("Failure!")) {
    console.log("Cloudflare has not been passed");
    return false;
  }
}

async function sendAddress(address, page, browser) {
  try {
    let pages = await browser.pages();
    //page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    let nubitPage = pages.find((p) =>
      p.url().includes("https://faucet.nubit.org")
    );

    await nubitPage.bringToFront();
    console.log("Waiting for #address selector");
    await page.focus(`#address`);

    await page.waitForSelector("#address", { visible: true });
    await page.focus(`#address`);
    await page.focus(`#address`);

    await page.evaluate((text) => navigator.clipboard.writeText(text), address);
    await page.keyboard.down("Control", { delay: 200 });
    await page.keyboard.press("V", { delay: 200 });
    await page.keyboard.up("Control", { delay: 200 });

    console.log("Typing in address:", address);

    await waitFor(3000);
  } catch (err) {
    console.error("Error while trying to send the address:", err);
  }
}

async function checkAddressFull(page, address) {
  const value = await page.evaluate(() => {
    const input = document.querySelector("#address");
    return input ? input.value : null; // Return the value or null if the element is not found
  });

  if (value !== address) {
    let data = `\n${address}\n${value}\n`;
    await saveToFile("./misc/failedAddresses.txt", data);
  }
}

async function checkTaxStatus(page, address, successTax, retryIn24h) {
  try {
    //*

    const taxInProgress = await page.waitForSelector(
      "div ::-p-text(Transaction is being sent to the server)"
    ); //await page.$$("//div[contains(text()='Please note that you need to wait 24 hour between claims')]")
    const elementHandle = await page.$("div.mt-2.text-sm.text-yellow-700");
    const successHandle = await page.$("div.mt-2.text-sm.text-green-700");

    if (taxInProgress) {
      console.log("Transaction in progress");

      let retry24h;
      try {
        retry24h = await page.waitForSelector(
          "div ::-p-text(Please note that you need to wait 24 hour between claims)",
          { timeout: 4000 }
        ); //await page.$$("//div[contains(text()='Please note that you need to wait 24 hour between claims')]")

        if (retry24h) {
          console.log("Please retry again in 24h");
          retryIn24h.push(address);
        }
      } catch (error) {
        if (error.name === "TimeoutError") {
          console.log("Waiting 20s for tax status");
          //await waitFor(20000)

          const taxSuccess = await page.waitForSelector(
            "div ::-p-text(Success)",
            { timeout: 20000 }
          ); //await page.$$("//div[contains(text()='Success')]")

          if (taxSuccess) {
            console.log("Tax successful");
            successTax.push(address);
          }
        }
      }
    } else {
      console.log("Something went wrong with the token request");
    }
  } catch (err) {
    console.error("Error while trying to check the tax status", err);
  }
}

start();
