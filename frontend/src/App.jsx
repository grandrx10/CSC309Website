// App.jsx (or your root component)
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SignIn from './pages/Signin/Signin';
import Home from './pages/Home/Home';
import Event from './components/Events/Event/Event';
import EditEvent from './components/Events/Event/EditEvent';
import EventsView from './components/Events/EventsList/EventsView';
import CreateEvent from './pages/Events/CreateEvent';

import PromotionList from './pages/Features/Promotions/PromotionList';
import ManagePromotion from './pages/Features/Promotions/ManagePromotions';
import PromotionsListView from './pages/Features/Promotions/PromotionsListView';
import PromotionDetailView from './pages/Features/Promotions/PromotionDetailView';
import PromotionForm from './pages/Features/Promotions/PromotionForm';

import Transactions from './pages/Features/Transactions/Transactions';
import Transfer from './pages/Features/Transactions/Transfer';
import Redeem from './pages/Features/Transactions/Redeem';
import Process from './pages/Features/Transactions/Process';
import Purchase from './pages/Features/Transactions/Purchase';

import Users from './pages/Features/Users/Users';
import UpdateUser from './pages/Features/Users/UpdateUser';
import PromoteUser from './pages/Features/Users/PromoteUser';
import Profile from './components/Profile/Profile';
import EditProfile from './components/Profile/EditProfile';
import ChangePassword from './components/Profile/ChangePassword';

import NotFound from './pages/NotFound';

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


        <Route path="/promotions" element={<PromotionsListView />} />
        <Route path="/promotions/new" element={<PromotionForm isEdit={false} />} />
        <Route path="/promotions/:id" element={<PromotionDetailView />} />
        <Route path="/promotions/:id/edit" element={<PromotionForm isEdit={true} />} />


        <Route path="/transactions" element={<Transactions />} />
        <Route path="/transfer" element={<Transfer />} />
        <Route path="/redeem" element={<Redeem />} />
        <Route path="/transactions/process" element={<Process />} />
        <Route path="/transactions/purchase" element={<Purchase />} />

        <Route path="/users" element={<Users />} />
        <Route path="/users/update" element={<UpdateUser />} />
        <Route path="/users/promote" element={<PromoteUser />} />
        
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/edit" element={<EditProfile />} />
        <Route path="/profile/change-password" element={<ChangePassword />} />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
