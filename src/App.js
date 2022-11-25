import Web3 from "web3";
import { useState } from "react";
import { ethers } from "ethers";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithCustomToken, signOut } from "firebase/auth";
import axios from "axios";

import "./App.css";
import ConnectWalletButton from "./components/ConnectWalletButton";
import mobileCheck from "./helpers/mobileCheck";
import getLinker from "./helpers/deepLink";

const firebaseConfig = {
  apiKey: "AIzaSyBx6r4AMasP2K29WtmVzeu8TNVL3B9FDXo",
  authDomain: "meta-mask-972fe.firebaseapp.com",
  projectId: "meta-mask-972fe",
  storageBucket: "meta-mask-972fe.appspot.com",
  messagingSenderId: "503290585296",
  appId: "1:503290585296:web:eed2ebc94ac902295ebed5",
  measurementId: "G-LM5M6HZJD3"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const App = () => {
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState("");

  const onPressConnect = async () => {
    setLoading(true);

    try {
      const yourWebUrl = "mysite.com"; // Replace with your website domain
      const deepLink = `https://metamask.app.link/dapp/${yourWebUrl}`;
      const downloadMetamaskUrl = "https://metamask.io/download.html";

      if (window?.ethereum?.isMetaMask) {
        // Desktop browser
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });

        console.log(`accounts :: ${JSON.stringify(accounts)}`)
        const account = Web3.utils.toChecksumAddress(accounts[0]);

        await handleLogin(account);
      } else if (mobileCheck()) {
        // Mobile browser
        const linker = getLinker(downloadMetamaskUrl);
        linker.openURL(deepLink);
      } else {
        window.open(downloadMetamaskUrl);
      }
    } catch (error) {
      console.log(error);
    }

    setLoading(false);
  };

  const handleLogin = async (address) => {
    const baseUrl = "http://18.143.150.128:4000"; // "http://localhost:4000";
    const response = await axios.get(`${baseUrl}/message?address=${address}`);
    const messageToSign = response?.data?.messageToSign;

    if (!messageToSign) {
      throw new Error("Invalid message to sign");
    }

    const userData = await axios.get(`${baseUrl}/user?address=${address}`).then(res => res.data);
    
    let customToken
    let signature
    if (userData && !userData.customToken) {
      const web3 = new Web3(Web3.givenProvider);
      signature = await web3.eth.personal.sign(messageToSign, address);
  
      const jwtResponse = await axios.get(
        `${baseUrl}/jwt?address=${address}&signature=${signature}`
      );
  
      customToken = jwtResponse?.data?.customToken;

      const headers = { 
        'Authorization': 'Bearer my-token',
        'My-Custom-Header': 'foobar'
      };
  
      const data = { address, signature, customToken };
      await axios.post(`${baseUrl}/signature`,data ,{headers});
    } else {
      customToken = userData.customToken
    }
    
    if (!customToken) {
      throw new Error("Invalid JWT");
    }

    await window.ethereum.request({
      method: 'eth_getBalance',
      params: [address, 'latest']
    }).then(balance => {
      // Return string value to convert it into int balance
    console.log(balance) 
    setBalance(balance)
      
    // Yarn add ethers for using ethers utils or
    // npm install ethers
    console.log(ethers.utils.formatEther(balance))
    // Format the string into main latest balance
    })

    await signInWithCustomToken(auth, customToken);
    setAddress(address);
  };

  const onPressLogout = () => {
    setAddress("");
    signOut(auth);
  };

  return (
    <div className="App">
      <header className="App-header">
        <ConnectWalletButton
          onPressConnect={onPressConnect}
          onPressLogout={onPressLogout}
          loading={loading}
          address={address}
        />
        <form>
          <label style={{fontSize: 18}}>Address : 
            <input
              type="text"
              value={address || ""}
              style={{ width: 350 }} 
            />
          </label>
        </form>
        <form>
          <label style={{fontSize: 18}}>Balance : 
            <input
              type="text"
              value={balance || ""}
              style={{ width: 350 }} 
            />
          </label>
        </form>
      </header>
    </div>
  );
};

export default App;