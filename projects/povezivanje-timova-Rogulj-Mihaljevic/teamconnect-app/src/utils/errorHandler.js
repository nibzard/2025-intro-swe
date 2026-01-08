// Global error handler za API pozive
export const handleApiError = (error, customMessage = 'Dogodila se greška') => {
  console.error('API Error:', error);
  
  if (error.response) {
    // Server je odgovorio s error statusom
    return error.response.data.message || customMessage;
  } else if (error.request) {
    // Request je poslan ali nema odgovora
    return 'Server nije dostupan. Provjerite internet vezu.';
  } else {
    // Nešto drugo
    return customMessage;
  }
};

// Wrapper za API pozive s automatskim error handlingom
export const apiCall = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API greška');
    }
    
    return await response.json();
  } catch (error) {
    throw error;
  }
};