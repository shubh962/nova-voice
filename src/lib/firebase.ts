
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  projectId: "bhashavoice-a50xr",
  appId: "1:1042978088862:web:1f46f49c17cd05a1e7188f",
  storageBucket: "bhashavoice-a50xr.firebasestorage.app",
  apiKey: "AIzaSyCDwk2tF85-idxHE-Tzq8dL3iO5MlY6IG8",
  authDomain: "bhashavoice-a50xr.firebaseapp.com",
  measurementId: "",
  messagingSenderId: "1042978088862"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };
