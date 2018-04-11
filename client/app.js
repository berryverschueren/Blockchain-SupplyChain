'use strict'

const { createHash } = require('crypto');
const $ = require('jquery');
const { getUsers, makeKeyPair, saveUsers, getState, submitUpdate, getTransactions } = require('./state');
const { addOption, addRow, addAction, clearOptions, clearInput, clearText } = require('./components');
const { REST_API_PROXY } = require('./config');

// Encoding helper
const getAddress = (key, length = 64) => createHash('sha512').update(key).digest('hex').slice(0, length);

const concatNewOwners = (existing, ownerContainers) => {
    return existing.concat(ownerContainers.filter(({ owner }) => !existing.includes(owner)).map(({ owner }) => owner));
}

// Configuration variables.
const KEY_NAME = 'berry-chain.keys',
    API_URL = REST_API_PROXY, //'http://localhost:3000/api',
    FAMILY = 'berry-chain',
    VERSION = '0.0',
    PREFIX = getAddress(FAMILY, 6);

// const app = { user: null, keys: [], assets: [], transfers: [] }
const app = { user: null, users: [], assets: [], requests: [], proposals: [], transportRequests: [], transports: [] }

app.clearViews = function () {
    console.log('Clearing views..');
    clearInput('#tbl_yourAssets');
    clearInput('#tbl_assetDetails');
    clearInput('#lst_yourProposals');
    clearInput('#lst_yourRequests');
    clearText('#txt_assetName');
    clearText('#txt_status');
    clearInput('#tbl_allAssets');
    clearInput('#tbl_history');
    clearOptions('[name="sel_proposalAsset"]');
    clearOptions('[name="sel_proposalTarget"]');
    clearOptions('[name="sel_requestTarget"]');
    clearOptions('[name="sel_requestAsset"]');
    clearOptions('[name="sel_statusAsset"]');
    clearOptions('[name="sel_assetDetails"]');

    clearText('#txt_newUsername');
    clearText('#txt_newAddress');
}

const readableAddress = (address) => {
    return address && address !== 'none' ? address.substring(0, 6) + '..' : address;
}

app.loadTransactionHistory = function () {
    console.log('Loading transaction history..');
    $.get(`${API_URL}/transactions`, ({ data }) => {
        console.log(data);
        if (data && data.length) {
            clearInput('#tbl_history');
            for (let i = 0; i < data.length; i++) {
                const transaction = data[i];
                if (transaction['header']['payload_encoding'] === 'application/json') {
                    let pbk = readableAddress(transaction['header']['batcher_pubkey']);
                    let spk = readableAddress(transaction['header']['signer_pubkey']);
                    const payload = JSON.parse(atob(transaction['payload']));
                    //addRow('#tbl_history', pbk, spk, payload['action'], payload['asset'], readableAddress(payload['owner']), payload['status'], payload['date']);
                    addRow('#tbl_history', payload['asset'], payload['status'], readableAddress(payload['owner']), payload['type'], payload['action'], payload['date'], pbk, spk);
                }
            }
        }
    });
}

