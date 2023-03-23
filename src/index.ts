import dotenv from 'dotenv'
import { distributor, getCurrentL1Block, handleError, l2Client,  beforeTest } from './utils'
import { handleClaims, prepareClaims } from './claim';


dotenv.config()

export let gasPrice:string
export let DISTRIBUTOR_ADDRESS:string
export let TOKEN_ADDRESS:string

async function main(){
    console.log('Starting bot..')
    const userInput = "NORMAL"
    if (userInput === 'NORMAL'){
        gasPrice = (parseInt(await l2Client.eth.getGasPrice()) * 5).toString()
        const startBlock = await distributor.methods.claimPeriodStart().call()
        TOKEN_ADDRESS = process.env.TOKEN_NORMAL_ADDRESS ? process.env.TOKEN_NORMAL_ADDRESS : handleError('Missing TOKEN_NORMAL_ADDRESS env variable')
        DISTRIBUTOR_ADDRESS = process.env.DISTRIBUTOR_NORMAL_ADDRESS ? process.env.DISTRIBUTOR_NORMAL_ADDRESS : handleError('Missing DISTRIBUTOR_NORMAL_ADDRESS env variable')
        const signedClaims = await prepareClaims(DISTRIBUTOR_ADDRESS)
        let l1Block
        let trigger = false;


        let subscription = l2Client.eth.subscribe('newBlockHeaders', function(error, result){
            if (!error) {
                return;
            }
            console.error(error);
        })
            .on("connected", function(subscriptionId){
                console.log(subscriptionId);
            })
            .on("data", async function (blockHeader) {
                l1Block = await getCurrentL1Block()
                console.log("L2 listener : ", l1Block);
                console.log(`${new Date().toLocaleTimeString()} - Blocks left: ${startBlock - l1Block}`)
                if(startBlock == l1Block && !trigger) {
                    trigger = true;
                    handleClaims(signedClaims)
                }
            })
            .on("error", console.error);
        //
    }
    else if (userInput === 'TEST'){
        gasPrice = (parseInt(await l2Client.eth.getGasPrice()) * 2).toString()
        DISTRIBUTOR_ADDRESS = process.env.DISTRIBUTOR_TEST_ADDRESS ? process.env.DISTRIBUTOR_TEST_ADDRESS : handleError('Missing DISTRIBUTOR_NORMAL_ADDRESS env variable')
        TOKEN_ADDRESS = process.env.TOKEN_TEST_ADDRESS ? process.env.TOKEN_TEST_ADDRESS : handleError('Missing TOKEN_TEST_ADDRESS env variable')
        await beforeTest()
        const signedTClaims = await prepareClaims(DISTRIBUTOR_ADDRESS)
        handleClaims(signedTClaims)

    }
    else handleError('Choose either NORMAL or TEST')
}

main()
