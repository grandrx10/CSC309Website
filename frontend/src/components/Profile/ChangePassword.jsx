import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, message } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import NavBar from '../../components/NavBar';

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3100";

const ChangePassword = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();

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
      form.resetFields();
      navigate('/profile');
    } catch (error) {
      message.error(error.message);
    }
  };

  return (
    <NavBar>
      <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
        <Card title="Change Password">
          <Form
            form={form}
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
              <Button type="primary" htmlType="submit" style={{ marginRight: '16px' }}>
                Change Password
              </Button>
              <Button onClick={() => navigate('/profile')}>
                Cancel
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </NavBar>
  );
};

export default ChangePassword;