import React, { useState, useEffect } from 'react';
import {
    Form,
    Input,
    Button,
    Select,
    Card,
    Skeleton,
    Switch,
    Alert
} from 'antd';
import { useParams } from 'react-router-dom';
import NavBar from '../../../components/NavBar';

const { Option } = Select;
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3100";

const UpdateUser = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [updateLoading, setUpdateLoading] = useState(false);
    const [userData, setUserData] = useState(null);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const { id } = useParams(); 

    useEffect(() => {
        const fetchUser = async () => {
            setLoading(true);
            setError('');
            setUserData(null);
            setSuccessMsg('');

            try {
                const token = localStorage.getItem('authToken');
                const res = await fetch(`${API_URL}/users/${id}`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    }
                });

                if (!res.ok) {
                    if (res.status === 404) {
                        setError('User not found.');
                    } else if (res.status === 401) {
                        setError('Unauthorized. Please log in again.');
                    } else {
                        setError('Failed to fetch user.');
                    }
                    return;
                }

                const data = await res.json();
                setUserData(data);
                form.setFieldsValue({
                    email: data.email,
                    verified: data.verified,
                    suspicious: data.suspicious,
                    role: data.role.toLowerCase(),
                });
            } catch (error) {
                setError('Network error. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [id]);

    const handleUpdate = async (values) => {
        setUpdateLoading(true);
        setError('');
        setSuccessMsg('');

        try {
            const token = localStorage.getItem('authToken');
            const payload = {
                email: values.email ?? null,
                verified: values.verified ?? null,
                suspicious: values.suspicious ?? null,
                role: values.role ?? null,
            };

            const res = await fetch(`http://localhost:3100/users/${id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to update user');
            }

            const updated = await res.json();
            setUserData(updated);
            setSuccessMsg('User updated successfully.');
        } catch (error) {
            setError(error.message);
        } finally {
            setUpdateLoading(false);
        }
    };

    return (
        <NavBar>
            <div style={{ padding: '24px', maxWidth: '600px', margin: '0 auto' }}>
                {loading && <Skeleton active paragraph={{ rows: 6 }} />}

                {userData && (
                    <Card title={`Edit User: ${userData.utorid}`}>
                        {successMsg && (
                            <Alert
                                style={{ marginBottom: 16 }}
                                message={successMsg}
                                type="success"
                                showIcon
                            />
                        )}

                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleUpdate}
                        >
                            <Form.Item
                                label="Email"
                                name="email"
                                rules={[
                                    { type: 'email', message: 'Enter a valid email' },
                                    {
                                        pattern: /@mail\.utoronto\.ca$/,
                                        message: 'Email must be a @mail.utoronto.ca address'
                                    }
                                ]}
                            >
                                <Input />
                            </Form.Item>

                            <Form.Item
                                label="Verified"
                                name="verified"
                                valuePropName="checked"
                                tooltip="You cannot unverify users."
                            >
                                <Switch checkedChildren="Yes" unCheckedChildren="No" disabled={userData.verified} />
                            </Form.Item>

                            <Form.Item
                                label="Suspicious"
                                name="suspicious"
                                valuePropName="checked"
                            >
                                <Switch checkedChildren="True" unCheckedChildren="False" />
                            </Form.Item>

                            <Form.Item
                                label="Role"
                                name="role"
                                rules={[{ required: true, message: 'Please select a role' }]}
                            >
                                <Select>
                                    <Option value="regular">Regular</Option>
                                    <Option value="cashier">Cashier</Option>
                                    <Option value="manager">Manager</Option>
                                    <Option value="superuser">Superuser</Option>
                                </Select>
                            </Form.Item>

                            <Form.Item>
                                <Button type="primary" htmlType="submit" loading={updateLoading}>
                                    Update User
                                </Button>
                            </Form.Item>
                        </Form>
                    </Card>
                )}

                {error && (
                    <Alert
                        style={{ marginTop: 16 }}
                        message={error}
                        type="error"
                        showIcon
                    />
                )}
            </div>
        </NavBar>
    );
};

export default UpdateUser;