app.refresh = function () {
    console.log('Refreshing UI..');
    // Refresh UI of application using the current state of the ledger.
    getState(({ assets, transfers }) => {
        // Get state and copy to local variables.
        this.assets = assets;
        this.transfers = transfers;

        // Clear current views.
        this.clearViews();

        // Repopulate existing views.
        assets.forEach(asset => {
            // Add to tbl_allAssets.
            addRow('#tbl_allAssets', asset.name, asset.status, readableAddress(asset.owner));
            // Add to tbl_yourAssets & sel_proposalAsset & sel_statusAsset if owner === user.
            if (this.user && asset.owner === this.user.public) {
                addRow('#tbl_yourAssets', asset.name, asset.status);
                addOption('[name="sel_proposalAsset"]', asset.name);
                addOption('[name="sel_statusAsset"]', asset.name);
                addOption('[name="sel_assetDetails"]', asset.name);
            }
        });

        // Filter transfers to find owned transfers and create accept/reject entries for each of them.
        transfers.filter(transfer => transfer.target === this.user.public && transfer.type === 'proposal')
            .forEach(transfer => addAction('#lst_yourProposals', transfer.name, 'Accept'));
        transfers.filter(transfer => transfer.target === this.user.public && transfer.type === 'request')
            .forEach(transfer => addAction('#lst_yourRequests', transfer.name, 'Accept'));

        // Retrieve all possible public keys.
        let pubKeys = this.users.map(pair => pair.public);
        pubKeys = concatNewOwners(pubKeys, assets);
        pubKeys = concatNewOwners(pubKeys, transfers);

        // Repopulate sel_proposalTarget & sel_requestTarget with the public keys.
        pubKeys.forEach(key => {
            // Skip key of current user.
            if (this.user && key !== this.user.public) {
                addOption('[name="sel_proposalTarget"]', key);
                addOption('[name="sel_requestTarget"]', key);
            }
        });

        // Load transcation history and repopulate tbl_history.
        this.loadTransactionHistory();
    });
}

app.update = function (data) {
    console.log('Updating ledger..');
    // Verify current user is selected.
    if (this.user) {
        // Add a timestamp to the payload.
        data['date'] = Date.now() / 1000 | 0;
        // Submit data and add user private key to sign the transaction. 
        // Refresh UI if the transaction submission succeeded.
        submitUpdate(data, this.user.private, success => success ? app.refresh() : null);
    }
}

// Select current user.
$('[name="sel_currentUser"]').on('change', function () {
    console.log('Current user selection changed: ' + this.value);
    if (this.value === 'new') {
        // Add new keypair to the localstorage.
        app.user = makeKeyPair();
        console.log(app.user);
        app.users.push(app.user);
        saveUsers(app.users);
        addOption('[name="sel_currentUser"]', app.user.public);
    } else if (this.value === 'none') {
        // Clear current user.
        app.user = null;
    } else {
        // Change current user.
        app.user = app.users.find(key => key.public === this.value);
    }
    // Refresh UI to update using new current user.
    app.refresh();
});

// Propose button clicked.
$('#btn_proposeTransfer').on('click', function () {
    // Retrieve selected values.
    const asset = $('[name="sel_proposalAsset"]').val();
    const target = $('[name="sel_proposalTarget"]').val();
    // Verify values.
    if (asset && target) {
        console.log('Proposing transfer of: ' + asset + ', to: ' + readableAddress(target));
        // Construct payload.
        let data = {
            'action': 'propose',
            'asset': asset,
            'owner': target,
            'status': 'Transfer proposed!'
        };
        // Submit payload.
        app.update(data);
    }
});

// Request target changed.
$('[name="sel_requestTarget"]').on('change', function () {
    console.log('Request target selection changed: ' + this.value);
    // Clear request assets.
    clearOptions('[name="sel_requestAsset"]');
    if (this.value !== 'none') {
        // Repopulate request assets.
        app.assets.forEach(asset => {
            // Verify ownership.
            if (asset.owner === this.value) {
                addOption('[name="sel_requestAsset"]', asset.name);
            }
        });
    }
});

// Asset details selection changed.
$('[name="sel_assetDetails"]').on('change', function () {
    console.log('Asset details selection changed: ' + this.value);
    // Clear asset details table.
    clearInput('#tbl_assetDetails');
    if (this.value !== 'none') {
        // Repopulate asset details table.
        // TODO: get asset details and insert into table.
    }
});

// Request button clicked.
$('#btn_requestTransfer').on('click', function () {
    // Retrieve selected values.
    const target = $('[name="sel_requestTarget"]').val();
    const asset = $('[name="sel_requestAsset"]').val();
    // Verify values.
    if (asset && target) {
        console.log('Requesting transfer of: ' + asset + ', from: ' + readableAddress(target));
        // Construct payload.
        let data = {
            'action': 'request',
            'asset': asset,
            'owner': target,
            'status': 'Transfer requested!'
        };
        // Submit payload.
        app.update(data);
    }
});

