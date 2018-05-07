'use strict'

// Imports.
const $ = require('jquery');
const { getUsers, makeKeyPair, saveUsers, getState, submitUpdate } = require('./state');
const { addOption, addRow, clearInput, clearText, clearOptions } = require('./components');

// Object: Application cache.
const app = { user: null, otherUser: null, users: [], assets: [], requests: [], transports: [] }

// Function: Clear application views.
app.clearViews = function () {
    clearText('#txt_assetName');
    clearText('#txt_newUsername');
    clearText('#txt_newAddress');
    clearInput('#tbl_allAssets');
    clearOptions('[name="sel_requestTarget"]');
    clearInput('#tbl_incomingRequests');
    clearOptions('[name="sel_incomingRequests"]');
    clearOptions('[name="sel_assetStatus"]');
    clearText('#txt_assetStatus');
    clearOptions('[name="sel_requestTransport"]');
    clearInput('#tbl_allTransports');
    clearOptions('[name="sel_incomingTransportRequests"]');
}

// Function: Refresh application cache data and views.
app.refresh = function () {
    // Retrieve current state of the ledger.
    getState(({ assets, requests, transports }) => {
        // Cache the assets found.
        this.assets = assets;
        // Cache the requests found.
        this.requests = requests;
        // Cache the transports found.
        this.transports = transports;
        // Repopulate views.
        this.clearViews();
        this.assets.forEach(asset => {
            // Add an entry to the application view.
            addRow('#tbl_allAssets', asset.name, asset.status, asset.owner.name);
            if (this.user && asset.owner.name === this.user.name) {
                addOption('[name="sel_assetStatus"]', asset.name, asset.name);
                addOption('[name="sel_requestTransport"]', asset.name, asset.name);
            }
        });
        this.transports.forEach(transport => {
            // Add an entry to the application view.
            addRow('#tbl_allTransports', transport.owner.name, transport.target.name, transport.transporter.name, transport.asset.name);
        });
        if (this.user) {
            // Clear application views.
            clearInput('#tbl_incomingRequests');
            this.requests.forEach(request => {
                if (request.target.name === this.user.name) {
                    // Add an entry to the application view.
                    addRow('#tbl_incomingRequests', request.owner.name, request.target.name, request.asset.name);
                    addOption('[name="sel_incomingRequests"]', request.asset.name, request.owner.name + ' => ' + request.asset.name);
                }
            });
            this.transports.forEach(transport => {
                if (transport.transporter.name === this.user.name) {
                    // Add an entry to the application view.
                    addOption('[name="sel_incomingTransportRequests"]', transport.asset.name, transport.owner.name + ' => ' + transport.asset.name + ' => ' + transport.target.name);
                }
            });
        }
        if (this.otherUser) {
            // Verify selection.
            if (this.otherUser) {
                // Clear application views.
                clearInput('#tbl_otherUsersAssets');
                clearOptions('[name="sel_requestTarget"]');
                this.assets.forEach(asset => {
                    if (asset.owner.name === this.otherUser.name) {
                        // Add an entry to the application view.
                        addRow('#tbl_otherUsersAssets', asset.name, asset.status, asset.owner.name);
                        addOption('[name="sel_requestTarget"]', asset.name, asset.name);
                    }
                });
            }
        }
    });
}

// Function: Submit data to the transaction processor.
app.update = function (data) {
    // Verify user selection.
    if (this.user) {
        // Add a timestamp to the payload. (UNIX)
        data['date'] = Date.now() / 1000 | 0;
        // Submit data to the transaction processor.
        // Refresh using a callback if the submission succeeded.
        submitUpdate(data, this.user.private_key, success => success ? app.refresh() : null);
    }
}

