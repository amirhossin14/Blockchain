const express = require("express");
const Blockchain = require("./blockchain");
const Pubsub = require("./app/pubsub");
const TransactionPool = require("./wallet/transaction-pool");
const Wallet = require("./wallet");
const tcpPortUsed = require("tcp-port-used");
const axios = require("axios");

const app = express();
app.use(express.json());

const blockchain = new Blockchain();
const transactionPool = new TransactionPool();
const wallet = new Wallet();
const pubsub = new Pubsub({ blockchain, transactionPool });

//setTimeout(() => {
// pubsub.broadcastChain();
//},1000);

app.get("/api/blocks", (req, res) => {
  res.json(blockchain.chain);
});

app.get("/api/transaction-pool-map", (req, res) => {
  res.json(transactionPool.transactionMap);
});

app.post("/api/transact", (req, res) => {
  let { amount, recipient } = req.body;
  amount = parseInt(amount);
  let transaction = transactionPool.existingTransactionn({
    inputAddress: wallet.publicKey,
  });
  try {
    if (transaction) {
      transaction.update({ senderWallet: wallet, recipient, amount });
    } else {
      transaction = wallet.createTransaction({ recipient, amount });
    }
  } catch (error) {
    return res.json({ type: "error", message: error.message });
  }
  transactionPool.setTransaction(transaction);
  pubsub.broadcastTransaction(transaction);
  //console.log("transactionPool", transactionPool);
  req.json({ transaction });
});
app.post("/api/mine", (req, res) => {
  const { data } = req.body;

  blockchain.addBlock({ data });
  pubsub.broadcastChain();
  res.redirect("/api/block");
});

const rootport = 3000;
let PORT = 3000;

const syncOnConnect = async () => {
  let response = await axios.get(`http://localhost:${rootport}/api/blocks`);
  blockchain.replaceChain(response.data);

   response = await axios.get(`http://localhost:${rootport}/api/transaction-pool-map`);
  transactionPool.setMap(response.data);
};

tcpPortUsed.check(3000, "127.0.0.1").then(function (inUse) {
  if (inUse) {
    PORT += Math.ceil(Math.random() * 1000);
  }
  app.listen(PORT, () => {
    console.log(`listening at localhost:${PORT}`);
    if (PORT !== rootport) syncOnConnect();
  });
});
