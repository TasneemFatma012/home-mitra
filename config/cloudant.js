const { CloudantV1 } = require("@ibm-cloud/cloudant");
const { IamAuthenticator } = require("ibm-cloud-sdk-core");



const cloudant = new CloudantV1({
    authenticator: new IamAuthenticator({
        apikey: process.env.CLOUDANT_APIKEY
    }),
    serviceUrl: process.env.CLOUDANT_URL,
    timeout: 120000, 
});



module.exports = cloudant;
