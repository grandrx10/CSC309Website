// App.jsx (or your root component)
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SignIn from './pages/Signin/Signin';
import Home from './pages/Home/Home';
import Events from './pages/Features/Events';

import Event from './pages/Events/Event';
import EventsList from './pages/Events/EventsList'
import CreateEvent from './pages/Events/CreateEvent';
import Promotions from './pages/Features/Promotions';
import Transactions from './pages/Features/Transactions/Transactions';
import Transfer from './pages/Features/Transactions/Transfer';
import Redeem from './pages/Features/Transactions/Redeem';
import Settings from './pages/Home/Settings';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SignIn />} />
        <Route path="/home" element={<Home />}/>
        <Route path="/events" element={<EventsList />} />
        <Route path="/events/create" element={<CreateEvent />} />

        <Route path="/events/:eventId" element={<Event />} />
        <Route path="/events/:eventId/edit" element={<Event editMode={true} />} />
        <Route path="/events/:eventId/users" element={<Event showUsers={true} />} />


        <Route path="/promotions" element={<Promotions />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/transfer" element={<Transfer />} />
        <Route path="/redeem" element={<Redeem />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Router>
  );
}

export default App;
