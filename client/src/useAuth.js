import { useState, useEffect } from "react";
import axios from "axios";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase/firebase";
import { UserContext } from "./contexts/googleuser.context";
import { useContext } from "react";
import { redirect } from "react-router";

export default function useAuth(code) {
  const { currentUser } = useContext(UserContext);

  const [accessToken, setAccessToken] = useState();
  const [refreshToken, setRefreshToken] = useState();
  const [expiresIn, setExpiresIn] = useState();

  //const userRef = doc(db, 'users',

  useEffect(() => {
    axios
      .post("http://localhost:3001/login", {
        code,
      })
      .then((res) => {
        setAccessToken(res.data.accessToken);
        setRefreshToken(res.data.refreshToken);
        setExpiresIn(res.data.expiresIn);
        const userRef = doc(db, "users", `${currentUser.uid}`);
        setDoc(
          userRef,
          {
            accessToken: res.data.accessToken,
            refreshToken: res.data.refreshToken,
          },
          { merge: true }
        );
        window.history.pushState({}, null, "/");
      })
      .catch(() => {
        window.location = "/";
      });
  }, [code]);

  useEffect(() => {
    if (!refreshToken || !expiresIn) return;
    const interval = setInterval(() => {
      axios
        .post("http://localhost:3001/refresh", {
          refreshToken,
        })
        .then((res) => {
          setAccessToken(res.data.accessToken);
          setExpiresIn(res.data.expiresIn);
        })
        .catch(() => {
          window.location = "/";
        });
    }, (expiresIn - 60) * 1000);

    return () => clearInterval(interval);
  }, [refreshToken, expiresIn]);

  return accessToken;
}
