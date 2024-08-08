class TransactionPool{
    constructor(){
        this.transactionMap = {};
    }

    setTransaction(tradaction){
        this.transactionMap[tradaction.id] = tradaction;
    }

    existingTransaction({inputAddress}){
        const tradactions = Object.values(this.transactionMap);
        return tradactions.find(tradaction => tradaction.input.address === inputAddress);
    }

    setMap(tradactionMap){
        this.transactionMap = tradactionMap;
    }
}

module.exports = TransactionPool;