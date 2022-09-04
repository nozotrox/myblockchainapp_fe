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

    // IssueDocument adds document to the blockchain with given details.
    async IssueDocument(ctx, id, organization, docyType, docName, studentName, grade, issueDate, imgHash, owner) {
        const exists = await this.DocumentExists(ctx, id);
        if (exists) {
            throw new Error(`The asset ${id} already exists`);
        }

        const dt = new Date();
        const updatedAt = `${dt.getDate()}/${dt.getMonth()+1}/${dt.getFullYear()} ${dt.getHours()+2}:${dt.getMinutes()}:${dt.getSeconds()}`;

        const asset = {
            id,
            organization,
            docyType,
            docName,
            studentName,
            grade,
            issueDate,
            imgHash,
            owner,
            updatedAt
        };

        await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(asset))));
        return JSON.stringify(asset);
    }

    // ReadDocument returns the document stored in the world state with given id.
    async ReadDocument(ctx, id) {
        const assetJSON = await ctx.stub.getState(id); // get the asset from chaincode state
        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`The asset ${id} does not exist`);
        }
        return assetJSON.toString();
    }

    // UpdateDocument updates an existing document in the world state with provided parameters.
    async UpdateDocument(ctx, id, organization, docyType, docName, studentName, grade, issueDate, imgHash, owner) {
        const exists = await this.DocumentExists(ctx, id);
        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        }

        let assetJSON = await ctx.stub.getState(id);
        assetJSON = JSON.parse(assetJSON);

        if(assetJSON.owner !== owner) { 
            throw new Error(`The asset ${id} does not belong to organization`);
        }

        const dt = new Date();
        const updatedAt = `${dt.getDate()}/${dt.getMonth()+1}/${dt.getFullYear()} ${dt.getHours()+2}:${dt.getMinutes()}:${dt.getSeconds()}`;

        // overwriting original asset with new asset
        const updatedDocument = {
            ...assetJSON,
            organization,
            docyType,
            docName,
            studentName,
            grade,
            issueDate,
            imgHash,
            updatedAt
        };
        
        return ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(updatedDocument))));
    }

    // DeleteDocument deletes an given asset from the world state.
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

    // GetDocumentHistory returns all the transaction history performed on the document.
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
