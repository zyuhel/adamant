'use strict';

const node = require('./../node.js');
const Mnemonic = require('bitcore-mnemonic');

function sendADM (params, done) {
    node.put('/api/transactions/', params, function (err, res) {
        done(err, res);
    });
}

function postMessage (transaction, done) {
    node.post('/api/transactions', { transaction: transaction }, done);
}

function getChats (senderId, done, withPayments) {
    node.get( `/api/chatrooms/${senderId}${withPayments ? '?withPayments' : ''}`, done);
}

function getMessages (authorId, companionId, done, withPayments) {
    node.get( `/api/chatrooms/${authorId}/${companionId}${withPayments ? '?withPayments=true' : ''}`, done);
}

describe('GET /api/chatrooms/:ID/:ID', function () {
    const sender = node.randomAccount();
    const recipient1 = node.randomAccount();
    const recipient2 = node.randomAccount();

    // send ADM to message sender
    before(function (done) {
        sendADM({
            secret: node.gAccount.password,
            amount: node.fees.messageFee*3+node.fees.transactionFee*2,
            recipientId: sender.address
        }, function () {
            done();
        });
    });

    // send ADM to recipient1
    before(function (done) {
        sendADM({
            secret: node.gAccount.password,
            amount: node.fees.messageFee,
            recipientId: recipient1.address
        }, function () {
            done();
        });
    });

    // send ADM to recipient2
    before(function (done) {
        sendADM({
            secret: node.gAccount.password,
            amount: node.fees.messageFee,
            recipientId: recipient2.address
        }, function () {
            done();
        });
    });

    before(function (done) {
        node.onNewBlock(function () {
            done();
        });
    });

    // send a message from a sender to recipient1
    before(function (done) {
        const transaction = node.createChatTransaction({
            keyPair: sender.keypair,
            recipientId: recipient1.address,
            message: new Mnemonic(Mnemonic.Words.ENGLISH).toString(),
            own_message: '',
            type: 1
        });
        postMessage(transaction, function (err, res) {
            node.expect(res.body).to.have.property('success').to.be.ok;
            node.expect(res.body).to.have.property('transactionId').that.is.not.empty;
            done();
        });
    });

    // send a message from a recipient1 to recipient2
    before(function (done) {
        const transaction = node.createChatTransaction({
            keyPair: recipient1.keypair,
            recipientId: recipient2.address,
            message: new Mnemonic(Mnemonic.Words.ENGLISH).toString(),
            own_message: '',
            type: 1
        });
        postMessage(transaction, function (err, res) {
            node.expect(res.body).to.have.property('success').to.be.ok;
            node.expect(res.body).to.have.property('transactionId').that.is.not.empty;
            done();
        });
    });

    // send a message from a recipient2 to recipient1
    before(function (done) {
        const transaction = node.createChatTransaction({
            keyPair: recipient2.keypair,
            recipientId: recipient1.address,
            message: new Mnemonic(Mnemonic.Words.ENGLISH).toString(),
            own_message: '',
            type: 1
        });
        postMessage(transaction, function (err, res) {
            node.expect(res.body).to.have.property('success').to.be.ok;
            node.expect(res.body).to.have.property('transactionId').that.is.not.empty;
            done();
        });
    });

    before(function (done) {
        node.onNewBlock(function () {
            done();
        });
    });

    // send a message from a sender to recipient2
    before(function (done) {
        const transaction = node.createChatTransaction({
            keyPair: sender.keypair,
            recipientId: recipient2.address,
            message: new Mnemonic(Mnemonic.Words.ENGLISH).toString(),
            own_message: '',
            type: 1
        });
        postMessage(transaction, function (err, res) {
            node.expect(res.body).to.have.property('success').to.be.ok;
            node.expect(res.body).to.have.property('transactionId').that.is.not.empty;
            done();
        });
    });

    before(function (done) {
        node.onNewBlock(function () {
            done();
        });
    });

    // send a second message from a sender to recipient1
    before(function (done) {
        const transaction = node.createChatTransaction({
            keyPair: sender.keypair,
            recipientId: recipient1.address,
            message: new Mnemonic(Mnemonic.Words.ENGLISH).toString(),
            own_message: '',
            type: 1
        });
        postMessage(transaction, function (err, res) {
            node.expect(res.body).to.have.property('success').to.be.ok;
            node.expect(res.body).to.have.property('transactionId').that.is.not.empty;
            done();
        });
    });

    // send ADM to message sender
    before(function (done) {
        sendADM({
            secret: sender.password,
            amount: node.fees.transactionFee,
            recipientId: recipient1.address
        }, function () {
            done();
        });
    });

    before(function (done) {
        node.onNewBlock(function () {
            done();
        });
    });

    it('should return the chats list for a valid transaction', function (done) {
        getChats(sender.address, function (err, res) {
            node.expect(res.body).to.have.property('success').to.be.ok;
            node.expect(res.body).to.have.property('count').to.equal('2');
            node.expect(res.body).to.have.property('chats').to.have.lengthOf(2);
            for (let i = 0; i < res.body.chats.length; i++) {
                node.expect(res.body.chats[i]).to.have.property('participants').to.have.lengthOf(2);
                node.expect(res.body.chats[i].participants[0].address).to.equal(sender.address);
                node.expect(res.body.chats[i].participants[0].publicKey).to.equal(sender.publicKey.toString('hex'));
                node.expect(res.body.chats[i].participants[1].publicKey).to.not.equal(null);
            }
            done();
        });
    });

    it('should return the messages list for a valid transaction', function (done) {
        getMessages(sender.address, recipient1.address, function (err, res) {
            node.expect(res.body).to.have.property('success').to.be.ok;
            node.expect(res.body).to.have.property('count').to.equal('2');
            node.expect(res.body).to.have.property('messages').to.have.lengthOf(2);
            node.expect(res.body).to.have.property('participants').to.have.lengthOf(2);
            node.expect(res.body.participants[0].address).to.equal(sender.address);
            node.expect(res.body.participants[0].publicKey).to.equal(sender.publicKey.toString('hex'));
            node.expect(res.body.participants[1].address).to.equal(recipient1.address);
            node.expect(res.body.participants[1].publicKey).to.equal(recipient1.publicKey.toString('hex'));
            done();
        });
    });

    it('should return the messages list for a valid transaction with payments', function (done) {
        getMessages(sender.address, recipient1.address, function (err, res) {
            node.expect(res.body).to.have.property('success').to.be.ok;
            node.expect(res.body).to.have.property('count').to.equal('3');
            node.expect(res.body).to.have.property('messages').to.have.lengthOf(3);
            node.expect(res.body).to.have.property('participants').to.have.lengthOf(2);
            node.expect(res.body.participants[0].address).to.equal(sender.address);
            node.expect(res.body.participants[0].publicKey).to.equal(sender.publicKey.toString('hex'));
            node.expect(res.body.participants[1].address).to.equal(recipient1.address);
            node.expect(res.body.participants[1].publicKey).to.equal(recipient1.publicKey.toString('hex'));
            done();
        }, true);
    });
});