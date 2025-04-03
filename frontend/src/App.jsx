// App.jsx (or your root component)
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SignIn from './pages/Signin/Signin';
import Home from './pages/Home/Home';
import Events from './pages/Features/Events';

import Event from './components/Events/Event/Event';
import EditEvent from './components/Events/Event/EditEvent';
import EventsView from './components/Events/EventsList/EventsView'
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
        <Route path="/events" element={<EventsView />} />
        <Route path="/events/create" element={<CreateEvent />} />
        <Route path="/events/:eventId/edit" element={<EditEvent />} />
        <Route path="/events/:eventId" element={<Event />} />


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
