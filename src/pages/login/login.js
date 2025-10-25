import {
	CognitoUserPool,
	CognitoUserAttribute,
	CognitoUser,
    AuthenticationDetails,
} from 'amazon-cognito-identity-js';

const userPoolId = import.meta.env.USER_POOL_ID;
const clientId = import.meta.env.CLIENT_ID;
const region = import.meta.env.REGION;
const username = import.meta.env.USERNAME;
const mainPassword = import.meta.env.PASSWORD;

export async function login(password) {
    var authenticationData = {
        Username: username,
        Password: password,
    };
    var authenticationDetails = new AuthenticationDetails(
        authenticationData
    );
    var poolData = {
        UserPoolId: userPoolId, // Your user pool id here
        ClientId: clientId, // Your client id here
    };
    var userPool = new CognitoUserPool(poolData);
    var userData = {
        Username: username,
        Pool: userPool,
    };
    var cognitoUser = new CognitoUser(userData);

    return new Promise((resolve, reject) => {
        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: function(result) {
                var accessToken = result.getAccessToken().getJwtToken();
        
                //POTENTIAL: Region needs to be set if not already set previously elsewhere.
                AWS.config.region = region;
        
                AWS.config.credentials = new AWS.CognitoIdentityCredentials({
                    IdentityPoolId: '...', // your identity pool id here
                    Logins: {
                        // Change the key below according to the specific region your user pool is in.
                        [`cognito-idp.${region}.amazonaws.com/${userPoolId}`]: result
                            .getIdToken()
                            .getJwtToken(),
                    },
                });
        
                //refreshes credentials using AWS.CognitoIdentity.getCredentialsForIdentity()
                AWS.config.credentials.refresh(error => {
                    if (error) {
                        console.error(error);
                        reject(
                            err.message || JSON.stringify(err)
                        );
                    } else {
                        // Instantiate aws sdk service objects now that the credentials have been updated.
                        // example: var s3 = new AWS.S3();
                        console.log('Successfully logged!');
                    }
                });
            },
        
            onFailure: function(err) {
                alert(err.message || JSON.stringify(err));
            },

            newPasswordRequired: function(userAttributes, requiredAttributes) {
                if(mainPassword == null) {
                    console.error("No password provided")
                    reject("No password provided");
                }

                cognitoUser.completeNewPasswordChallenge(mainPassword, sessionUserAttributes);

                // the api doesn't accept this field back
                delete userAttributes.email_verified;
    
                // store userAttributes on global variable
                sessionUserAttributes = userAttributes;

            },
        });

        
    });
}