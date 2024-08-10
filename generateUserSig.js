import LibGenerateTestUserSig from './lib-generate-test-usersig-es.min.js';

const SDKAPPID = 20011061; // Replace with your SDKAPPID
const EXPIRETIME = 604800; // Expiry time in seconds (7 days)
const SECRETKEY = 'b58d70e23509fbbc69a506a852866b937dc0559f4ca5220e2fbe737b92af8d7a'; // Replace with your SECRETKEY

function genTestUserSig(userID) {
    const generator = new LibGenerateTestUserSig(SDKAPPID, SECRETKEY, EXPIRETIME);
    const userSig = generator.genTestUserSig(userID);

    return {
        sdkAppID: SDKAPPID,
        userSig,
    };
}

export default genTestUserSig;