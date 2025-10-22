let { walletsAdd } = require('./wallet_Storage/fundedWallets1.js')

const { StargateClient } = require('@cosmjs/stargate')



async function getBalance(wallet) {   
    const rpcEnd = 'https://validator.nubit-alphatestnet-1.com:26657'//'https://testnet-nubit-rpc.lavenderfive.com';

    const client = await StargateClient.connect(rpcEnd)

    
    try {
        const balance = await client.getAllBalances(wallet)
        const unub = balance[0]?.amount
        const nub = balance[0]?.amount/1000000
        return { nub, unub }
    } catch (err) {
        console.log('Error gettin wallet balance:', wallet, err)
        return { nub: 0 }
    }


}



async function getBalances(wallets) {
    const sum = array => eval(array.join('+'));

    try {
        let balances = []

        for (let i = 0; i < wallets.length; i++) {
            let wallet = wallets[i][0]
            const { nub } = await getBalance(wallet)
            
            console.log(`${wallet} =`, nub, 'nub')

            balances.push(nub)

        }
        console.log(sum(balances))

    } catch (e) {
        console.error('Error', e)
    }
    
}

async function main(wallets) {
    await getBalances(wallets)
}


//main(walletsAdd)


module.exports = { getBalance }
