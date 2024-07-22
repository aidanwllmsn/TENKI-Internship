import { createContext, useContext, useState } from 'react';

const PageContext = createContext();

export const PageProvider = ({ children }) => {
  const [pageState, setPageState] = useState([]);
  const [isProcessed, setIsProcessed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  return (
    <PageContext.Provider value={{ pageState, setPageState, isProcessed, setIsProcessed, isLoading, setIsLoading }}>
      {children}
    </PageContext.Provider>
  );
};

export const usePageContext = () => useContext(PageContext);

