import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../App.css';

const NavBar = ({ userRole, children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const isActive = (path) => location.pathname === path ? 'active' : '';

    const isCashier = userRole === 'cashier' || userRole === 'manager' || userRole === 'superuser';
    const isManager = userRole === 'manager' || userRole === 'superuser';
    const isSuperuser = userRole === 'superuser';
    
    /* I borrowed some of the open/close functionality from:
    https://medium.com/swlh/how-to-make-a-side-navigation-bar-in-reactjs-c90747f3410c
    */
    const [width, setWidth] = useState("15%");
    const [showPromotionsMenu, setShowPromotionsMenu] = useState(false);
    const [showTransactionsMenu, setShowTransactionsMenu] = useState(false);
    const openNav = () => {
        setWidth("15%")
    }
    const closeNav = () => {
        setWidth("0%")
    }
    const togglePromotionsMenu = () => {
        setShowPromotionsMenu(!showPromotionsMenu);
    };

    const toggleTransactionsMenu = () => {
        setShowTransactionsMenu(!showTransactionsMenu);
    }

    return (
        <div>
            {/* <button onClick={openNav} className="open-button">☰</button> */}
            <div className="navbar" style={{width: width}}>
                {/* <button onClick={closeNav} className="close-button">X</button> */}
                <h3 className="navbar-title">Loyalty Program</h3>
                <ul className="navbar-menu">
                    <li><button onClick={() => navigate('/home')} className={isActive('/home')}>Home</button></li>
                    
                    <li>
                        <button onClick={togglePromotionsMenu}>Promotions   {showPromotionsMenu ? '\u25B2' : '\u25BC'}</button>
                        {showPromotionsMenu && (
                            <ul className="sub-menu">
                                <li><button onClick={() => navigate('/promotions/promotionlist')} className={isActive('/promotions/promotionlist')}>View All</button></li>
                                <li><button onClick={() => navigate('/promotions/managepromotion')} className={isActive('/promotions/managepromotion')}>Manage</button></li>
                            </ul>
                            
        
                        )}
                    </li>
                    <li>
                        <button onClick={toggleTransactionsMenu}>Transactions   {showTransactionsMenu ? '\u25B2' : '\u25BC'}</button>
                        {showTransactionsMenu && (
                            <ul className="sub-menu">
                                <li><button onClick={() => navigate('/transactions')} className={isActive('/transactions')}>View All</button></li>
                                <li><button onClick={() => navigate('/redeem')} className={isActive('/redeem')}>Redeem</button></li>
                                <li><button onClick={() => navigate('/transfer')} className={isActive('/transfer')}>Transfer</button></li>
                                {isCashier && (
                                    <li><button onClick={() => navigate('/transactions/process')} className={isActive('/transactions/process')}>Process (Cashiers)</button></li>
                                )}
                                {isCashier && (
                                    <li><button onClick={() => navigate('/transactions/purchase')} className={isActive('/transactions/purchase')}>Create Purchase (Cashiers)</button></li>
                                )}
                            </ul>
                        )}
                    </li>
                    <li><button onClick={() => navigate('/events')} className={isActive('/events')}>Events</button></li>
                    {isManager && (
                        <li><button onClick={() => navigate('/users')} className={isActive('/users')}>All Users (Managers)</button></li>
                    )}
                    {isManager && (
                        <li><button onClick={() => navigate('/users/update')} className={isActive('/users/update')}>Update User (Managers)</button></li>
                    )}
                    {isSuperuser && (
                        <li><button onClick={() => navigate('/users/promote')} className={isActive('/users/promote')}>Promote User (Superusers)</button></li>
                    )}
                    <li><button onClick={() => navigate('/profile')} className={isActive('/profile')}>Profile</button></li>
                    <li><button onClick={() => navigate('/')} className={`log-out ${isActive('/')}`}>Log Out</button></li>
                </ul>
            </div>
            <div className="main-content" style={{ marginLeft: width }}>
                {children}
            </div>
        </div>
    );
};

export default NavBar;