// Create new user button clicked.
$('#btn_newUser').on('click', function () {
    // Retrieve input values.
    const newUsername = $('#txt_newUsername').val();
    const newAddress = $('#txt_newAddress').val();
    // Verify values.
    if (newUsername && newAddress) {
        console.log('Creating new user: ' + newUsername + ', ' + newAddress);
        
        const keyPair = makeKeyPair();
        app.user = {
            name: newUsername,
            public_key: keyPair.public,
            private_key: keyPair.private,
            address: newAddress
        }
        app.users.push(app.user);
        saveUsers(app.users);
        addOption('[name="sel_currentUser"]', app.users.name);        
    }
    // Clear input fields.
    clearText('#txt_newUsername');
    clearText('#txt_newAddress');
});

// Create button clicked.
$('#btn_createAsset').on('click', function () {
    // Retrieve input value.
    const asset = $('#txt_assetName').val();
    // Verify value and current user.
    if (asset && app.user) {
        console.log('Creating asset: ' + asset);
        // Construct payload.
        let data = {
            'action': 'create',
            'asset': asset,
            'owner': app.user.public,
            'status': 'Asset created!'
        };
        // Submit payload.
        app.update(data);
    }
    // Clear input field.
    clearText('#txt_assetName');
});

// Change status button clicked.
$('#btn_changeStatus').on('click', function () {
    // Retrieve input values.
    const status = $('#txt_status').val();
    const asset = $('[name="sel_statusAsset"]').val();
    // Verify values and current user.
    if (asset && status && app.user) {
        // Construct payload.
        let data = {
            'action': 'status',
            'asset': asset,
            'owner': app.user.public,
            'status': status
        };
        // Submit payload.
        app.update(data);
    }
    // Clear input field.
    clearText('#txt_status');
});

// Accept proposal.
$('#lst_yourProposals').on('click', '.accept', function () {
    // Retrieve input values.
    const asset = $(this).prev().text();
    // Verify values.
    if (asset && app.user.public) {
        console.log('Accepting proposal of asset: ' + asset);
        // Construct payload.
        let data = {
            'action': 'acceptProposal',
            'asset': asset,
            'owner': app.user.public,
            'status': 'Accepted proposal!'
        }
        // Submit payload.
        app.update(data);
    }
});

// Reject proposal.
$('#lst_yourProposals').on('click', '.reject', function () {
    // Retrieve input values.
    console.log('Reject proposal clicked..');
    const asset = $(this).prev().prev().text();
    console.log(asset);
    console.log(app.user.public);
    // Verify values.
    if (asset && app.user.public) {
        console.log('Rejecting proposal of asset: ' + asset);
        // Construct payload.
        let data = {
            'action': 'rejectProposal',
            'asset': asset,
            'owner': app.user.public,
            'status': 'Rejected proposal!'
        }
        // Submit payload.
        app.update(data);
    }
});
// Accept proposal.
$('#lst_yourRequests').on('click', '.accept', function () {
    // Retrieve input values.
    const asset = $(this).prev().text();
    // Verify values.
    if (asset && app.user.public) {
        console.log('Accepting request of asset: ' + asset);
        // Construct payload.
        let data = {
            'action': 'acceptRequest',
            'asset': asset,
            'owner': app.user.public,
            'status': 'Accepted request!'
        }
        // Submit payload.
        app.update(data);
    }
});

// Reject proposal.
$('#lst_yourRequests').on('click', '.reject', function () {
    // Retrieve input values.
    const asset = $(this).prev().prev().text();
    // Verify values.
    if (asset && app.user.public) {
        console.log('Rejecting request of asset: ' + asset);
        // Construct payload.
        let data = {
            'action': 'rejectRequest',
            'asset': asset,
            'owner': app.user.public,
            'status': 'Rejected request!'
        }
        // Submit payload.
        app.update(data);
    }
});

// Initialize.
app.users = getUsers();
console.log('USERS:');
console.log(app.users);
app.users.forEach(user => addOption('[name="sel_currentUser"]', user.public));
app.refresh();