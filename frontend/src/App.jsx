// App.jsx (or your root component)
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SignIn from './pages/Signin/Signin';
import Home from './pages/Home/Home';
import Event from './components/Events/Event/Event';
import EditEvent from './components/Events/Event/EditEvent';
import EventsList from './components/Events/EventsList/EventsList';
import CreateEvent from './pages/Events/CreateEvent';

import PromotionList from './pages/Features/Promotions/PromotionList';
import ManagePromotion from './pages/Features/Promotions/ManagePromotions';
import PromotionsListView from './pages/Features/Promotions/PromotionsListView';
import PromotionDetailView from './pages/Features/Promotions/PromotionDetailView';
import PromotionForm from './pages/Features/Promotions/PromotionForm';

import MyTransactions from './pages/Features/Transactions/MyTransactions';
import Transfer from './pages/Features/Transactions/Transfer';
import Redeem from './pages/Features/Transactions/Redeem';
import Process from './pages/Features/Transactions/Process';
import Purchase from './pages/Features/Transactions/Purchase';
import Adjustment from './pages/Features/Transactions/Adjustment';
import AllTransactions from './pages/Features/Transactions/AllTransactions';

import Users from './pages/Features/Users/Users';
import UpdateUser from './pages/Features/Users/UpdateUser';
import AddUser from './pages/Features/Users/AddUser';

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
        <Route path="/events" element={<EventsList />} />
        <Route path="/events/create" element={<CreateEvent />} />
        <Route path="/events/:eventId/edit" element={<EditEvent />} />
        <Route path="/events/:eventId" element={<Event />} />


        <Route path="/promotions" element={<PromotionList />} />
        <Route path="/promotions/new" element={<PromotionForm isEdit={false} />} />
        <Route path="/promotions/:id" element={<PromotionDetailView />} />
        <Route path="/promotions/:id/edit" element={<PromotionForm isEdit={true} />} />

        <Route path="/transactions/me" element={<MyTransactions />} />
        <Route path="/transactions/transfer" element={<Transfer />} />
        <Route path="/transactions/redeem" element={<Redeem />} />
        <Route path="/transactions/process" element={<Process />} />
        <Route path="/transactions/purchase" element={<Purchase />} />
        <Route path="/transactions/adjust" element={<Adjustment />} />
        <Route path="/transactions/all" element={<AllTransactions />} />

        <Route path="/users" element={<Users />} />
        <Route path="/users/update/:id" element={<UpdateUser />} />
        <Route path="/users/add" element={<AddUser />} />

        
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/edit" element={<EditProfile />} />
        <Route path="/profile/change-password" element={<ChangePassword />} />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
