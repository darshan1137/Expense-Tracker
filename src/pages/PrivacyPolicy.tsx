import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6 bg-background text-foreground animate-in fade-in duration-500">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        ← Back
      </Button>
      
      <h1 className="text-3xl font-bold border-b pb-2">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
      
      <div className="space-y-4 text-base leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold mt-6 mb-2">1. Introduction</h2>
          <p>Welcome to Expense Tracker. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our application and tell you about your privacy rights.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-2">2. The Data We Collect About You</h2>
          <p>We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>Identity Data:</strong> includes your Google profile name and profile picture.</li>
            <li><strong>Contact Data:</strong> includes your Google email address.</li>
            <li><strong>Financial Data:</strong> includes your expense categories, amounts, dates, and descriptions.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-2">3. How We Use Your Data (Google OAuth & APIs)</h2>
          <p>This application utilizes Google OAuth 2.0 to authenticate users and access specific Google APIs on your behalf. Our use of information received from Google APIs will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer" className="text-primary hover:underline">Google API Services User Data Policy</a>, including the Limited Use requirements.</p>
          
          <h3 className="font-semibold mt-3">Why we need specific scopes:</h3>
          <ul className="list-disc pl-5 mt-2 space-y-2">
            <li><strong>Google Sheets API:</strong> We require read and write access to your Google Sheets to store your financial data. Your expenses are saved directly to a private spreadsheet in your Google Drive. We do not store your expenses on our own servers.</li>
            <li><strong>Google Drive AppData:</strong> We use the hidden, app-exclusive Application Data folder in Google Drive to store the ID of the spreadsheet we created for you. This allows the app to find your spreadsheet across devices without needing access to any of your other Drive files.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-2">4. Data Storage and Security</h2>
          <p>Your financial data is stored locally on your device (using IndexedDB) and synced directly to your personal Google Sheet. We do not transmit this data to any third-party servers or our own databases. Your Google Access Tokens are stored securely in your browser's local storage and are only used to communicate directly with Google APIs.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-2">5. Data Sharing</h2>
          <p>We do not sell, trade, or otherwise transfer your personally identifiable information or financial data to outside parties. Your data remains strictly between your device and your Google Account.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-2">6. Contact Us</h2>
          <p>If you have any questions about this privacy policy or our privacy practices, please contact us at darshankhapekar.me@gmail.com.</p>
        </section>
      </div>
    </div>
  );
}
