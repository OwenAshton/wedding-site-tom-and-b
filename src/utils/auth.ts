import {
  CognitoUserPool,
} from "amazon-cognito-identity-js";

const userPoolId = import.meta.env.USER_POOL_ID;
const clientId = import.meta.env.CLIENT_ID;

export function isLoggedIn() {
  const userPool = new CognitoUserPool({
    UserPoolId: userPoolId,
    ClientId: clientId,
  });

  const cognitoUser = userPool.getCurrentUser();
  
  return cognitoUser && cognitoUser.getSignInUserSession().isValid();
}