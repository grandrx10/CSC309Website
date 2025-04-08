import React, { useState, useEffect } from 'react';
import NavBar from '../../components/NavBar';
import QRCode from 'react-qr-code';

const Home = () => {
    const [userInfo, setUserInfo] = useState(null);

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
                    setUserInfo(data);
                } else {
                    console.error("Failed to fetch user info");
                }
            } catch (error) {
                console.error("Error fetching user info:", error);
            }
        };

        getInfo();
    }, []);

    return (
        <div>
            <NavBar>
                <div class="home">
                    {userInfo ? (
                        <div>
                            <h2>Welcome, {userInfo.name}!</h2>
                            <p>{userInfo.role.charAt(0).toUpperCase() + userInfo.role.slice(1).toLowerCase()}</p>
                            <p>{userInfo.points} points</p>
                            {/* Test with https://scanqr.org/, it includes line breaks */}
                            <QRCode
                                value={`User ID - ${userInfo.id}\nUTORid - ${userInfo.utorid}`}
                            />
                        </div>
                    ) : (
                        <div>
                            <p>Loading user info...</p>
                            <p>If this doesn't load after a while, please log in again.</p>
                        </div>
                    )}
                </div>
            </NavBar>
        </div>
    );
};

export default Home;