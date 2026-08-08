import { signInWithPopup, signOut as firebaseSignOut, GoogleAuthProvider } from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import { sheetsService } from './googleSheets';

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;
    if (token) {
      localStorage.setItem('googleAccessToken', token);
      sheetsService.setAccessToken(token);
    }
    return result.user;
  } catch (error) {
    console.error('Error signing in with Google', error);
    throw error;
  }
}

// Re-authenticate silently to get a fresh token that includes any newly added scopes (e.g. drive.readonly)
export async function refreshGoogleToken() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;
    if (token) {
      localStorage.setItem('googleAccessToken', token);
      sheetsService.setAccessToken(token);
    }
    return token;
  } catch (error) {
    console.error('Error refreshing token', error);
    return null;
  }
}

export async function signOut() {
  try {
    await firebaseSignOut(auth);
    localStorage.removeItem('googleAccessToken');
    localStorage.removeItem('spreadsheetId');
    sheetsService.setAccessToken('');
  } catch (error) {
    console.error('Error signing out', error);
    throw error;
  }
}

