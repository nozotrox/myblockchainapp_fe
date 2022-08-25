/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

// Deterministic JSON.stringify()
const stringify  = require('json-stringify-deterministic');
const sortKeysRecursive  = require('sort-keys-recursive');
const { Contract } = require('fabric-contract-api');

class DocumentCertification extends Contract {

    async InitLedger(ctx) {
        const documents = [
            {
                id: '0001',
                organization: 'ISCTEM',
                docyType: "Diploma",
                docName: "Backend development certification",
                studentName: 'Satoshi Nakamoto',
                issueDate: "Wed Aug 17 2022",
                imgHash: "haldsjfdowiruflakdflkajf"
            },
        ];
        
        for (const document of documents) {
            ctx.stub.putState(document.ID, Buffer.from(stringify(sortKeysRecursive(document))));
        }
    }

    // CreateAsset issues a new asset to the world state with given details.
    async IssueDocument(ctx, id, organization, docyType, docName, studentName, issueDate, imgHash) {
        const exists = await this.DocumentExists(ctx, id);
        if (exists) {
            throw new Error(`The asset ${id} already exists`);
        }

        const asset = {
            id,
            organization,
            docyType,
            docName,
            studentName,
            issueDate,
            imgHash
        };

        await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(asset))));
        return JSON.stringify(asset);
    }

    // ReadDocument returns the asset stored in the world state with given id.
    async ReadDocument(ctx, id) {
        const assetJSON = await ctx.stub.getState(id); // get the asset from chaincode state
        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`The asset ${id} does not exist`);
        }
        return assetJSON.toString();
    }

    // UpdateDocument updates an existing asset in the world state with provided parameters.
    async UpdateDocument(ctx, id, organization, docyType, docName, studentName, issueDate, imgHash) {
        const exists = await this.DocumentExists(ctx, id);
        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        }
        let assetJSON = await ctx.stub.getState(id);
        assetJSON = JSON.parse(assetJSON);

        // overwriting original asset with new asset
        const updatedDocument = {
            ...assetJSON,
            organization,
            docyType,
            docName,
            studentName,
            issueDate,
            imgHash
        };
        
        return ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(updatedDocument))));
    }

    // DeleteAsset deletes an given asset from the world state.
    async DeleteDocument(ctx, id) {
        const exists = await this.DocumentExists(ctx, id);
        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        }
        return ctx.stub.deleteState(id);
    }

    // DocumentExists returns true when asset with given ID exists in world state.
    async DocumentExists(ctx, id) {
        const assetJSON = await ctx.stub.getState(id);
        return assetJSON && assetJSON.length > 0;
    }

    // TransferAsset updates the owner field of asset with given id in the world state.
    /*async TransferAsset(ctx, id, newOwner) {
        const assetString = await this.ReadDocument(ctx, id);
        const asset = JSON.parse(assetString);
        const oldOwner = asset.Owner;
        asset.Owner = newOwner;
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(asset))));
        return oldOwner;
    }*/

    // GetAllAssets returns all assets found in the world state.
    async GetAllDocuments(ctx) {
        const allResults = [];
        // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push(record);
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }

    async GetDocumentHistory(ctx, id) {
        const allResults = []; 
        const iterator = await ctx.stub.getHistoryForKey(id);
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(result.value.value.toString('utf8'));
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push(record);
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }
}

module.exports = DocumentCertification;
