import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import NavBar from '../components/NavBar';

const NotFound = () => {
    const navigate = useNavigate();
    return (
        <div>
            <NavBar>
                <div className="not-found">
                    <h1>Page Not Found</h1>
                    <p>Something went wrong when navigating to a page.</p>
                    <Button type="primary" onClick={() => navigate('/home')}>
                        Go Home
                    </Button>
                </div>
            </NavBar>
        </div>
    );
};

export default NotFound;