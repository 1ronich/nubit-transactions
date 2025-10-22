

const { SigningStargateClient } = require('@cosmjs/stargate');
const { DirectSecp256k1HdWallet, Registry } = require('@cosmjs/proto-signing');
const { MsgDelegate } = require("@cosmjs-types/cosmos/staking/v1beta1/tx")
const { coins } = require('@cosmjs/stargate');
const { assertIsBroadcastTxSuccess } = require('@cosmjs/stargate')
const fs = require('fs');

const { getBalance } = require('./getBalance.js')
const { createWallets } = require('./functions.js')

const nubitRPC = 'https://bitcoin-mainnet.public.blastapi.io'//'https://validator.nubit-alphatestnet-1.com:26657';



async function createWalletForEachFundedWallet(number_of_new_addresses_for_each_old_wallet, number_of_files_we_want, index_of_last_already_created_walletPair_file) { //this function creates a new wallet for each already created wallet  (makes pairs with funded wallets)

    console.log('Started wallet creation...')

    let { walletPairs0 } = require('./wallet_Storage/fundedWalletPairs0.js')



    for (let index = index_of_last_already_created_walletPair_file; index < number_of_files_we_want; index++) {
        //const module = require(`./wallets/fundedWalletPairs${index}.js`)
        //let { [`walletPairs${index}`]: wallets } = module
        let walletPairs = []


        for (let i = 0; i < walletPairs0.length; i++) {

            let address = walletPairs0[i][1][0][0]
            let mnemonic = walletPairs0[i][1][1][0]

            let { walleets } = await createWallets(number_of_new_addresses_for_each_old_wallet)

            walletPairs.push([[[address], [mnemonic]], walleets])
        }

        let updatedContent = `let walletPairs${index + 1} = ${JSON.stringify(walletPairs, null, 2)};\nmodule.exports = { walletPairs${index + 1} };`;
        fs.writeFileSync(`./wallets/fundedWalletPairs${index + 1}.js`, updatedContent, 'utf8');

        console.log(`File ${index} has finished creation`)
    }
        
    console.log('Wallet creation has ended...')
    return { walletPairs }

}

//createWalletForEachFundedWallet(1, 5, 0)

async function createWalletsForFundedWallets(numberOfAddressesForEachWallet, numberOfFilesWeWantMore, indexOfAlreadyCreatedFiles) { //this function creates xNumber of files where the previous address and mnemonic are now paired with a new address and mnemonic  (this uses the 'createWalletForEachFundedWallet')
    console.log('Loop started')

    let n = numberOfFilesWeWantMore + indexOfAlreadyCreatedFiles
    console.log(n)
    for (i = indexOfAlreadyCreatedFiles; i <= n; i++) {
        console.log('Loop: ',i)

        const module = require(`./wallets/fundedWalletPairs${i}.js`)
        let { [`walletPairs${i}`]: wallets } = module

        let { walletPairs } = await createWalletForEachFundedWallet(wallets, numberOfAddressesForEachWallet)
        let updatedContent = `let walletPairs${i+1} = ${JSON.stringify(walletPairs, null, 2)};\nmodule.exports = { walletPairs${i+1} };`;
        fs.writeFileSync(`./wallets/fundedWalletPairs${i+1}.js`, updatedContent, 'utf8');
    }

    console.log('Loop finished')
}
//createWalletsForFundedWallets(1, 2, 4)



async function transaction(rpcEnd, senderMnemonicPhrase, recipientAddress, amount) {
    try {
        const wallet = await DirectSecp256k1HdWallet.fromMnemonic(senderMnemonicPhrase, {prefix: 'nubit'});
        const [firstAccount] = await wallet.getAccounts();
        const senderAddress = firstAccount.address
        
        const client = await SigningStargateClient.connectWithSigner(rpcEnd, wallet, { registry: Registry })


        const accountInfo = await client.getAccount(senderAddress);
        const currentSeq = accountInfo.sequence


        console.log(`Sending from:  ${senderAddress} to ${recipientAddress}`);

        //const gasPrice = GasPrice.fromString('500unub');
    
        const memo = "Sending tokens";
        const options = { sequence: currentSeq }; 

        const msg = MsgDelegate.fromPartial({
            delegatorAddress: senderAddress,
            validatorAddress: recipientAddress,
            amount: {
                denom: "unub",
                amount: "500",
            },
        })
        console.log(msg);

        const msgAny = {
            typeUrl: "/cosmos.bank.v1beta1.MsgSend",
            value: msg
        }
        const fee = {
            amount: [
                { 
                    denom: "unub",
                    amount: "500",
                },
            ],
            gas: "200000",
        }
       
        const result = await client.signAndBroadcast(
            senderAddress,
            [msgAny],
            fee,
            memo,
            options
        )

        //const result = await client.sendTokens(senderAddress, recipientAddress, [amount], fee);

        console.log(`Transaction completed: ${result}`);
        assertIsBroadcastTxSuccess(result)
        let data = `\n${result}\n`;
        await fs.appendFileSync('./misc/transactions-result.txt', data)


    } catch (err) {
        console.error('Error:', err)
    }
        
}   

