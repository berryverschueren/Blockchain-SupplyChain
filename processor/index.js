'use strict'

const { TransactionProcessor } = require('sawtooth-sdk/processor');
const { JSONHandler } = require('./handlers');
const { VALIDATOR_TCP } = require('./config');
const VALIDATOR_URL = VALIDATOR_TCP; //'tcp://localhost:4004';

// Initialize the Transaction Processor.
const txProc = new TransactionProcessor(VALIDATOR_URL);
txProc.addHandler(new JSONHandler());
txProc.start();