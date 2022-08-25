/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const assetTransfer = require('./lib/assetTransfer');
const documentCertification = require('./lib/docCertification')

// module.exports.AssetTransfer = assetTransfer;
module.exports.DocumentCertification = documentCertification
module.exports.contracts = [documentCertification];
