export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  spreadsheetId?: string; // Optional until connected
}
