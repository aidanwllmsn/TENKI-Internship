import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { usePageContext } from '../context/PageContext';
import styles from './index.module.css';

const ItemsPage = () => {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const { pageState } = usePageContext();

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch('/api/items');
      const result = await response.json();
      if (result.success) {
        setItems(result.data);
      }
    };
    fetchData();
  }, []);

  const removeItem = async (id) => {
    const response = await fetch('/api/removeItem', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id }),
    });
    const result = await response.json();
    if (result.success) {
      setItems(items.filter(item => item._id !== id));
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Saved Keywords</title>
      </Head>
      <main className={styles.main}>
        <div className="header">
          <h1 className={styles.title}>Saved Keywords</h1>
          <button onClick={() => router.push('/')} className={styles.dataButton}>Go back</button>
        </div>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.KeywordsColumn}>Keywords</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id}>
                  <td>{item.name}</td>
                  <td>
                    <button onClick={() => removeItem(item._id)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default ItemsPage;
