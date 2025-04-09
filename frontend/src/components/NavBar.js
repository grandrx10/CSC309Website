import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../App.css';

const NavBar = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const isActive = (path) => location.pathname === path ? 'active' : '';

    const [userRole, setUserRole] = useState('');

    useEffect(() => {
        const getInfo = async () => {
            try {
                const token = localStorage.getItem('authToken');
                const response = await fetch("http://localhost:3100/users/me", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    // Ensure userInfo exists and has a role before setting it.
                    if (data && data.role) {
                        setUserRole(data.role.toLowerCase());
                    }
                } else {
                    console.error("Failed to fetch user info");
                }
            } catch (error) {
                console.error("Error fetching user info:", error);
            }
        };

        getInfo();
    }, []);

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
                    <li><button onClick={() => navigate('/promotions')} className={isActive('/promotions')}>Promotions</button></li>
           
                    <li>
                        <button onClick={toggleTransactionsMenu}>Transactions   {showTransactionsMenu ? '\u25B2' : '\u25BC'}</button>
                        {showTransactionsMenu && (
                            <ul className="sub-menu">
                                <li><button onClick={() => navigate('/transactions/me')} className={isActive('/transactions/me')}>Your History</button></li>
                                <li><button onClick={() => navigate('/transactions/redeem')} className={isActive('/transactions/redeem')}>Redeem</button></li>
                                <li><button onClick={() => navigate('/transactions/transfer')} className={isActive('/transactions/transfer')}>Transfer</button></li>
                                {isCashier && (
                                    <li><button onClick={() => navigate('/transactions/process')} className={isActive('/transactions/process')}>Process (Cashiers)</button></li>
                                )}
                                {isCashier && (
                                    <li><button onClick={() => navigate('/transactions/purchase')} className={isActive('/transactions/purchase')}>Create Purchase (Cashiers)</button></li>
                                )}
                                {isManager && (
                                    <li><button onClick={() => navigate('/transactions/adjust')} className={isActive('/transactions/adjust')}>Adjust (Managers)</button></li>
                                )}
                                {isManager && (
                                    <li><button onClick={() => navigate('/transactions/all')} className={isActive('/transactions/all')}>View All (Managers)</button></li>
                                )}
                            </ul>
                        )}
                    </li>
                    <li><button onClick={() => navigate('/events')} className={isActive('/events')}>Events</button></li>
                    
                    {isCashier && (
                        <li><button onClick={() => navigate('/users/add')} className={isActive('/users/add')}>Register User (Cashiers)</button></li>
                    )}
                    {isManager && (
                        <li><button onClick={() => navigate('/users')} className={isActive('/users')}>All Users (Managers)</button></li>
                    )}
                    {isManager && (
                        <li><button onClick={() => navigate('/users/update')} className={isActive('/users/update')}>Update User (Managers)</button></li>
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