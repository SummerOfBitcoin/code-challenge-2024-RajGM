# How Bitcoin Works

At its core, Bitcoin uses a decentralized ledger called the blockchain to record all transactions. The blockchain is maintained by a network of nodes, which are computers that run Bitcoin's software and store a copy of the entire ledger.

## Step by Step Process of How Bitcoin Processes a Transaction

### Transaction Creation

- A transaction begins when a user, known as the sender, decides to transfer some amount of bitcoin to another user, the recipient.
- The sender uses their private key to sign a message containing the transaction details: the sender's address, the recipient's address, the amount of bitcoin to be transferred, and a transaction fee.

### Transaction Broadcasting

- Once signed, the transaction is broadcast to the Bitcoin network. This is done through one or more nodes that the sender is connected to.

### Transaction Verification by Nodes

- Nodes in the Bitcoin network pick up this broadcast and validate the transaction. Validation includes several checks: ensuring the transaction is properly formed, verifying the digital signature with the public key of the sender (to ensure the sender owns the bitcoins being sent), and checking that the sender has enough balance to cover the transaction amount and fees.

### Mempool (Transaction Pool)

- Once a transaction is verified, it goes into the mempool, which is a holding area for all unconfirmed transactions. Here, it waits to be picked up by a miner.

### Transaction Selection for Block

- Miners select transactions from the mempool to include in a new block. Transactions with higher fees are generally prioritized because miners receive these fees as a reward for their work.

### Block Mining

- Mining involves creating a valid block that the network will accept. This includes:
  - Forming a block header, which contains metadata such as the previous block's hash, a timestamp, the difficulty target, and a nonce.
  - Calculating the block's hash. Miners attempt to find a hash that meets the network's difficulty target by varying the nonce.
- The difficulty target is a measure of how hard it is to find a hash below a given target. Bitcoin adjusts this target every 2016 blocks to ensure that the time between blocks remains approximately 10 minutes.

### Block Verification and Addition to Blockchain

- When a miner successfully finds a valid hash, the new block is broadcast to the network.
- Other nodes then verify the block, checking that all transactions it contains are valid and that the block hash meets the difficulty target.
- Once verified, the block is added to the blockchain, providing confirmation for the included transactions.

### Confirmation

- The transaction is now considered confirmed, but it's common practice to wait for additional blocks to be added (six confirmations is standard) for higher security, as it becomes exponentially harder to alter the transaction history as more blocks are added on top.

### Updating Ledger

- The recipient can now see the transaction in their wallet as an increase in their bitcoin balance once it is confirmed.

## References

For a deeper understanding of Bitcoin and its workings, consider the following resources:

- [Bitcoin: A Peer-to-Peer Electronic Cash System](https://bitcoin.org/bitcoin.pdf) by Satoshi Nakamoto, the original Bitcoin whitepaper.
- [Bitcoin Developer Guide](https://developer.bitcoin.org/devguide/index.html), particularly the sections on transactions and block chain mechanics.
- [Mastering Bitcoin](https://github.com/bitcoinbook/bitcoinbook) by Andreas M. Antonopoulos, a comprehensive technical guide to Bitcoin.
