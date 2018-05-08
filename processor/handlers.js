'use strict'

// Imports.
const { TransactionHandler } = require('sawtooth-sdk/processor');
const { InvalidTransaction } = require('sawtooth-sdk/processor/exceptions');
const { TransactionHeader } = require('sawtooth-sdk/protobuf');
const { FAMILY, PREFIX, getAddress } = require('./config');

// Function: Prefix all asset addresses with 00.
const getAssetAddress = (name) => PREFIX + '00' + getAddress(name, 62);

// Function: Prefix all request addresses with 01.
const getRequestAddress = (name) => PREFIX + '01' + getAddress(name, 62);

// Function: Prefix all transport addresses with 02.
const getTransportAddress = (name) => PREFIX + '02' + getAddress(name, 62);

// Function: Encode the given object using json encoding.
const encode = (obj) => Buffer.from(JSON.stringify(obj));

// Function: Decode the given buffer using json decoding.
const decode = (buf) => JSON.parse(buf.toString());

// Function: Verify the availability of an entry.
const verifyEntryAvailability = (entry) => {
    if (entry && entry.length > 0) throw new InvalidTransaction('Entry availability test failed.');
}

// Function: Verify the existance of an entry.
const verifyEntryExistance = (entry) => {
    if (!entry || entry.length === 0) throw new InvalidTransaction('Entry existance test failed.');
}

// Function: Verify the ownership of an asset entry.
const verifyAssetOwnership = (entry, owner) => {
    if (entry && entry.length > 0) {
        const decodedEntry = decode(entry);
        if (!decodedEntry || !decodedEntry.asset || !decodedEntry.asset.owner || !decodedEntry.asset.owner.name || decodedEntry.asset.owner.name !== owner.name) {
            throw new InvalidTransaction('Asset entry ownership test failed.');
        }
    }
}

// Function: Create an asset and submit the payload to te ledger.
const create = (state, name, owner, status, date) => {
    try {
        // Get the asset address.
        const assetAddress = getAssetAddress(name);
        // Get the entry in the ledger for the given address.
        return state.get([assetAddress]).then(entries => {
            // Verify the entry is not taken and the address is available.
            const entry = entries[assetAddress];
            verifyEntryAvailability(entry);
            // Construct data.
            let data = { [assetAddress]: encode({ 'asset': { 'name': name, 'date': date, 'status': status, 'owner': owner } }) };
            // Update ledger.
            return state.set(data);
        });
    } catch (err) {
        throw new InvalidTransaction('handlers.create: ' + err.message);
    }
}

// Function: Create a request and submit the payload to the ledger.
const request = (state, asset, owner, target, status, date) => {
    try {
        // Get the asset address.
        const assetAddress = getAssetAddress(asset.name);
        // Get the request address.
        const requestAddress = getRequestAddress(asset.name);
        // Get the entry in the ledger for the given addresses.
        return state.get([requestAddress, assetAddress]).then(entries => {
            // Verify the entry is not taken and the address is available.
            const requestEntry = entries[requestAddress];
            verifyEntryAvailability(requestEntry);
            // Verify there is an entry and it's owned by the owner.
            const assetEntry = entries[assetAddress];
            verifyEntryExistance(assetEntry);
            verifyAssetOwnership(assetEntry, target);
            // Construct data.
            let data = {
                [requestAddress]: encode({ 'request': { 'asset': asset, 'owner': owner, 'target': target, 'status': status, 'date': date } })
            };
            // Update ledger.
            return state.set(data);
        });
    } catch (err) {
        throw new InvalidTransaction('handlers.request: ' + err.message);
    }
}

// Function: Accept a request and submit the payload to the ledger.
const acceptRequest = (state, asset, owner, target, status, date) => {
    try {
        // Get the asset address.
        const assetAddress = getAssetAddress(asset.name);
        // Get the request address.
        const requestAddress = getRequestAddress(asset.name);
        // Get the entry in the ledger for the given addresses.
        return state.get([assetAddress, requestAddress]).then(entries => {
            // Verify the request entry exists.
            const requestEntry = entries[requestAddress];
            verifyEntryExistance(requestEntry);
            // Verify the asset entry exists and it's owned by the owner.
            const assetEntry = entries[assetAddress];
            verifyEntryExistance(assetEntry);
            verifyAssetOwnership(assetEntry, owner);
            // Construct data.
            let data = {
                [requestAddress]: Buffer(0),
                [assetAddress]: encode({ 'asset': { 'name': asset.name, 'date': date, 'status': status, 'owner': target } })
            };
            // Update ledger.
            return state.set(data);
        });
    } catch (err) {
        throw new InvalidTransaction('handlers.acceptRequest: ' + err.message);
    }
}

