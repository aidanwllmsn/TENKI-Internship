import React from 'react';

/** Component to display HTML listing */

const RawHtmlComponent = ({ htmlContent, width, height }) => {
  return (
    <div 
      style={{ width, height, border: 'none' }}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};

export default RawHtmlComponent;