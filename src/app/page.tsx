import { redirect } from 'next/navigation';

export default function RootPage() {
  // Automatically redirect to the dashboard.
  // The dashboard page has logic to redirect to /login if the user isn't authenticated.
  redirect('/dashboard');
}
