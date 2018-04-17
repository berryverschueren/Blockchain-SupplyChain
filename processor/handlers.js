'use strict'

const { createHash } = require('crypto');
const { TransactionHandler } = require('sawtooth-sdk/processor');
const { InvalidTransaction } = require('sawtooth-sdk/processor/exceptions');
const { TransactionHeader } = require('sawtooth-sdk/protobuf');

// Encryption/hashing helpers and constants.
const getAddress = (key, length = 64) => createHash('sha512').update(key).digest('hex').slice(0, length);

// Family name and hashed prefix.
const FAMILY = 'berry-chain';
const PREFIX = getAddress(FAMILY, 6);

// Address helpers and constants.
const getAssetAddress = (name) => PREFIX + '00' + getAddress(name, 62);
const getTransferAddress = (asset) => PREFIX + '01' + getAddress(asset, 62);

// Encoding/decoding helpers and constants.
const encode = (obj) => {
    const jsonString = JSON.stringify(obj);//, Object.keys(obj).sort());
    return Buffer.from(jsonString);
}
const decode = (buf) => {
    const jsonString = JSON.parse(buf.toString());
    return jsonString;
}

// Check helpers and constants.
const verifyTarget = (signer, entry) => {
    if (!entry || entry.length === 0 || signer !== decode(entry).transfer.target.public_key) throw new InvalidTransaction('Not target.');
}
const verifyOwnership = (signer, entry) => {
    if (!entry || entry.length === 0 || signer !== decode(entry).asset.owner.public_key) throw new InvalidTransaction('Not owner.');
}
const verifyExistance = (entry) => {
    if (!entry || entry.length === 0) throw new InvalidTransaction('Asset does not exist.');
}
const verifyAvailability = (entry) => {
    if (entry && entry.length > 0) throw new InvalidTransaction('Asset name in use.');
}

// Add asset to state.
const create = (state, name, owner, status, date) => {
    // Get asset address.
    const assetAddress = getAssetAddress(name);
    return state.get([assetAddress]).then(entries => {
        // Retrieve entry for address.
        const entry = entries[assetAddress];
        // Verify address is available.
        verifyAvailability(entry);
        // Construct data.
        let data = { [assetAddress]: encode({ asset: { 'name': name, 'date': date, 'status': status, 'owner': owner } }) };
        // Update state.
        return state.set(data);
    });
}

// Propose transfer to state.
const propose = (state, asset, owner, target, signer, status, date) => {
    // Get asset and transfer addresses.
    const transferAddress = getTransferAddress(asset.name);
    const assetAddress = getAssetAddress(asset.name);
    return state.get([assetAddress]).then(entries => {
        // Retrieve entry for address.
        const entry = entries[assetAddress];
        // Verify entry exists and ownership is valid.
        verifyExistance(entry);
        verifyOwnership(signer, entry);
        // Construct data.
        let data = { [transferAddress]: encode({ transfer: { 'asset': asset, 'owner': owner, 'target': target, 'date': date, 'type': 'proposal', 'status': status } }) };
        // Update state.
        return state.set(data);
    });
}

// Accept a transfer proposal.
const acceptProposal = (state, asset, owner, signer, status, date) => {
    // Get asset and transfer addresses.
    const transferAddress = getTransferAddress(asset.name);
    const assetAddress = getAssetAddress(asset.name);
    return state.get([transferAddress]).then(entries => {
        // Retrieve entry for address.
        const entry = entries[transferAddress];
        // Verify entry exists and ownership is valid.
        verifyExistance(entry);
        verifyTarget(signer, entry);
        // Construct data.
        asset.owner = owner;
        let data = {
            [transferAddress]: Buffer(0),
            [assetAddress]: encode({ 'asset': asset, 'owner': owner, 'date': date, 'status': status })
        };
        console.log(data);
        // Update state.
        return state.set(data);
    });
}

// Reject a transfer proposal.
const rejectProposal = (state, asset, signer, status, date) => {
    // Get asset and transfer addresses.
    const transferAddress = getTransferAddress(asset.name);
    return state.get([transferAddress]).then(entries => {
        // Retrieve entry for address.
        const entry = entries[transferAddress];
        // Verify entry exists and ownership is valid.
        verifyExistance(entry);
        verifyTarget(signer, entry);
        // Construct data.
        let data = { [transferAddress]: Buffer(0) };
        // Update state.
        return state.set(data);
    });
}

