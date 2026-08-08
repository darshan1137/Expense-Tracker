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

// Re-authenticate with forced consent so Google issues a fresh token with ALL scopes (including drive.readonly)
export async function refreshGoogleToken() {
  try {
    const driveProvider = new GoogleAuthProvider();
    driveProvider.addScope('https://www.googleapis.com/auth/spreadsheets');
    driveProvider.addScope('https://www.googleapis.com/auth/drive.readonly');
    // 'consent' forces Google to show the full permissions screen and issue a NEW token
    driveProvider.setCustomParameters({ prompt: 'consent' });

    const result = await signInWithPopup(auth, driveProvider);
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

