'use strict'

// Imports.
const $ = require('jquery');
const { signer, BatchEncoder, TransactionEncoder } = require('sawtooth-sdk-client');
const { REST_API_PROXY, KEY_NAME, FAMILY, VERSION, PREFIX } = require('./config');

// Function: Load users from localStorage of the browser.
const getUsers = () => {
    // Get data from localStorage.
    const storedUsers = localStorage.getItem(KEY_NAME);
    // If there is no data, return an empty array.
    if (!storedUsers) return [];
    // Otherwise split the data into userProperties using the delimiter ';;'.
    return storedUsers.split(';;').map((userProperties) => {
        // Further split the userProperties into users using the delimiter '||'.
        const user = userProperties.split('||');
        // Return proper json objects.
        return {
            name: user[0],
            public_key: user[1],
            private_key: user[2],
            address: user[3]
        };
    });
}

// Function: Create a new key pair.
const makeKeyPair = () => {
    // Generate a private key.
    const privKey = signer.makePrivateKey();
    // Return proper json.
    return {
        // Generate public key based on private key.
        public: signer.getPublicKey(privKey),
        private: privKey
    };
}

// Function: Save users to localStorage of the browser.
const saveUsers = (users) => {
    // Combine user json object properties delimited by '||'.
    const paired = users.map(user => [user.name, user.public_key, user.private_key, user.address].join('||'));
    // Combine the total user strings delimited by ';;'.
    // And save to localStorage.
    localStorage.setItem(KEY_NAME, paired.join(';;'));
}

// Function: Fetch the current state of the ledger from the validator.
const getState = (cb) => {
    // Use the provided API to retrieve the data.
    $.get(`${REST_API_PROXY}/state?address=${PREFIX}`, ({ data }) => {
        // Reduce the amount of data to process.
        cb(data.reduce((processed, datum) => {
            // Verify there is data at all.
            if (datum.data !== '') {
                // Decode the base64 encoded data.
                const parsed = JSON.parse(atob(datum.data));
                if (datum.address[7] === '0') processed.assets.push(parsed.asset);
                if (datum.address[7] === '1') processed.requests.push(parsed.request);
            }
            // Return processed data.
            return processed;
        }, { assets: [], requests: [] }));
    });
}

// Function: Submit a signed transaction to the validator.
const submitUpdate = (payload, privKey, cb) => {
    // Construct a transaction.
    const txn = new TransactionEncoder(privKey, {
        inputs: [PREFIX],
        outputs: [PREFIX],
        familyName: FAMILY,
        familyVersion: VERSION,
        // Encode payload using json encoding.
        payloadEncoding: 'application/json',
        payloadEncoder: p => Buffer.from(JSON.stringify(p))
    }).create(payload);
    // Encode entire transaction using base64 encoding.
    const batchBytes = new BatchEncoder(privKey).createEncoded(txn);
    // Post the constructed batch using the provided API.    
    $.post({
        url: `${REST_API_PROXY}/batches?wait`,
        data: batchBytes,
        headers: { 'Content-Type': 'application/octet-stream' },
        processData: false,
        dataType: 'json',
        // Handle the callback of the post call.
        success: function () {
            cb(true)
        },
        error: function () {
            cb(false);
        }
    });
}

// Exports: Functions.
module.exports = {
    getUsers,
    makeKeyPair,
    saveUsers,
    getState,
    submitUpdate
}