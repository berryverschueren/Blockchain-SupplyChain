// import * as secp256k1 from 'secp256k1';
// import { randomBytes, createHash } from 'crypto';
const { makeKeyPair } = require( '../state');
const { signer } = require('sawtooth-sdk-client');
const chai = require('chai');
let expect = chai.expect;


chai.Assertion.addProperty('hexString', function() {
    this.assert(
        typeof this._obj === 'string' && /^[0-9a-f]*$/.test(this._obj),
        'expected #{this} to be a hexadecimal string',
        'expected #{this} to not be a hexadecimal string'
    );
});

describe('Test State.js', function() {

    // // Function: Create a new key pair.
    // const makeKeyPair = () => {
    //     // Generate a private key.
    //     const privKey = signer.makePrivateKey();
    //     // Return proper json.
    //     return {
    //         // Generate public key based on private key.
    //         public: signer.getPublicKey(privKey),
    //         private: privKey
    //     };
    // }

    describe('makeKeyPair', function() {
        let keys = null;

        beforeEach(function() {
            keys = makeKeyPair();
        });

        it('should return an object with two keys', function() {
            expect(keys).to.have.property('private');
            expect(keys).to.have.property('public');
        });

        it('should have keys that are hexadecimal strings', function() {
            const { private, public } = keys;
            expect(private).to.be.a.hexString;
            expect(public).to.be.a.hexString;
        });

        it('should have a public key derived from its private key', function() {
            const { private, public } = keys;
            expect(public).to.equal(signer.getPublicKey(private));
        });
    });
});