import * as React from "react";
import * as ReactDOM from "react-dom";
import {
  AuthenticationDetails,
  CognitoUserPool,
  CognitoUserAttribute,
  CognitoUser,
} from "amazon-cognito-identity-js";

const poolData = {
  UserPoolId: process.env.USER_POOL_ID, // Your user pool id here
  ClientId: process.env.CLIENT_ID, // Your client id here
};

const userPool = new CognitoUserPool(poolData);

const App = () => {
  const [cognitoUser, setCognitoUser] = React.useState<CognitoUser>(
    userPool.getCurrentUser()
  );

  const login = (event: React.FormEvent<HTMLFormElement>) => {
    const data = new FormData(event.target);
    const details = {
      Username: data.get("username") as string,
      Password: data.get("password") as string,
    };
    console.log(`Form submitted: ${JSON.stringify(details)}`);
    event.preventDefault();

    const userData = {
      Username: details.Username,
      Pool: userPool,
    };
    const authenticationDetails = new AuthenticationDetails(details);
    const newCognitoUser = new CognitoUser(userData);
    newCognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: function (result) {
        // var accessToken = result.getAccessToken().getJwtToken();
        // console.log(`accessToken: ${accessToken}`);
        setCognitoUser(newCognitoUser);
      },
      onFailure: function (err) {
        console.error(err.message || JSON.stringify(err));
      },
      mfaSetup: function (challengeName, challengeParameters) {
        newCognitoUser.associateSoftwareToken(this);
      },
      // associateSecretCode: function(secretCode) {
      //   var challengeAnswer = prompt('Please input the TOTP code.', '');
      //   cognitoUser.verifySoftwareToken(challengeAnswer, 'My TOTP device', this);
      // },
      selectMFAType: function (challengeName, challengeParameters) {
        var mfaType = prompt("Please select the MFA method.", ""); // valid values for mfaType is "SMS_MFA", "SOFTWARE_TOKEN_MFA"
        newCognitoUser.sendMFASelectionAnswer(mfaType, this);
      },
      totpRequired: function (secretCode) {
        var challengeAnswer = prompt("Please input the TOTP code.", "");
        newCognitoUser.sendMFACode(challengeAnswer, this, "SOFTWARE_TOKEN_MFA");
      },
      mfaRequired: function (codeDeliveryDetails) {
        var verificationCode = prompt("Please input verification code", "");
        newCognitoUser.sendMFACode(verificationCode, this);
      },
    });
  };

  const logout = () => {
    cognitoUser.signOut();
    setCognitoUser(null);
  };

  return (
    <div>
      <h1>Cognito Test Harness</h1>
      <div>Pool Data: {JSON.stringify(poolData)}</div>
      <h2>Current User</h2>
      <pre>{JSON.stringify(cognitoUser, null, 2)}</pre>
      {!cognitoUser && (
        <form onSubmit={login}>
          <div>
            <span>User name:</span>
            <input type="text" name="username" style={{ width: 200 }}></input>
          </div>
          <div>
            <span>Password:</span>
            <input
              type="password"
              name="password"
              style={{ width: 200 }}
            ></input>
          </div>
          <button type="submit">Log-in</button>
        </form>
      )}
      {!!cognitoUser && <button onClick={logout}>Logout</button>}
    </div>
  );
};

ReactDOM.render(<App />, document.querySelector("#root"));
