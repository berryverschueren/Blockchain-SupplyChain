'use strict'

const { createHash } = require('crypto');
const $ = require('jquery');
const { signer, BatchEncoder, TransactionEncoder } = require('sawtooth-sdk-client');

// Encoding helper
const getAddress = (key, length = 64) => createHash('sha512').update(key).digest('hex').slice(0, length);

// Configuration variables.
const KEY_NAME = 'berry-chain.keys',
    API_URL = 'http://172.22.0.3:8008',
    FAMILY = 'berry-chain',
    VERSION = '0.0',
    PREFIX = getAddress(FAMILY, 6);

// Fetch key-pairs from localStorage.
const getKeys = () => {
    const storedKeys = localStorage.getItem(KEY_NAME);
    // Verify key-pairs exist.
    if (!storedKeys) return [];
    // Split and return key-pairs.
    return storedKeys.split(';').map((pair) => {
        const separated = pair.split(',');
        return {
            public: separated[0],
            private: separated[1]
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
const saveKeys = (keys) => {
    // Join keys into pairs.
    const paired = keys.map(pair => [pair.public, pair.private].join(','));
    // Join pairs into key-pair string and save to localStorage.
    localStorage.setItem(KEY_NAME, paired.join(';'));
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
    getKeys,
    makeKeyPair,
    saveKeys,
    getState,
    submitUpdate
}