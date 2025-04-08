import React, { useState, useEffect } from 'react';
import NavBar from '../../components/NavBar';
import QRCode from 'react-qr-code';
import { Card, Typography, Spin, Alert, Row, Col, Statistic } from 'antd';

const { Title, Paragraph } = Typography;

const Home = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);

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
      } finally {
        setLoading(false);
      }
    };

    getInfo();
  }, []);

  return (
    <div style={{ padding: '24px' }}>
      <NavBar>
        <Card title="Dashboard" bordered style={{ maxWidth: 1000, margin: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <Spin tip="Loading user info..." />
              <Paragraph>If this doesn't load after a while, please log in again.</Paragraph>
            </div>
          ) : userInfo ? (
            <>
              <Title level={2}>Welcome, {userInfo.name}!</Title>
              <Row gutter={16} style={{ marginTop: 24 }}>
                <Col xs={24} sm={8}>
                  <Card>
                    <Statistic 
                      title="UTORid" 
                      value={userInfo.utorid} 
                      style={{ textAlign: 'center', fontWeight: '500' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card>
                    <Statistic 
                      title="Role" 
                      value={userInfo.role.charAt(0).toUpperCase() + userInfo.role.slice(1).toLowerCase()} 
                      style={{ textAlign: 'center', fontWeight: '500' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card>
                    <Statistic 
                      title="Points" 
                      value={userInfo.points} 
                      style={{ textAlign: 'center', fontWeight: '500' }} 
                    />
                  </Card>
                </Col>
              </Row>
              <div style={{ marginTop: 24, textAlign: 'center' }}>
                <Paragraph>
                  <strong>Use the QR code below to allow a user to transfer points to you.</strong>
                </Paragraph>
                <QRCode
                  value={`User ID - ${userInfo.id}\nUTORid - ${userInfo.utorid}`}
                />
              </div>
            </>
          ) : (
            <Alert
              type="error"
              message="Failed to fetch user info"
              description="Please log in again if this issue persists."
              showIcon
            />
          )}
        </Card>
      </NavBar>
    </div>
  );
};

export default Home;
