import { useState } from "react";
import AuthPage from "./components/AuthPage";
import "./App.css";

function App() {
  const [currentUser, setCurrentUser] = useState(null);

  function handleAuthSuccess(email) {
    setCurrentUser(email);
  }

  if (!currentUser) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="logged-container">
      <h1>Dobrodošli, {currentUser}!</h1>
      <p>Ovo je početna verzija aplikacije bez funkcionalnosti.</p>
    </div>
  );
}

export default App;