// Request transfer to state
const request = (state, asset, owner, target, signer, status, date) => {
    // Get asset and transfer addresses.
    const transferAddress = getTransferAddress(asset.name);
    const assetAddress = getAssetAddress(asset.name);
    return state.get([assetAddress]).then(entries => {
        // Retrieve entry for address.
        const entry = entries[assetAddress];
        // Verify entry exists and ownership is valid.
        verifyExistance(entry);
        // Construct data.
        let data = { [transferAddress]: encode({ transfer: { 'asset': asset, 'owner': owner, 'target': target, 'date': date, 'type': 'request', 'status': status } }) };
        // Update state.
        return state.set(data);
    });
}

// Accept a transfer request.
const acceptRequest = (state, asset, owner, signer, status, date) => {
    // Get asset and transfer addresses.
    const transferAddress = getTransferAddress(asset.name);
    const assetAddress = getAssetAddress(asset.name);
    return state.get([transferAddress]).then(entries => {
        // Retrieve entry for address.
        const entry = entries[transferAddress];
        // Verify entry exists and ownership is valid.
        verifyExistance(entry);
        verifyTarget(signer, entry);
        // Construct data.
        asset.owner = decode(entry).transfer.owner;
        let data = {
            [transferAddress]: Buffer(0),
            [assetAddress]: encode({ 'asset': asset, 'owner': owner, 'date': date, 'status': status })
        };
        // Update state.
        return state.set(data);
    });
}

// Reject a transfer request.
const rejectRequest = (state, asset, signer, status, date) => {
    // Get asset and transfer addresses.
    const transferAddress = getTransferAddress(asset.name);
    return state.get([transferAddress]).then(entries => {
        // Retrieve entry for address.
        const entry = entries[transferAddress];
        // Verify entry exists and ownership is valid.
        verifyExistance(entry);
        verifyTarget(signer, entry);
        // Construct data.
        let data = {
            [transferAddress]: Buffer(0)
        };
        // Update state.
        return state.set(data);
    });
}

// Update asset status in state.
const updateStatus = (state, asset, owner, signer, status, date) => {
    // Get asset address.
    const assetAddress = getAssetAddress(asset.name);
    return state.get([assetAddress]).then(entries => {
        const entry = entries[assetAddress];
        verifyExistance(entry);
        verifyOwnership(signer, entry);
        asset.status = status;
        let data = { [assetAddress]: encode({ 'asset': asset, 'owner': owner, 'date': date, 'status': status }) };
        return state.set(data);
    });
}

// Handler for JSON encoded payloads.
class JSONHandler extends TransactionHandler {
    constructor() {
        console.log('Initializing JSON handler for berry-chain.');
        super(FAMILY, '0.0', 'application/json', [PREFIX]);
    }

    // Override apply method to distribute transaction actions.
    apply(txn, state) {
        console.log('apply..');
        // Parse the transaction header and payload.
        const header = TransactionHeader.decode(txn.header);
        const signer = header.signerPubkey;
        console.log(JSON.parse(txn.payload));
        const {
            action,
            asset,
            owner,
            target,
            date,
            type,
            status
        } = JSON.parse(txn.payload);
        // Distribute to designated function based on payload action.
        console.log(`Handling transaction: ${action} > ${asset}`, owner ? `>${owner.name}...` : '', `:: ${signer.slice(0, 8)}...`);
        // Choose correct function based on given action.
        switch (action) {
            case 'create':
                return create(state, asset, owner, status, date);
                break;
            case 'propose':
                return propose(state, asset, owner, target, signer, status, date);
                break;
            case 'acceptProposal':
                return acceptProposal(state, asset, owner, signer, status, date);
                break;
            case 'rejectProposal':
                return rejectProposal(state, asset, signer, status, date);
                break;
            case 'request':
                return request(state, asset, owner, target, signer, status, date);
                break;
            case 'acceptRequest':
                return acceptRequest(state, asset, owner, signer, status, date);
                break;
            case 'rejectRequest':
                return rejectRequest(state, asset, signer, status, date);
                break;
            case 'status':
                return updateStatus(state, asset, owner, signer, status, date);
                break;
            default:
                return Promise.resolve().then(() => { throw new InvalidTransaction('Wrong action provided: ' + action) });
                break;
        }
    }
}

module.exports = {
    JSONHandler
}