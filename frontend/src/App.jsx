// App.jsx (or your root component)
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SignIn from './pages/Signin/Signin';
import EventsList from './pages/Events/EventsList'
import CreateEvent from './pages/Events/CreateEvent';
// import Home from './pages/Home/Home';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SignIn />} />
        <Route path="/home" />  { /*element={<Home />} */}
        <Route path="/events" element={<EventsList />} />
        <Route path="/events/create" element={<CreateEvent />} />
      </Routes>
    </Router>
  );
}

export default App;
