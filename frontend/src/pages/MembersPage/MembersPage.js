import React, { useEffect } from 'react';
// Import the Members component from its correct location
import Members from './components/Members/Members.js'; 

function MembersPage() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  }, []);

  return (
    // This page just renders the Members component
    <Members />
  );
}

export default MembersPage;