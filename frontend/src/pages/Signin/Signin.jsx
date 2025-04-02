import { useState } from "react";
import styles from "./Signin.module.css";
import { useNavigate } from "react-router-dom"; // Add this import

function SignIn() {
  const [utorid, setUtorid] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:3100/auth/tokens", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ utorid, password }),
      });

      if (!response.ok) {
        throw new Error("Invalid credentials");
      }

      const data = await response.json();
      console.log("JWT Token:", data.token);
      
      // Store the token (usually in localStorage or context)
      localStorage.setItem('authToken', data.token);
      
      // Redirect to home page
      navigate('/events');
      
      setError(""); // Clear errors on success
    } catch (err) {
      setError(err.message);
    }
  };


  return (
    <div className={styles.container}>
      <div className={styles.formContainer}>
        <h2 className={styles.title}>Sign In</h2>
        <form onSubmit={handleLogin} className={styles.form}>
          <input
            type="text"
            placeholder="UTORid"
            value={utorid}
            onChange={(e) => setUtorid(e.target.value)}
            required
            className={styles.input}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={styles.input}
          />
          <button type="submit" className={styles.button}>
            Sign In
          </button>
        </form>
        {error && <p className={styles.error}>{error}</p>}
      </div>
    </div>
  );
}

export default SignIn;