import { Redirect } from 'expo-router';

/** Entry aplikasi: pengguna yang belum login diarahkan ke login. */
export default function IndexRoute() {
  return <Redirect href="/login" />;
}
