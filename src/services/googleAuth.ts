import { signInWithPopup, signInWithCredential, signOut as firebaseSignOut, GoogleAuthProvider } from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import { sheetsService } from './googleSheets';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

// Initialize the plugin for BOTH web and native
GoogleAuth.initialize({
  clientId: "136500364240-hqsirv6umistflqmu7kcgeoh41co8gt4.apps.googleusercontent.com",
  scopes: ['profile', 'email', 'https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive.appdata'],
  grantOfflineAccess: true,
});

export async function signInWithGoogle() {
  try {
    if (Capacitor.isNativePlatform()) {
      // Use native Capacitor Google Auth
      const user = await GoogleAuth.signIn() as any;
      const idToken = user.authentication?.idToken || user.idToken;
      const accessToken = user.authentication?.accessToken || user.accessToken;
      
      const credential = GoogleAuthProvider.credential(idToken);
      const result = await signInWithCredential(auth, credential);
      
      if (accessToken) {
        localStorage.setItem('googleAccessToken', accessToken);
        sheetsService.setAccessToken(accessToken);
      }
      return result.user;
    } else {
      // Use standard web popup
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      if (token) {
        localStorage.setItem('googleAccessToken', token);
        sheetsService.setAccessToken(token);
      }
      return result.user;
    }
  } catch (error) {
    console.error('Error signing in with Google', error);
    throw error;
  }
}

// Re-authenticate with forced consent
export async function refreshGoogleToken() {
  try {
    if (Capacitor.isNativePlatform()) {
       // Refresh native token
       const user = await GoogleAuth.refresh() as any;
       const accessToken = user.authentication?.accessToken || user.accessToken;
       if (accessToken) {
         localStorage.setItem('googleAccessToken', accessToken);
         sheetsService.setAccessToken(accessToken);
       }
       return accessToken;
    } else {
      const driveProvider = new GoogleAuthProvider();
      driveProvider.addScope('https://www.googleapis.com/auth/spreadsheets');
      driveProvider.addScope('https://www.googleapis.com/auth/drive.appdata');
      driveProvider.setCustomParameters({ prompt: 'consent' });

      const result = await signInWithPopup(auth, driveProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      if (token) {
        localStorage.setItem('googleAccessToken', token);
        sheetsService.setAccessToken(token);
      }
      return token;
    }
  } catch (error) {
    console.error('Error refreshing token', error);
    return null;
  }
}

export async function signOut() {
  try {
    await firebaseSignOut(auth);
    if (Capacitor.isNativePlatform()) {
      await GoogleAuth.signOut();
    }
    localStorage.removeItem('googleAccessToken');
    localStorage.removeItem('spreadsheetId');
    sheetsService.setAccessToken('');
  } catch (error) {
    console.error('Error signing out', error);
    throw error;
  }
}
