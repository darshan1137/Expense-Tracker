import { signInWithPopup, signOut as firebaseSignOut, GoogleAuthProvider } from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import { sheetsService } from './googleSheets';

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    // This gives you a Google Access Token. You can use it to access the Google API.
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

export async function signOut() {
  try {
    await firebaseSignOut(auth);
    localStorage.removeItem('googleAccessToken');
    sheetsService.setAccessToken('');
  } catch (error) {
    console.error('Error signing out', error);
    throw error;
  }
}
