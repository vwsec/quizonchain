
import axios from 'axios';

async function testDetail() {
    const txHash = '0xb3dc0ba87621a8957be57416a3eff128f4fa9dc47e3032873b745afc0a2cece2';
    const apiBase = 'https://explorer.inkonchain.com/api/v2';
    try {
        const response = await axios.get(`${apiBase}/transactions/${txHash}`);
        const tx = response.data;
        
        console.log('Transaction Types:', tx.transaction_types);
        console.log('Token Transfers count:', tx.token_transfers ? tx.token_transfers.length : 0);
        if (tx.token_transfers && tx.token_transfers.length > 0) {
            console.log('Token Transfer 0 structure:', JSON.stringify(tx.token_transfers[0], null, 2));
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testDetail();
