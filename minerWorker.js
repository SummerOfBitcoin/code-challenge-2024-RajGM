const { parentPort } = require('worker_threads');
const crypto = require('crypto');

parentPort.on('message', (message) => {
    try {
        const { merkleRoot, startNonce, endNonce, difficultyTarget } = message;
        const targetBigInt = BigInt(`0x${difficultyTarget}`);
        let nonce = startNonce;
        let hash;

        do {
            nonce++;
            const blockString = merkleRoot + nonce;
            hash = crypto.createHash('sha256').update(blockString).digest('hex');
        } while (BigInt(`0x${hash}`) >= targetBigInt && nonce < endNonce);

        if (BigInt(`0x${hash}`) < targetBigInt) {
            parentPort.postMessage({ nonce, hash });
        } else {
            parentPort.postMessage(null);
        }
    } catch (error) {
        console.error('Error in worker:', error);
        parentPort.postMessage({ error: error.message });
    }
});
