const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const { Worker } = require('worker_threads');

let currentDifficulty = "0000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
const targetBlockTime = 10000; 
let lastAdjustmentTime = Date.now();
let blocksMinedSinceLastAdjustment = 0;
const adjustmentInterval = 10; // Adjust difficulty every 10 blocks for this simulation

const spentOutputs = new Set();

// Adjusted function to validate a single transaction
function validateTransaction(transaction) {
    // Verify basic structure
    if (!transaction || !transaction.vin || !transaction.vout) {
        console.log("Transaction structure is invalid.");
        return false;
    }

    // Mock input verification (simplified)
    for (const input of transaction.vin) {
        if (!input.txid || input.vout === undefined) {
            console.log("Transaction input is invalid.");
            return false;
        }

        // Check for double spending
        const inputIdentifier = `${input.txid}:${input.vout}`;
        if (spentOutputs.has(inputIdentifier)) {
            console.log("Double spending detected.");
            return false;
        }

    }

    // Calculate and verify transaction fee (conceptually)
    const inputTotal = transaction.vin.reduce((sum, input) => sum + (input.prevout ? input.prevout.value : 0), 0);
    const outputTotal = transaction.vout.reduce((sum, output) => sum + output.value, 0);
    if (inputTotal < outputTotal) {
        console.log("Transaction inputs do not cover outputs.");
        return false;
    }

    // Mark inputs as spent if transaction is valid
    transaction.vin.forEach(input => {
        const inputIdentifier = `${input.txid}:${input.vout}`;
        spentOutputs.add(inputIdentifier);
    });

    return true;
}

function calculateMerkleRoot(transactions) {
    if (transactions.length === 0) return '';

    let layer = transactions.map(txid => crypto.createHash('sha256').update(txid).digest('hex'));

    while (layer.length > 1) {
        const newLayer = [];
        for (let i = 0; i < layer.length; i += 2) {
            const combined = layer[i] + (layer[i + 1] ? layer[i + 1] : '');
            newLayer.push(crypto.createHash('sha256').update(combined).digest('hex'));
        }
        layer = newLayer;
    }

    return layer[0]; // The remaining hash is the Merkle root
}

function adjustDifficulty(mineTime) {
    blocksMinedSinceLastAdjustment++;
    
    if (blocksMinedSinceLastAdjustment >= adjustmentInterval) {
        const now = Date.now();
        const timeSinceLastAdjustment = now - lastAdjustmentTime;
        const averageBlockTime = timeSinceLastAdjustment / blocksMinedSinceLastAdjustment;

        if (averageBlockTime < targetBlockTime) {
            // Mining too fast, increase difficulty
            currentDifficulty = "0" + currentDifficulty.slice(0, -1);
        } else {
            // Mining too slow, decrease difficulty
            currentDifficulty = currentDifficulty.slice(1) + "f";
        }

        // Reset adjustment trackers
        lastAdjustmentTime = now;
        blocksMinedSinceLastAdjustment = 0;
    }
}

function mineBlock(transactions) {
    return new Promise((resolve, reject) => {
        const merkleRoot = calculateMerkleRoot(transactions);
        if (!merkleRoot) {
            console.log("No transactions to mine.");
            reject("No transactions to mine.");
            return;
        }

        const startTime = Date.now(); // Start time for mining
        const numWorkers = 4; // Split the work across 4 workers
        const maxNonce = Number.MAX_SAFE_INTEGER;
        const nonceRange = Math.ceil(maxNonce / numWorkers);
        let workersCompleted = 0;
        let resolved = false;

        for (let i = 0; i < numWorkers; i++) {
            const worker = new Worker('./minerWorker.js');
            const startNonce = i * nonceRange;
            const endNonce = startNonce + nonceRange;

            worker.postMessage({
                merkleRoot,
                startNonce,
                endNonce,
                difficultyTarget: currentDifficulty
            });

            worker.on('message', (message) => {
                workersCompleted++;
                if (message && !resolved) {
                    resolved = true;
                    const endTime = Date.now(); // End time after finding a valid nonce
                    const mineTime = endTime - startTime; // Calculate the time taken to mine the block
                    adjustDifficulty(mineTime); // Adjust difficulty based on mine time

                    console.log(`Block mined with nonce ${message.nonce}: ${message.hash}, Difficulty: ${currentDifficulty}`);
                    resolve({ nonce: message.nonce, hash: message.hash, currentDifficulty });
                    
                    // terminate all workers, once solution has been found
                }
                
                // Check if all workers have completed without resolving (i.e., no valid nonce found)
                if (workersCompleted === numWorkers && !resolved) {
                    reject("Failed to mine the block. No valid nonce found within the search space.");
                }

                worker.terminate(); // Terminate worker after processing its message
            });

            worker.on('error', err => {
                console.error(err);
                reject(err);
            });

            worker.on('exit', (code) => {
                if (code !== 0) console.error(new Error(`Worker stopped with exit code ${code}`));
            });
        }
    });
}

const mempoolDir = path.join(__dirname, 'mempool');
let transactions = [];

fs.readdir(mempoolDir, (err, files) => {
    if (err) {
        console.error("Could not list the directory.", err);
        process.exit(1);
    }

    if (files.length === 0) {
        console.log("Mempool directory is empty.");
        return;
    }

    let filesProcessed = 0;
    files.forEach(file => {
        console.log(`Reading file: ${file}`);
        fs.readFile(path.join(mempoolDir, file), 'utf8', (err, data) => {
            filesProcessed++;
            if (err) {
                console.error("Error reading file.", err);
            } else {
                try {
                    const transaction = JSON.parse(data);
                    if (validateTransaction(transaction)) {
                        // Assuming txid of the first vin entry as transaction identifier
                        transactions.push(transaction.vin[0].txid);
                    }
                } catch (e) {
                    console.error("Error parsing JSON.", e);
                }
            }
            if (filesProcessed === files.length) {
                simulateMiningAndWriteOutput();
            }
        });
    });
});

function simulateMiningAndWriteOutput() {
    console.log(`Starting mining simulation with ${transactions.length} transactions.`);
    
    mineBlock(transactions).then(({ nonce, hash, currentDifficulty }) => {
        // Prepare the final content with the mined nonce and transactions
        const blockHeader = `Nonce: ${nonce}, Hash: ${hash}, Difficulty: ${currentDifficulty}`;
        const serializedCoinbaseTx = "SerializedCoinbaseTx"; // Placeholder for the coinbase transaction
        
        const outputContent = `${blockHeader}\n${serializedCoinbaseTx}\n${transactions.join('\n')}`;
        const outputFilePath = path.join(__dirname, 'output.txt');
        
        fs.writeFile(outputFilePath, outputContent, (err) => {
            if (err) {
                console.error("Error writing to file.", err);
                return;
            }
            console.log("Mining result saved to output.txt");
        });
    }).catch(error => {
        console.error("Mining failed:", error);
    });
}