// Event: Handle click event of btn_newUser.
$('#btn_newUser').on('click', function () {
    // Retrieve input values.
    const newUsername = $('#txt_newUsername').val();
    const newAddress = $('#txt_newAddress').val();
    // Verify input values.
    if (newUsername && newAddress) {
        // Check if username is taken.
        const alreadyExists = app.users.find(user => user.name === newUsername);
        if (!alreadyExists) {
            // Create a keypair for the newly created user.
            const keyPair = makeKeyPair();
            // Construct json for the new user.
            // Combining the keypair and the input values.
            app.user = {
                name: newUsername,
                public_key: keyPair.public,
                private_key: keyPair.private,
                address: newAddress
            }
            // Add the user to the application cache.
            app.users.push(app.user);
            // Save cache to localStorage of the browser.
            saveUsers(app.users);
            // Add an entry to the application view.
            addOption('[name="sel_currentUser"]', app.user.public_key, app.user.name);
        } else {
            alert('Username is taken! Try another one please.');
        }
    }
    // Clear input fields.
    clearText('#txt_newUsername');
    clearText('#txt_newAddress');
});

// Event: Handle change event of sel_currentUser.
$('[name="sel_currentUser"]').on('change', function () {
    // Reset otherUser.
    app.otherUser = null;
    // If none was selected.
    if (this.value === 'none') {
        // Clear user selection.
        app.user = null;
    } else {
        // Change user selection.
        app.user = app.users.find(user => user.public_key === this.value);
    }
    // Fill sel_otherUser with the correct names.
    if (app.user) {
        clearOptions('[name="sel_otherUser"]');
        clearInput('#tbl_otherUsersAssets');
        app.users.forEach(otherUser => {
            // Add all users except for the current user to the application view.
            if (otherUser.name != app.user.name) {
                addOption('[name="sel_otherUser"]', otherUser.public_key, otherUser.name);
            }
        });
    }
    // Refresh application.
    app.refresh();
});

// Event: Handle click event of btn_createAsset.
$('#btn_createAsset').on('click', function () {
    // Retrieve input value.
    const assetName = $('#txt_assetName').val();
    // Check if asset name is already taken.
    const asset = app.assets.find(asset => asset.name === assetName);
    if (asset) {
        alert('Asset name is already taken! Try another one please.');
    }
    if (!app.user) {
        alert('Select a user first!');
    }
    // Verify input value and user selection.
    if (assetName && !asset && app.user) {
        // Construct payload.
        let data = {
            'action': 'create',
            'asset': assetName,
            'owner': app.user,
            'status': 'Asset created!'
        };
        // Submit payload.
        app.update(data);
    }
    // Clear input field.
    clearText('#txt_assetName');
});

// Event: Handle change event of sel_otherUser.
$('[name="sel_otherUser"]').on('change', function () {
    // If none was selected.
    if (this.value === 'none') {
        // Clear other user selection.
        app.otherUser = null;
    } else {
        // Change user selection.
        app.otherUser = app.users.find(user => user.public_key === this.value);
    }
    // Fill sel_transporter with the correct names.
    if (app.user && app.otherUser) {
        clearOptions('[name="sel_transporter"]');
        app.users.forEach(transporter => {
            // Add all users except for the current user and the other user to the application view.
            if (transporter.name != app.user.name && transporter.name != app.otherUser.name) {
                addOption('[name="sel_transporter"]', transporter.public_key, transporter.name);
            }
        });
    }
    // Refresh application.
    app.refresh();
});

// Event: Handle click event of btn_requestTarget.
$('#btn_requestTarget').on('click', function () {
    // Retrieve selected values.
    const assetName = $('[name="sel_requestTarget"]').val();
    const asset = app.assets.find(asset => asset.name === assetName);
    // Verify values.
    if (asset && app.otherUser) {
        // Construct payload.
        let data = {
            'action': 'request',
            'asset': asset,
            'owner': app.user,
            'target': app.otherUser,
            'status': 'Transfer requested!'
        };
        // Submit payload.
        app.update(data);
    }
});

