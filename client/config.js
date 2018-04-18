'use strict'

// Imports.
const { createHash } = require('crypto');

// Function: Encoding helper.
const getAddress = (key, length = 64) => createHash('sha512').update(key).digest('hex').slice(0, length);

// Object: Configuration variables.
const REST_API_PROXY = 'http://localhost:3000/api';
const VALIDATOR_TCP = 'tcp://validator:4004';
const REST_API = 'http://rest-api:8008';
const KEY_NAME = 'berry-chain.keys';
const FAMILY = 'berry-chain';
const VERSION = '0.0';
const PREFIX = getAddress(FAMILY, 6);

// Export: Configuration variables.
module.exports = {
    VALIDATOR_TCP,
    REST_API,
    REST_API_PROXY,
    KEY_NAME,
    FAMILY,
    VERSION,
    PREFIX
}