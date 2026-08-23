import './globals.css';
import { AuthProvider } from '../lib/AuthContext';
import AppGate from '../components/AppGate';

export const metadata = {
  title: 'TaskFlow — Project Manager',
  description: 'Project, product and PD task management',
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&family=IBM+Plex+Sans+Thai:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>
          <AppGate>{children}</AppGate>
        </AuthProvider>
      </body>
    </html>
  );
}