// Event: Handle click event of btn_acceptRequest.
$('#btn_acceptRequest').on('click', function () {
    // Retrieve selected values.
    const assetName = $('[name="sel_incomingRequests"]').val();
    const request = app.requests.find(request => request.asset.name === assetName && request.target.name === app.user.name);
    // Verify values.
    if (request && app.user) {
        // Construct payload.
        let data = {
            'action': 'acceptRequest',
            'asset': request.asset,
            'owner': app.user,
            'target': request.owner,
            'status': 'Request accepted!'
        };
        // Submit payload.
        app.update(data);
    }
});

// Event: Handle click event of btn_rejectRequest.
$('#btn_rejectRequest').on('click', function () {
    // Retrieve selected values.
    const assetName = $('[name="sel_incomingRequests"]').val();
    const request = app.requests.find(request => request.asset.name === assetName && request.target.name === app.user.name);
    // Verify values.
    if (request && app.user) {
        // Construct payload.
        let data = {
            'action': 'rejectRequest',
            'asset': request.asset,
            'owner': app.user,
            'target': request.owner,
            'status': 'Request rejected!'
        };
        // Submit payload.
        app.update(data);
    }
});

// Event: Handle click event of btn_assetStatus.
$('#btn_assetStatus').on('click', function () {
    // Retrieve selected values.
    const assetName = $('[name="sel_assetStatus"]').val();
    const asset = app.assets.find(asset => asset.name === assetName);
    const newStatus = $('#txt_assetStatus').val();
    // Verify values.
    if (asset && newStatus && app.user) {
        // Construct payload.
        let data = {
            'action': 'updateStatus',
            'asset': asset,
            'owner': app.user,
            'status': newStatus
        };
        // Submit payload.
        app.update(data);
    }
});

// Event: Handle click event of btn_requestTransport.
$('#btn_requestTransport').on('click', function () {
    // Retrieve selected values.
    const assetName = $('[name="sel_requestTransport"]').val();
    const asset = app.assets.find(asset => asset.name === assetName);
    const userPubkey = $('[name="sel_transporter"]').val();
    const transporter = app.users.find(user => user.public_key === userPubkey);
    // Verify values.
    if (asset && app.user && app.otherUser && transporter) {
        // Construct payload.
        let data = {
            'action': 'requestTransport',
            'asset': asset,
            'owner': app.user,
            'target': app.otherUser,
            'transporter': transporter,
            'status': 'Transport requested!'
        };
        // Submit payload.
        app.update(data);
    }
});

// Event: Handle click event of btn_acceptTransportRequest.
$('#btn_acceptTransportRequest').on('click', function () {
    // Retrieve selected values.
    const assetName = $('[name="sel_incomingTransportRequests"]').val();
    const transport = app.transports.find(transport => transport.asset.name === assetName && transport.transporter.name === app.user.name);
    // Verify values.
    if (transport && app.user) {
        // Construct payload.
        let data = {
            'action': 'acceptTransportRequest',
            'asset': transport.asset,
            'owner': app.user,
            'target': transport.target,
            'status': 'Transport request accepted!'
        };
        // Submit payload.
        app.update(data);
    }
});

// Event: Handle click event of btn_rejectTransportRequest.
$('#btn_rejectTransportRequest').on('click', function () {
    // Retrieve selected values.
    const assetName = $('[name="sel_incomingTransportRequests"]').val();
    const transport = app.transports.find(transport => transport.asset.name === assetName && transport.transporter.name === app.user.name);
    // Verify values.
    if (transport && app.user) {
        // Construct payload.
        let data = {
            'action': 'rejectTransportRequest',
            'asset': transport.asset,
            'owner': app.user,
            'target': transport.target,
            'status': 'Transport request rejected!'
        };
        // Submit payload.
        app.update(data);
    }
});

// Initialize application.
// Load all saved users from the localStorage of the browser to the application cache.
app.users = getUsers();
// Add an entry for each user.
app.users.forEach(user => addOption('[name="sel_currentUser"]', user.public_key, user.name));
// Refresh application.
app.refresh();