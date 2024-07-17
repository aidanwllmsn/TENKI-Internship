// pages/items.js
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import styles from './index.module.css';

const ItemsPage = () => {
  const [items, setItems] = useState([]);

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

  return (
   <div className={styles.container}>
   <Head>
     <title>Items Page</title>
   </Head>
   <main className={styles.main}>
     <h1 className={styles.title}>Items from MongoDB</h1>
     <div className={styles.tableContainer}>
       <table className={styles.table}>
         <thead>
           <tr>
             <th>ID</th>
             <th>Name</th>
           </tr>
         </thead>
         <tbody>
           {items.map((item) => (
             <tr key={item._id}>
               <td>{item._id}</td>
               <td>{item.name}</td>
             </tr>
           ))}
         </tbody>
       </table>
     </div>
     <Link href="/">Go back to Home</Link>
   </main>
 </div>
);
};

export default ItemsPage;
