import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Form, 
  Input, 
  Button, 
  DatePicker, 
  Upload, 
  Avatar, 
  Card, 
  Tabs, 
  message, 
  Skeleton,
  Descriptions,
  Divider,
  Space
} from 'antd';
import { UserOutlined, UploadOutlined, LockOutlined } from '@ant-design/icons';
import NavBar from '../../components/NavBar';
import dayjs from 'dayjs';

const { TabPane } = Tabs;
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3100";

const Profile = () => {
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
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
      form.setFieldsValue({
        name: data.name,
        email: data.email,
        birthday: data.birthday ? dayjs(data.birthday) : null
      });
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (values) => {
    try {
      const token = localStorage.getItem('authToken');
      const payload = {
        ...values,
        birthday: values.birthday ? values.birthday.format('YYYY-MM-DD') : null
      };

      const response = await fetch(API_URL + '/users/me', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Failed to update profile');

      const data = await response.json();
      setUserData(data);
      message.success('Profile updated successfully');
    } catch (error) {
      message.error(error.message);
    }
  };

  const handleAvatarUpload = async (file) => {
    try {
      setAvatarLoading(true);
      const token = localStorage.getItem('authToken');
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch(API_URL + '/users/me', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Failed to update avatar');

      const data = await response.json();
      setUserData(data);
      message.success('Avatar updated successfully');
    } catch (error) {
      message.error(error.message);
    } finally {
      setAvatarLoading(false);
    }
  };

  const handlePasswordChange = async (values) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(API_URL + '/users/me/password', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Current password is incorrect');
        }
        throw new Error('Failed to change password');
      }

      message.success('Password changed successfully');
      passwordForm.resetFields();
    } catch (error) {
      message.error(error.message);
    }
  };

  const beforeAvatarUpload = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('You can only upload image files!');
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('Image must be smaller than 2MB!');
    }
    return isImage && isLt2M;
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
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Profile" key="profile">
            <Card title="Profile Information" style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                <Upload
                  name="avatar"
                  showUploadList={false}
                  beforeUpload={beforeAvatarUpload}
                  customRequest={({ file }) => handleAvatarUpload(file)}
                >
                  <Avatar
                    size={128}
                    src={userData.avatarUrl || <UserOutlined />}
                    icon={!userData.avatarUrl && <UserOutlined />}
                  />
                  <div style={{ marginTop: '8px', textAlign: 'center' }}>
                    <Button loading={avatarLoading} icon={<UploadOutlined />}>
                      Change Avatar
                    </Button>
                  </div>
                </Upload>
              </div>

              <Form
                form={form}
                layout="vertical"
                onFinish={handleProfileUpdate}
                initialValues={{
                  name: userData.name,
                  email: userData.email,
                  birthday: userData.birthday ? dayjs(userData.birthday) : null
                }}
              >
                <Form.Item
                  label="Name"
                  name="name"
                  rules={[
                    { max: 50, message: 'Name must be less than 50 characters' }
                  ]}
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  label="Email"
                  name="email"
                  rules={[
                    { type: 'email', message: 'Please enter a valid email' },
                    { pattern: /@mail\.utoronto\.ca$|@utoronto\.ca$/, message: 'Please use a UofT email' }
                  ]}
                >
                  <Input />
                </Form.Item>

                <Form.Item label="Birthday" name="birthday">
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item>
                  <Button type="primary" htmlType="submit">
                    Update Profile
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </TabPane>

          <TabPane tab="Security" key="security">
            <Card title="Change Password" style={{ marginTop: '16px' }}>
              <Form
                form={passwordForm}
                layout="vertical"
                onFinish={handlePasswordChange}
              >
                <Form.Item
                  label="Current Password"
                  name="old"
                  rules={[{ required: true, message: 'Please input your current password' }]}
                >
                  <Input.Password prefix={<LockOutlined />} />
                </Form.Item>

                <Form.Item
                  label="New Password"
                  name="new"
                  rules={[
                    { required: true, message: 'Please input your new password' },
                    { min: 8, message: 'Password must be at least 8 characters' },
                    { max: 20, message: 'Password must be at most 20 characters' },
                    { pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/, 
                      message: 'Password must contain at least one uppercase, one lowercase, one number and one special character' }
                  ]}
                >
                  <Input.Password prefix={<LockOutlined />} />
                </Form.Item>

                <Form.Item>
                  <Button type="primary" htmlType="submit">
                    Change Password
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </TabPane>

          <TabPane tab="Account Details" key="details">
            <Card title="Account Information" style={{ marginTop: '16px' }}>
              <Descriptions column={1} bordered>
                <Descriptions.Item label="UTORid">{userData.utorid}</Descriptions.Item>
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

              <h3>Promotions</h3>
              {userData.promotions && userData.promotions.length > 0 ? (
                <ul>
                  {userData.promotions.map((promo, index) => (
                    <li key={index}>{promo}</li>
                  ))}
                </ul>
              ) : (
                <p>No promotions available</p>
              )}
            </Card>
          </TabPane>
        </Tabs>
      </div>
    </NavBar>
  );
};

export default Profile;