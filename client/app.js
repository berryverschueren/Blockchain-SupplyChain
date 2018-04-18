'use strict'

// Imports.
const $ = require('jquery');
const { getUsers, makeKeyPair, saveUsers, getState, submitUpdate } = require('./state');
const { addOption, addRow, clearInput, clearText } = require('./components');

// Object: Application cache.
const app = { user: null, users: [], assets: [] }

// Function: Clear application views.
app.clearViews = function () {
    clearText('#txt_assetName');
    clearInput('#tbl_allAssets');
    clearInput('#tbl_history');
    clearText('#txt_newUsername');
    clearText('#txt_newAddress');
}

// Function: Refresh application cache data and views.
app.refresh = function () {
    // Retrieve current state of the ledger.
    getState(({ assets }) => {
        // Cache the assets found.
        this.assets = assets;
        // Repopulate views.
        this.clearViews();
        assets.forEach(asset => {
            // Add an entry to the application view.
            addRow('#tbl_allAssets', asset.name, asset.status, asset.owner.name);
        });
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
    // If none was selected.
    if (this.value === 'none') {
        // Clear user selection.
        app.user = null;
    } else {
        // Change user selection.
        app.user = app.users.find(user => user.public_key === this.value);
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

// Initialize application.
// Load all saved users from the localStorage of the browser to the application cache.
app.users = getUsers();
// Add an entry for each user.
app.users.forEach(user => addOption('[name="sel_currentUser"]', user.public_key, user.name));
// Refresh application.
app.refresh();