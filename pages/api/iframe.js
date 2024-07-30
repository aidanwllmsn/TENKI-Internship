import React from 'react';

const RawHtmlComponent = ({ htmlContent, width, height }) => {
  return (
    <div 
      style={{ width, height, border: 'none' }}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};

export default RawHtmlComponent;