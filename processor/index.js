'use strict'

// Imports
const { TransactionProcessor } = require('sawtooth-sdk/processor');
const { JSONHandler } = require('./handlers');
const { VALIDATOR_TCP } = require('./config');

// Object: Initialize the transaction processor.
const txProc = new TransactionProcessor(VALIDATOR_TCP);
// Add a new transaction handler to the transaction processor.
txProc.addHandler(new JSONHandler());
// Start the transaction processor.
txProc.start();