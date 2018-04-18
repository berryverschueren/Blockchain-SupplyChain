'use strict'

// Imports.
const { TransactionHandler } = require('sawtooth-sdk/processor');
const { InvalidTransaction } = require('sawtooth-sdk/processor/exceptions');
const { TransactionHeader } = require('sawtooth-sdk/protobuf');
const { FAMILY, PREFIX, getAddress } = require('./config');

// Function: Prefix all asset addresses with 00.
const getAssetAddress = (name) => PREFIX + '00' + getAddress(name, 62);

// Function: Encode the given object using json encoding.
const encode = (obj) => Buffer.from(JSON.stringify(obj));

// Function: Decode the given buffer using json decoding.
const decode = (buf) => JSON.parse(buf.toString());

// Function: Verify the availability of an asset address.
const verifyAvailability = (entry) => {
    if (entry && entry.length > 0) throw new InvalidTransaction('Asset name in use.');
}

// Function: Create an asset and submit the payload to te ledger.
const create = (state, name, owner, status, date) => {
    // Get the asset address.
    const assetAddress = getAssetAddress(name);
    // Get the entry in the ledger for the given address.
    return state.get([assetAddress]).then(entries => {
        // Verify the entry is not taken and the address is available.
        const entry = entries[assetAddress];
        verifyAvailability(entry);
        // Construct data.
        let data = { [assetAddress]: encode({ asset: { 'name': name, 'date': date, 'status': status, 'owner': owner } }) };
        // Update ledger.
        return state.set(data);
    });
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
        const { action, asset, owner, target, date, type, status } = JSON.parse(txn.payload);
        // Redirect the payload to the correct function based on the given action.
        switch (action) {
            case 'create':
                return create(state, asset, owner, status, date);
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