async function part1Funding(wallets, senderAddress, senderPhrase, receiverAddress) { //this function spreads the funds accross specified wallets and saves its hash data
    try {
        console.log('Transactions have started...')

        //for (let i = 0; i < wallets.length; i++) {


            let { unub } = await getBalance(senderAddress)

            const fee = {
                amount: coins(500, "unub"),  // Replace with fee amount and denom
                gas: "200000",  // Gas limit
            };
            let feeAmount = (fee.amount[0].amount).toString()

            const amount = (unub - feeAmount).toString()  // Amount to send (in the smallest denomination, e.g., 1 ATOM = 1000000 uatom)

            console.log(amount)

            await transaction(nubitRPC, senderPhrase, receiverAddress, amount)
            console.log('Transaction has been sent')
           


            //let hashData = hash
            //fs.appendFileSync(hashDataLocation, hashData)    

        //}
        console.log('Operation completed.')
    } catch (e) {
        console.error('Error in the transactions', e)
    }
}

async function part2Funding(wallets, senderAddress, senderPhrase, receiverAddress) {
    try {
        //for (let i = 0; i < wallets.length; i++) {

            
            let { unub } = await getBalance(senderAddress)

            const fee = {
                amount: coins(500, "unub"),  // Replace with fee amount and denom
                gas: "200000",  // Gas limit
            };
            let feeAmount = (fee.amount[0].amount).toString()

            const amount = {
                denom: "unub",  // Replace with your token denom
                amount: (unub - feeAmount).toString(),  // Amount to send (in the smallest denomination, e.g., 1 ATOM = 1000000 uatom)
            };

            await transaction(nubitRPC, senderPhrase, receiverAddress, amount, fee)
            console.log('Transaction has been sent\n')

        //}
            
    } catch (e) {
        console.error('Error in the 2nd part of funding', e)
    }
}

//fundSpread(walletPairs, 'hashData.txt')


async function startFundSpread(wallets) { //this function spreads the funds across the different wallet pairs, [ from one pair --> to other pair(in other file) --> ... ]
    try {
        console.log('Fund spread has started')
        const lowFunds = []
        const enoughFunds = []

        for (let i = 0; i < wallets.length; i++) {

            let senderAddressPt1 = wallets[i][1][0][0] //second address in pair
            let senderPhrasePt1 = wallets[i][1][1][0] //mnemonic from second address in pair
            let receiverAddressPt1 = wallets[i][0][0][0] //first address in pair

            let senderAddressPt2 = wallets[i][0][0][0] //first address in pair
            let senderPhrasePt2 = wallets[i][0][1][0] //mnemonic from second address in pair
            let receiverAddressPt2 = wallets[i][1][0][0] //second address in pair

            let { unub } = await getBalance(senderAddressPt1)

            let unubNum = parseInt(unub)
            let index = 0
            if (!isNaN(unubNum)) {

                console.log('Balance is a number')
                console.log(unubNum)

                if (unubNum > 500) {
                    console.log('Balance is more than 500unub, balance is enough')
                    enoughFunds.push(senderAddressPt1)
                    console.log('Internal transaction', i)
        
                    await part1Funding(wallets, senderAddressPt1, senderPhrasePt1, receiverAddressPt1)
                    await part2Funding(wallets, senderAddressPt2, senderPhrasePt2, receiverAddressPt2)
                    index++
                } else if (unubNum < 500) {
                    console.log('Balance is not enough')
                    console.log(unubNum)
                    lowFunds.push(senderAddressPt1)
                }
            } else if (isNaN(unubNum)) {
                console.log('Balance is 0\n')
            }
        }
        

        console.log('Fund spread has ended')
        return { lowFunds, enoughFunds }
    } catch (e) {
        console.error('Error in the fundSpread function', e)
    }
    

}

let { walletPairs0 } = require(`./wallet_Storage/fundedWalletPairs0.js`)

async function main(wallets, numberOfTransactions) {
    for (let i = 0; i < numberOfTransactions; i++) {
        const { lowFunds, enoughFunds } = await startFundSpread(wallets)
        console.log('External transaction', i)
        console.log('Number of not enough funded wallets:', lowFunds.length)
        console.log('Number of enough funded wallets:', enoughFunds.length )

    }
}


main(walletPairs0, 1)






