'use strict'

const { createHash } = require('crypto');
const $ = require('jquery');
const { signer, BatchEncoder, TransactionEncoder } = require('sawtooth-sdk-client');
const { REST_API_PROXY } = require('./config');

// Encoding helper
const getAddress = (key, length = 64) => createHash('sha512').update(key).digest('hex').slice(0, length);

// Configuration variables.
const KEY_NAME = 'berry-chain.keys',
    API_URL = REST_API_PROXY,// 'http://localhost:3000/api',
    FAMILY = 'berry-chain',
    VERSION = '0.0',
    PREFIX = getAddress(FAMILY, 6);

// Fetch key-pairs from localStorage.
const getUsers = () => {
    // const storedKeys = localStorage.getItem(KEY_NAME);
    // // Verify key-pairs exist.
    // if (!storedKeys) return [];
    // // Split and return key-pairs.
    // return storedKeys.split(';').map((pair) => {
    //     const separated = pair.split(',');
    //     return {
    //         public: separated[0],
    //         private: separated[1]
    //     };
    // });
    const storedUsers = localStorage.getItem(KEY_NAME);
    if (!storedUsers) return [];
    return storedUsers.split(';;').map((userProperties) => {
        const user = userProperties.split('||');
        return {
            name: user[0],
            public_key: user[1],
            private_key: user[2],
            address: user[3]
        };
    });
}

// Create new key-pair.
const makeKeyPair = () => {
    const privKey = signer.makePrivateKey();
    return {
        public: signer.getPublicKey(privKey),
        private: privKey
    };
}

// Save key-pairs to localStorage.
const saveUsers = (users) => {
    // // Join keys into pairs.
    // const paired = keys.map(pair => [pair.public, pair.private].join(','));
    // // Join pairs into key-pair string and save to localStorage.
    // localStorage.setItem(KEY_NAME, paired.join(';'));
    const paired = users.map(user => [user.name, user.public_key, user.private_key, user.address].join('||'));
    localStorage.setItem(KEY_NAME, paired.join(';;'));
}

// Fetch current berry-chain state from the validator.
const getState = (cb) => {
    // Call the validator API.
    $.get(`${API_URL}/state?address=${PREFIX}`, ({ data }) => {
        cb(data.reduce((processed, datum) => {
            if (datum.data !== '') {
                const parsed = JSON.parse(atob(datum.data));
                // Confirm the subject.
                if (datum.address[7] === '0') processed.assets.push(parsed);
                if (datum.address[7] === '1') processed.transfers.push(parsed);
            }
            return processed;
        }, { assets: [], transfers: [] }));
    });
}

// Submit signed transaction to the validator.
const submitUpdate = (payload, privKey, cb) => {
    const txn = new TransactionEncoder(privKey, {
        inputs: [PREFIX],
        outputs: [PREFIX],
        familyName: FAMILY,
        familyVersion: VERSION,
        payloadEncoding: 'application/json',
        payloadEncoder: p => Buffer.from(JSON.stringify(p))
    }).create(payload);
    const batchBytes = new BatchEncoder(privKey).createEncoded(txn);
    $.post({
        url: `${API_URL}/batches?wait`,
        data: batchBytes,
        headers: { 'Content-Type': 'application/octet-stream' },
        processData: false,
        dataType: 'json',
        success: function () {
            cb(true)
        },
        error: function () {
            cb(false);
        }
    });
}

module.exports = {
    getUsers,
    makeKeyPair,
    saveUsers,
    getState,
    submitUpdate
}