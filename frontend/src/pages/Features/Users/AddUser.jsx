import React, { useState } from 'react';
import {
    Form,
    Input,
    Button,
    message,
    Card,
    Alert
} from 'antd';
import NavBar from '../../../components/NavBar';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3100";

const AddUser = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const onFinish = async (values) => {
        setLoading(true);
        setError('');
        
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(API_URL + '/users', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    utorid: values.utorid,
                    name: values.name,
                    email: values.email
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create user');
            }

            const data = await response.json();
            message.success(`User ${data.utorid} created successfully!`);
            setSuccess(true);
            form.resetFields();
            
            // Optionally navigate back or to another page
            // navigate('/users');
            
        } catch (error) {
            console.error('Error creating user:', error);
            setError(error.message);
            message.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <NavBar>
            <div style={{ padding: '24px', maxWidth: '600px', margin: '0 auto' }}>
                <Card title="Register New User">
                    {success && (
                        <Alert
                            message="User created successfully!"
                            type="success"
                            showIcon
                            style={{ marginBottom: 16 }}
                        />
                    )}
                    
                    {error && (
                        <Alert
                            message={error}
                            type="error"
                            showIcon
                            style={{ marginBottom: 16 }}
                        />
                    )}

                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={onFinish}
                        autoComplete="off"
                    >
                        <Form.Item
                            label="UTORid"
                            name="utorid"
                            rules={[
                                { required: true, message: 'Please input the UTORid!' },
                                { 
                                    pattern: /^[a-zA-Z0-9]{8}$/,
                                    message: 'UTORid must be exactly 8 alphanumeric characters' 
                                }
                            ]}
                        >
                            <Input placeholder="e.g., johndoe1" />
                        </Form.Item>

                        <Form.Item
                            label="Full Name"
                            name="name"
                            rules={[
                                { required: true, message: 'Please input the full name!' },
                                {
                                    min: 1,
                                    max: 50,
                                    message: 'Name must be between 1 and 50 characters'
                                }
                            ]}
                        >
                            <Input placeholder="e.g., John Doe" />
                        </Form.Item>

                        <Form.Item
                            label="Email"
                            name="email"
                            rules={[
                                { required: true, message: 'Please input the email!' },
                                { 
                                    type: 'email', 
                                    message: 'Please input a valid email!' 
                                },
                                {
                                    pattern: /@mail\.utoronto\.ca$/,
                                    message: 'Email must be a @mail.utoronto.ca address'
                                }
                            ]}
                        >
                            <Input placeholder="e.g., john.doe@mail.utoronto.ca" />
                        </Form.Item>

                        <Form.Item>
                            <Button 
                                type="primary" 
                                htmlType="submit" 
                                loading={loading}
                                style={{ marginRight: 8 }}
                            >
                                Register User
                            </Button>
                            <Button 
                                onClick={() => navigate('/users')}
                            >
                                Back to Users
                            </Button>
                        </Form.Item>
                    </Form>
                </Card>
            </div>
        </NavBar>
    );
};

export default AddUser;