/*




const fs = require('fs');

const { getBalance } = require('./getBalance.js')

const nubitRPC = 'https://validator.nubit-alphatestnet-1.com:26657';




async function transaction(rpcEnd, senderMnemonicPhrase, recipientAddress, amount) {
    try {
        const wallet = await DirectSecp256k1HdWallet.fromMnemonic(senderMnemonicPhrase, {prefix: 'nubit'});
        const client = await SigningStargateClient.connectWithSigner(rpcEnd, wallet)

        const [firstAccount] = await wallet.getAccounts();
        const senderAddress = firstAccount.address

        const accountInfo = await client.getAccount(senderAddress)
        const accountSeq = accountInfo.sequence
        console.log(`Account sequence:  ${accountSeq}`);

        console.log(`Sending from:  ${senderAddress} to ${recipientAddress}`);

        const msg = {
            typeUrl: "/cosmos.bank.v1beta1.MsgSend",
            value: {
              fromAddress: senderAddress,
              toAddress: recipientAddress,
              amount: [{denom: "unub", amount: amount}],
            },
        }

        const fee = {
            amount: [
              {
                denom: "unub",
                amount: "500",  // Replace with fee amount and denom
              },
            ],
            gas: "200000",  
        };
          
    
        const signResult = await client.signAndBroadcast(
            senderAddress,
            [msg],
            fee,
            "",
            { sequence: accountSeq } // Manually set the sequence here
        );
       

        //const result = await client.sendTokens(senderAddress, recipientAddress, [amount], fee);

        console.log(`Transaction completed: ${signResult}`);

        let data = `\n${signResult}\n`;
        await fs.appendFileSync('./misc/transactions-result.txt', data)


    } catch (err) {
        console.error('Error:', err)
    }
        
}   

async function part1Funding(wallets, senderAddress, senderPhrase, receiverAddress) { //this function spreads the funds accross specified wallets and saves its hash data
    try {
        console.log('Transactions have started...')

        //for (let i = 0; i < wallets.length; i++) {


            let { unub } = await getBalance(senderAddress)

            const fee = {
                amount: coins(500, "unub"),  // Replace with fee amount and denom
                gas: "200000",  // Gas limit
            };
            let feeAmount = (fee.amount[0].amount).toString()

            const amount = (unub - feeAmount).toString()

            console.log(amount)
            console.log(typeof amount)

            await transaction(nubitRPC, senderPhrase, receiverAddress, amount)
            console.log('Transaction has been sent')
           


            //let hashData = hash
            //fs.appendFileSync(hashDataLocation, hashData)    

        //}
        console.log('Operation completed.')
    } catch (e) {
        console.error('Error in the transactions', e)
    }
}

async function part2Funding(wallets, senderAddress, senderPhrase, receiverAddress) {
    try {
        //for (let i = 0; i < wallets.length; i++) {

            
            let { unub } = await getBalance(senderAddress)

            const fee = {
                amount: coins(500, "unub"),  // Replace with fee amount and denom
                gas: "200000",  // Gas limit
            };
            let feeAmount = (fee.amount[0].amount).toString()

            const amount = {
                denom: "unub",  // Replace with your token denom
                amount: (unub - feeAmount).toString(),  // Amount to send (in the smallest denomination, e.g., 1 ATOM = 1000000 uatom)
            };

            await transaction(nubitRPC, senderPhrase, receiverAddress, amount, fee)
            console.log('Transaction has been sent\n')

        //}
            
    } catch (e) {
        console.error('Error in the 2nd part of funding', e)
    }
}

//fundSpread(walletPairs, 'hashData.txt')


async function startFundSpread(wallets) { //this function spreads the funds across the different wallet pairs, [ from one pair --> to other pair(in other file) --> ... ]
    try {
        console.log('Fund spread has started')
        const lowFunds = []
        const enoughFunds = []

        for (let i = 0; i < wallets.length; i++) {

            let senderAddressPt1 = wallets[i][1][0][0] //second address in pair
            let senderPhrasePt1 = wallets[i][1][1][0] //mnemonic from second address in pair
            let receiverAddressPt1 = wallets[i][0][0][0] //first address in pair

            let senderAddressPt2 = wallets[i][0][0][0] //first address in pair
            let senderPhrasePt2 = wallets[i][0][1][0] //mnemonic from second address in pair
            let receiverAddressPt2 = wallets[i][1][0][0] //second address in pair

            let { unub } = await getBalance(senderAddressPt1)

            let unubNum = parseInt(unub)
            let index = 0
            if (!isNaN(unubNum)) {

                console.log('Balance is a number')
                console.log(unubNum)

                if (unubNum > 500) {
                    console.log('Balance is more than 500unub, balance is enough')
                    enoughFunds.push(senderAddressPt1)
                    console.log('Internal transaction', i)
        
                    await part1Funding(wallets, senderAddressPt1, senderPhrasePt1, receiverAddressPt1)
                    await part2Funding(wallets, senderAddressPt2, senderPhrasePt2, receiverAddressPt2)
                    index++
                } else if (unubNum < 500) {
                    console.log('Balance is not enough')
                    console.log(unubNum)
                    lowFunds.push(senderAddressPt1)
                }
            } else if (isNaN(unubNum)) {
                console.log('Balance is 0\n')
            }
        }
        

        console.log('Fund spread has ended')
        return { lowFunds, enoughFunds }
    } catch (e) {
        console.error('Error in the fundSpread function', e)
    }
    

}

let { walletPairs0 } = require(`./wallet_Storage/fundedWalletPairs0.js`)

async function main(wallets, numberOfTransactions) {
    for (let i = 0; i < numberOfTransactions; i++) {
        const { lowFunds, enoughFunds } = await startFundSpread(wallets)
        console.log('External transaction', i)
        console.log('Number of not enough funded wallets:', lowFunds.length)
        console.log('Number of enough funded wallets:', enoughFunds.length )

    }
}

main(walletPairs0, 1)

*/