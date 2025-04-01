// App.jsx (or your root component)
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SignIn from './pages/Signin/Signin';
import Home from './pages/Home/Home';
import Events from './pages/Features/Events';
import Promotions from './pages/Features/Promotions';
import Transactions from './pages/Features/Transactions';
import Settings from './pages/Home/Settings';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SignIn />} />
        <Route path="/home" element={<Home />}/>
        <Route path="/events" element={<Events />} />
        <Route path="/promotions" element={<Promotions />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Router>
  );
}

export default App;