// Function: Reject a request and submit the payload to the ledger.
const rejectRequest = (state, asset, owner, status, date) => {
    try {
        // Get the asset address.
        const assetAddress = getAssetAddress(asset.name);
        // Get the request address.
        const requestAddress = getRequestAddress(asset.name);
        // Get the entry in the ledger for the given addresses.
        return state.get([assetAddress, requestAddress]).then(entries => {
            // Verify the request entry exists.
            const requestEntry = entries[requestAddress];
            verifyEntryExistance(requestEntry);
            // Verify the asset entry exists and it's owned by the owner.
            const assetEntry = entries[assetAddress];
            verifyEntryExistance(assetEntry);
            verifyAssetOwnership(assetEntry, owner);
            // Construct data.
            let data = {
                [requestAddress]: Buffer(0)
            };
            // Update ledger.
            return state.set(data);
        });
    } catch (err) {
        throw new InvalidTransaction('handlers.rejectRequest: ' + err.message);
    }
}

// Function: Update an asset's status and submit the payload to the ledger.
const updateStatus = (state, asset, owner, status, date) => {
    try {
        // Get the asset address.
        const assetAddress = getAssetAddress(asset.name);
        // Get the entry in the leger for the given address.
        return state.get([assetAddress]).then(entries => {
            // Verify the asset entry exists and it's owned by the owner.
            const assetEntry = entries[assetAddress];
            verifyEntryExistance(assetEntry);
            verifyAssetOwnership(assetEntry, owner);
            // Construct data.
            let data = {
                [assetAddress]: encode({ 'asset': { 'name': asset.name, 'date': date, 'status': status, 'owner': owner } })
            };
            // Update ledger.
            return state.set(data);
        });
    } catch (err) {
        throw new InvalidTransaction('handlers.updateStatus: ' + err.message);
    }
}

// Function: Create a transport request and submit the payload to the ledger.
const requestTransport = (state, asset, owner, target, transporter, status, date) => {
    try {
        // Get the asset address.
        const assetAddress = getAssetAddress(asset.name);
        // Get the transport address.
        const transportAddress = getTransportAddress(asset.name);
        // Get the entry in the ledger for the given addresses.
        return state.get([transportAddress, assetAddress]).then(entries => {
            // Verify the entry is not taken and the address is available.
            const transportEntry = entries[transportAddress];
            verifyEntryAvailability(transportEntry);
            // Verify there is an entry and it's owned by the owner.
            const assetEntry = entries[assetAddress];
            verifyEntryExistance(assetEntry);
            verifyAssetOwnership(assetEntry, owner);
            // Construct data.
            let data = {
                [transportAddress]: encode({ 'transport': { 'asset': asset, 'owner': owner, 'target': target, 'transporter': transporter, 'status': status, 'date': date } })
            };
            // Update ledger.
            return state.set(data);
        });
    } catch (err) {
        throw new InvalidTransaction('handlers.requestTransport: ' + err.message);
    }
}

// Function: Accept a transport request and submit the payload to the ledger.
const acceptTransportRequest = (state, asset, owner, target, transporter, status, date) => {
    try {
        // Get the asset address.
        const assetAddress = getAssetAddress(asset.name);
        // Get the transport address.
        const transportAddress = getTransportAddress(asset.name);
        // Get the entry in the ledger for the given addresses.
        return state.get([assetAddress, transportAddress]).then(entries => {
            // Verify the transport entry exists.
            const transportEntry = entries[transportAddress];
            verifyEntryExistance(transportEntry);
            // Verify the asset entry exists and it's owned by the owner.
            const assetEntry = entries[assetAddress];
            verifyEntryExistance(assetEntry);
            verifyAssetOwnership(assetEntry, owner);
            // Construct data.
            let data = {
                [transportAddress]: encode ({ 'transport': { 'asset': asset, 'owner': owner, 'target': target, 'transporter': transporter, 'status': status, 'date': date } })
            };
            // Update ledger.
            return state.set(data);
        });
    } catch (err) {
        throw new InvalidTransaction('handlers.acceptTransportRequest: ' + err.message);
    }
}

