import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { usePageContext } from '../context/PageContext';
import styles from './index.module.css';

const ItemsPage = () => {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const { pageState } = usePageContext();
  const [editingItem, setEditingItem] = useState(null);
  const [newKeywords, setNewKeywords] = useState('');

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

  const updateKeywords = async (id) => {
   const response = await fetch('/api/updateItem', {
     method: 'PUT',
     headers: {
       'Content-Type': 'application/json',
     },
     body: JSON.stringify({ id, name: newKeywords }),
   });
   const result = await response.json();
   if (result.success) {
     setItems(items.map(item =>
       item._id === id ? { ...item, name: newKeywords } : item
     ));
     setEditingItem(null);
     setNewKeywords('');
   } else {
     console.error('Failed to update item:', result.message);
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
              <th>Shop ID</th>
                <th>Item ID</th>
                <th>Keywords</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id}>
                  <td>1234</td>  {/* Example Shop ID, replace with actual data if needed */}
                  <td>{item._id}</td>
                  <td>
                    {editingItem === item._id ? (
                      <input
                        type="text"
                        value={newKeywords}
                        onChange={(e) => setNewKeywords(e.target.value)}
                      />
                    ) : (
                      item.name
                    )}
                  </td>
                  <td>
                    {editingItem === item._id ? (
                      <button onClick={() => updateKeywords(item._id)}>Update</button>
                    ) : (
                      <button onClick={() => { setEditingItem(item._id); setNewKeywords(item.name); }}>Edit</button>
                    )}
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
