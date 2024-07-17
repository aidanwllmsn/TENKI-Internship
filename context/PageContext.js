import { createContext, useContext, useState } from 'react';

const PageContext = createContext();

export const PageProvider = ({ children }) => {
  const [pageState, setPageState] = useState([]);

  return (
    <PageContext.Provider value={{ pageState, setPageState }}>
      {children}
    </PageContext.Provider>
  );
};

export const usePageContext = () => useContext(PageContext);
