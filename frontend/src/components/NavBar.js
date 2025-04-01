import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

const NavBar = ({ children }) => {
    const navigate = useNavigate();
    /* I borrowed some of the open/close functionality from:
    https://medium.com/swlh/how-to-make-a-side-navigation-bar-in-reactjs-c90747f3410c
    */
    const [width, setWidth] = useState("0%");
    const openNav = () => {
        setWidth("15%")
    }
    const closeNav = () => {
        setWidth("0%")
    }

    return (
        <div>
            <button onClick={openNav} className="open-button">☰</button>
            <div className="navbar" style={{width: width}}>
                <button onClick={closeNav} className="close-button">X</button>
                <h2 className="navbar-title">Homepage</h2>
                <ul className="navbar-menu">
                    <li><button onClick={() => navigate('/home')}>Home</button></li>
                    <li><button onClick={() => navigate('/promotions')}>Promotions</button></li>
                    <li><button onClick={() => navigate('/transactions')}>Transactions</button></li>
                    <li><button onClick={() => navigate('/events')}>Events</button></li>
                    <li><button onClick={() => navigate('/settings')}>Settings</button></li>
                    <li><button className="log-out">Log Out (not implemented)</button></li>
                </ul>
            </div>
            <div className="main-content" style={{ marginLeft: width }}>
                {children}
            </div>
        </div>
    );
};

export default NavBar;