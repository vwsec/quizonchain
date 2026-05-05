
import axios from 'axios';

async function test() {
    const apiBase = 'https://explorer.inkonchain.com/api/v2';
    try {
        const response = await axios.get(`${apiBase}/transactions`);
        const items = response.data.items || [];
        
        const types = new Set();
        const tokenTypes = new Set();
        
        items.forEach(tx => {
            (tx.transaction_types || []).forEach(t => types.add(t));
            (tx.token_transfers || []).forEach(t => {
                if (t.token && t.token.type) tokenTypes.add(t.token.type);
            });
        });
        
        console.log('Unique Transaction Types:', Array.from(types));
        console.log('Unique Token Types:', Array.from(tokenTypes));
        
        // Find FIRST tx with token_transfers to see structure
        const transferTx = items.find(tx => tx.token_transfers && tx.token_transfers.length > 0);
        if (transferTx) {
            console.log('--- Sample Token Transfer Tx ---');
            console.log(JSON.stringify(transferTx.token_transfers[0], null, 2));
        }

        // Check one NFT-like tx if found
        const nftTx = items.find(tx => 
            (tx.token_transfers || []).some(t => t.token && (t.token.type && (t.token.type.includes('721') || t.token.type.includes('1155'))))
        );
        if (nftTx) {
            console.log('--- Found an NFT Transaction ---');
            console.log(JSON.stringify(nftTx, null, 2));
        } else {
            console.log('No NFT Transaction found in the last 100 txs.');
        }
    } catch (error) {
        console.error('Error fetching data:', error.message);
    }
}

test();
