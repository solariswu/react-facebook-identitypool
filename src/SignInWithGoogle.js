import React, { useEffect, useState } from "react";
import { Auth } from "@aws-amplify/auth";
import { API } from "@aws-amplify/api";

import { graphqlOperation } from "@aws-amplify/api-graphql";
import { updateMycounter } from "./graphql/mutations";
import { listMycounters } from "./graphql/queries";

// To federated sign in from Google
const SignInWithGoogle = () => {
  useEffect(() => {
    const ga =
      window.gapi && window.gapi.auth2
        ? window.gapi.auth2.getAuthInstance()
        : null;

    if (!ga) createScript();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [isSignedIn, setIsSignedIn] = useState(false);
  const [count, setCount] = useState(null);
  const [userInfo, setUserInfo] = useState('');

  const signInChanged = async (isSignedIn) => {
    console.log("Listen isSignedIn:", isSignedIn);
    setIsSignedIn(isSignedIn);
    const auth2 = window.gapi.auth2.getAuthInstance();

    if (isSignedIn && auth2.isSignedIn.get()) {
      var googleUser = auth2.currentUser.get();
      const profile = googleUser.getBasicProfile();
      const username = profile.getName();
      setUserInfo (username);

      await getAWSCredentials(googleUser);
      await _getCounter();
    }
    else {
      setUserInfo ('');
    }
  };

  const signIn = async () => {
    const ga = window.gapi.auth2.getAuthInstance();
    ga.signIn();
  };

  const signOut = () => {
    if (window.gapi) {
      const auth2 = window.gapi.auth2.getAuthInstance();
      if (auth2 != null) {
        auth2.signOut().then(auth2.disconnect().then(setCount(0)));
      }
    }
  };

  const getAWSCredentials = async (googleUser) => {
    const { id_token, expires_at } = googleUser.getAuthResponse();
    const profile = googleUser.getBasicProfile();
    let user = {
      email: profile.getEmail(),
      name: profile.getName(),
    };

    const credentials = await Auth.federatedSignIn(
      "google",
      { token: id_token, expires_at },
      user
    );
    console.log("credentials", credentials);
  };

  const createScript = () => {
    // load the Google SDK
    const script = document.createElement("script");
    script.src = "https://apis.google.com/js/platform.js";
    script.async = true;
    script.onload = initGapi;
    document.body.appendChild(script);
  };

  const client_id =
    "837142416803-2cq1u3p1i12f47lu3ph7inqrhbrbpoac.apps.googleusercontent.com";

  const initGapi = () => {
    // init the Google SDK client
    const g = window.gapi;
    g.load("auth2", function () {
      const auth2 = g.auth2.init({
        client_id,
        // authorized scopes
        scope: "profile email openid",
        cookiepolicy: "single_host_origin",
        ux_mode: 'popup',
      });
      auth2.isSignedIn.listen(signInChanged);
    });
  };

  //GraphQL
  const _getCounter = async () => {
    try {
      const counterData = await API.graphql(graphqlOperation(listMycounters));
      console.log("counterData", counterData);
      const counterItem = counterData.data.listMycounters.items[0];
      const counter = { id: counterItem.id, value: counterItem.value };
      setCount(counter);
    } catch (err) {
      console.log("error fetching counter", err);
    }
  };

  const increaseCounter = () => {
    const counter = {};
    // try {
    counter.value = count.value + 1;
    counter.id = count.id;
    API.graphql(graphqlOperation(updateMycounter, {input: counter}))
    .then (() => setCount(counter));
  };

  return (
    <div id="gSignInWrapper">
      <div>User: {userInfo}</div>
      {isSignedIn ? (
        <div>
          <div id="signOutBtn" className="customGPlusSignIn" onClick={signOut}>
            <span className="icon"></span>
            <span className="buttonText">Sign Out</span>
          </div>
          <div> Counter: {count? count.value: '...'} </div>
          <button onClick={increaseCounter}>Increase</button>
          <br></br>
        </div>
      ) : (
        <div id="customBtn" className="customGPlusSignIn" onClick={signIn}>
          <span className="icon"></span>
          <span className="buttonText">Sign In with Google</span>
        </div>
      )}
    </div>
  );
};

export default SignInWithGoogle;
