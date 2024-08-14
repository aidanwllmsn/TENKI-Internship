import { createContext, useContext, useState } from 'react';

const PageContext = createContext();

export const PageProvider = ({ children }) => {
  const [pageState, setPageState] = useState([]);
  const [isProcessed, setIsProcessed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [listing, setListing] = useState([]);

  return (
    <PageContext.Provider value={{ pageState, setPageState, isProcessed, setIsProcessed, isLoading, setIsLoading, listing, setListing }}>
      {children}
    </PageContext.Provider>
  );
};

export const usePageContext = () => useContext(PageContext);

