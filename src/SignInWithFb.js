import React, { useEffect, useState } from "react";
import { Auth } from "@aws-amplify/auth";
import { API } from "@aws-amplify/api";

import { graphqlOperation } from "@aws-amplify/api-graphql";
import { updateMycounter } from "./graphql/mutations";
import { listMycounters } from "./graphql/queries";

// To federated sign in from Facebook
const SignInWithFacebook = () => {
  useEffect(() => {
    if (!window.FB) createScript();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [isSignedIn, setIsSignedIn] = useState(false);
  const [count, setCount] = useState(null);

  const signIn = async () => {
    const fb = window.FB;
    fb.getLoginStatus((response) => {
      if (response.status === "connected") {
        getAWSCredentials(response.authResponse)
        .then (()=> _getCounter());
        // await _getCounter();
        // _getCounter();
      } else {
        fb.login(
          (response) => {
            if (!response || !response.authResponse) {
              return;
            }
            getAWSCredentials(response.authResponse)
            .then (() => _getCounter());
            // await _getCounter();
          },
          {
            // the authorized scopes
            scope: "public_profile,email",
          }
        );
      }
    });
  };

  const signOut = () => {
    window.FB.logout(
      () => {
        console.log ('fb user logout.');
        setIsSignedIn (false);
        setCount (null);
      }
    );
  }

  const getAWSCredentials = async (response) => {
    const { accessToken, expiresIn } = response;
    const date = new Date();
    const expires_at = expiresIn * 1000 + date.getTime();

    const expiresDate = new Date(expires_at);

    console.log("access token expires : ", expiresDate.toLocaleString());

    if (!accessToken) {
      return;
    }

    const fb = window.FB;
    fb.api("/me", { fields: "name,email" }, (response) => {
      const user = {
        name: response.name,
        email: response.email,
      };

    Auth.federatedSignIn(
        "facebook",
        { token: accessToken, expires_at },
        user
    ).then (credentials => 
      console.log("credentails", credentials));
    });
  };

  const createScript = () => {
    // load the sdk
    window.fbAsyncInit = fbAsyncInit;
    const script = document.createElement("script");
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    script.onload = initFB;
    document.body.appendChild(script);
  };

  const initFB = () => {
    // const fb = window.FB;
    console.log("FB SDK initialized");
  };

  const auth_response_change_callback = (response) => {
    console.log("auth_response_change_callback");
    console.log(response);
  };

  const auth_status_change_callback = (response) => {
    if (response.status === 'connected') {
      setIsSignedIn (true);
    }
    console.log("auth_status_change_callback: " + response.status);
  };

  const fbAsyncInit = () => {
    // init the fb sdk client
    const fb = window.FB;
    fb.init({
      appId: "2872561679644543",
      cookie: true,
      xfbml: true,
      version: "v2.11",
    });

    fb.getLoginStatus((response) => {
      if (response.status === "connected") {
        setIsSignedIn (true);
      }
      fb.Event.subscribe( "auth.authResponseChange", auth_response_change_callback);
      fb.Event.subscribe("auth.statusChange", auth_status_change_callback);
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
    API.graphql(graphqlOperation(updateMycounter, { input: counter })).then(
      () => setCount(counter)
    );
  };

  return (
    <div>
    {isSignedIn ? (
      <div>
        <div> Counter: {count? count.value: '...'} </div>
        <button onClick={increaseCounter}>Increase</button>
        <br></br>
        <button class="loginBtn loginBtn--facebook" onClick={signOut}> Sign out</button>
      </div>
    ) : (
      <button class="loginBtn loginBtn--facebook" onClick={signIn}>Sign in with Facebook</button>
    )}
    </div>
  );
};

export default SignInWithFacebook;
