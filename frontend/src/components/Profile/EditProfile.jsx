import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, DatePicker, Upload, Avatar, Card, message, Skeleton } from 'antd';
import { UserOutlined, UploadOutlined } from '@ant-design/icons';
import NavBar from '../../components/NavBar';
import dayjs from 'dayjs';

const EditProfile = () => {
  const [form] = Form.useForm();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:3100/users/me', {
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

      const response = await fetch('http://localhost:3100/users/me', {
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
      navigate('/profile');
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

      const response = await fetch('http://localhost:3100/users/me', {
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
        <Card title="Edit Profile">
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
              <Button type="primary" htmlType="submit" style={{ marginRight: '16px' }}>
                Save Changes
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

export default EditProfile;