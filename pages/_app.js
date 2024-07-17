import { PageProvider } from '../context/PageContext';
import styles from "./index.module.css";

function MyApp({ Component, pageProps }) {
  return (
    <PageProvider>
      <Component {...pageProps} />
    </PageProvider>
  );
}

export default MyApp;
