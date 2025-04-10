import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Descriptions, Button, Avatar, Card, Divider, Skeleton, Space, message } from 'antd';
import { UserOutlined, EditOutlined, LockOutlined } from '@ant-design/icons';
import NavBar from '../../components/NavBar';

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3100";

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch(API_URL + '/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          navigate('/login');
        }
        throw new Error('Failed to fetch user data');
      }

      const data = await response.json();
      setUserData(data);
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <NavBar>
        <div style={{ padding: '24px' }}>
          <Skeleton active paragraph={{ rows: 6 }} />
        </div>
      </NavBar>
    );
  }

  return (
    <NavBar>
      <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
        <Card title="Account Details">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <Avatar size={128} src={userData.avatarUrl} icon={<UserOutlined />} />
          </div>

          <Descriptions column={1} bordered>
            <Descriptions.Item label="Name">{userData.name}</Descriptions.Item>
            <Descriptions.Item label="UTORid">{userData.utorid}</Descriptions.Item>
            <Descriptions.Item label="Email">{userData.email}</Descriptions.Item>
            <Descriptions.Item label="Birthday">
              {userData.birthday ? new Date(userData.birthday).toLocaleDateString() : 'Not set'}
            </Descriptions.Item>
            <Descriptions.Item label="Role">{userData.role}</Descriptions.Item>
            <Descriptions.Item label="Points">{userData.points}</Descriptions.Item>
            <Descriptions.Item label="Account Created">
              {new Date(userData.createdAt).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="Last Login">
              {new Date(userData.lastLogin).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="Verification Status">
              {userData.verified ? 'Verified' : 'Not Verified'}
            </Descriptions.Item>
          </Descriptions>

          <Divider />

          <Divider />

          <Space>
            <Button 
              type="primary" 
              icon={<EditOutlined />}
              onClick={() => navigate('/profile/edit')}
            >
              Edit Profile
            </Button>
            <Button 
              icon={<LockOutlined />}
              onClick={() => navigate('/profile/change-password')}
            >
              Change Password
            </Button>
          </Space>
        </Card>
      </div>
    </NavBar>
  );
};

export default Profile;