// Function: Reject a transport request and submit the payload to the ledger.
const rejectTransportRequest = (state, asset, owner, target, transporter, status, date) => {
    try {
        // Get the asset address.
        const assetAddress = getAssetAddress(asset.name);
        // Get the transport address.
        const transportAddress = getTransportAddress(asset.name);
        // Get the entry in the ledger for the given addresses.
        return state.get([assetAddress, transportAddress]).then(entries => {
            // Verify the transport entry exists.
            const transportEntry = entries[transportAddress];
            verifyEntryExistance(transportEntry);
            // Verify the asset entry exists and it's owned by the owner.
            const assetEntry = entries[assetAddress];
            verifyEntryExistance(assetEntry);
            verifyAssetOwnership(assetEntry, owner);
            // Construct data.
            let data = {
                [transportAddress]: Buffer(0)
            };
            // Update ledger.
            return state.set(data);
        });
    } catch (err) {
        throw new InvalidTransaction('handlers.acceptTransportRequest: ' + err.message);
    }
}

// Function: Finalize a transport and submit the payload to the ledger.
const finalizeTransport = (state, asset, owner, target, transporter, status, date) => {
    try {
        // Get the asset address.
        const assetAddress = getAssetAddress(asset.name);
        // Get the transport address.
        const transportAddress = getTransportAddress(asset.name);
        // Get the entry in the leger for the given address.
        return state.get([assetAddress, transportAddress]).then(entries => {
            // Verify the transport entry exists.
            const transportEntry = entries[transportAddress];
            verifyEntryExistance(transportEntry);
            // Verify the asset entry exists and it's owned by the owner.
            const assetEntry = entries[assetAddress];
            verifyEntryExistance(assetEntry);
            verifyAssetOwnership(assetEntry, owner);
            // Construct data.
            let data = {
                [transportAddress]: Buffer(0),
                [assetAddress]: encode({ 'asset': { 'name': asset.name, 'date': date, 'status': status, 'owner': target } })
            };
            // Update ledger.
            return state.set(data);
        });
    } catch (err) {
        throw new InvalidTransaction('handlers.finalizeTransport: ' + err.message);
    }
}

// Class: Definition for transaction handler.
class JSONHandler extends TransactionHandler {
    // Constructor: Use base constructor definition to setup the class.
    constructor() {
        super(FAMILY, '0.0', 'application/json', [PREFIX]);
    }

    // Function: Override the apply method to redirect the payload to the correct function.
    apply(txn, state) {
        // Parse the transaction header and payload.
        const header = TransactionHeader.decode(txn.header);
        const signer = header.signerPubkey;
        const { action, asset, owner, target, transporter, date, type, status } = JSON.parse(txn.payload);
        // Redirect the payload to the correct function based on the given action.
        switch (action) {
            case 'create':
                return create(state, asset, owner, status, date);
                break;
            case 'request':
                return request(state, asset, owner, target, status, date);
                break;
            case 'acceptRequest':
                return acceptRequest(state, asset, owner, target, status, date);
                break;
            case 'rejectRequest':
                return rejectRequest(state, asset, owner, status, date);
                break;
            case 'updateStatus':
                return updateStatus(state, asset, owner, status, date);
                break;
            case 'requestTransport':
                return requestTransport(state, asset, owner, target, transporter, status, date);
                break;
            case 'rejectTransportRequest':
                return rejectTransportRequest(state, asset, owner, target, transporter, status, date);
                break;
            case 'acceptTransportRequest':
                return acceptTransportRequest(state, asset, owner, target, transporter, status, date);
                break;
            case 'finalizeTransport':
                return finalizeTransport(state, asset, owner, target, transporter, status, date);
                break;
            default:
                return Promise.resolve().then(() => { throw new InvalidTransaction('Wrong action provided: ' + action) });
                break;
        }
    }
}

// Exports: Transaction handler.
module.exports = {
    JSONHandler
}