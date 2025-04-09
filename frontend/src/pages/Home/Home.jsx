import React, { useState, useEffect } from 'react';
import NavBar from '../../components/NavBar';
import QRCode from 'react-qr-code';
import { Card, Typography, Spin, Alert, Row, Col, Statistic, Dropdown, Button, Menu, Space } from 'antd';
import { Link } from 'react-router-dom';
import { UserOutlined, CalendarOutlined, GiftOutlined, ShoppingCartOutlined, CheckCircleOutlined } from '@ant-design/icons';
import PreviewTransactions from './PreviewTransactions';
import PreviewEvents from './PreviewEvents';
import PreviewPromotions from './PreviewPromotions';
import { useRoleSwitcher } from '../../hooks/useRoleSwitcher';

const { Title, Paragraph } = Typography;
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3100";

const Home = () => {
    const [userInfo, setUserInfo] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch user info
    useEffect(() => {
        const getInfo = async () => {
            try {
                const token = localStorage.getItem('authToken');
                const response = await fetch(API_URL + "/users/me", {
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

    const { currentViewRole, handleRoleChange, availableRoles } = useRoleSwitcher(userInfo?.role);

    const renderRoleDropdown = () => {
        if (!userInfo) return null;

        const menu = (
            <Menu onClick={({ key }) => handleRoleChange(key)}>
                {availableRoles.map(role => (
                    <Menu.Item key={role}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                    </Menu.Item>
                ))}
            </Menu>
        );

        return (
            <Dropdown overlay={menu}>
                <Button icon={<UserOutlined />} style={{ marginBottom: 16 }}>
                    Viewing as: {currentViewRole.charAt(0).toUpperCase() + currentViewRole.slice(1)}
                </Button>
            </Dropdown>
        );
    };

    const renderQRAndTransactions = () => {
        if (userInfo) {
            return (
                <Row gutter={32} style={{ marginTop: 24 }}>
                    <Col xs={24} md={12} style={{ textAlign: 'center' }}>
                        <Paragraph>
                            <strong>Use the QR code below to allow a user to transfer points to you.</strong>
                        </Paragraph>
                        <QRCode value={`User ID - ${userInfo.id}\nUTORid - ${userInfo.utorid}`} />
                    </Col>
                    <Col xs={24} md={12}>
                        <Row justify="space-between" align="middle">
                            <Col>
                                <Title level={3}>Your Transactions</Title>
                            </Col>
                            <Col>
                                <Link to="/transactions/me">
                                    <Button type="default" size="medium" style={{ marginTop: 16 }}>
                                        View All
                                    </Button>
                                </Link>
                            </Col>
                        </Row>
                        <PreviewTransactions />
                    </Col>
                </Row>
            );
        } else {
            return (
                <Alert
                    type="error"
                    message="Failed to fetch user info"
                    description="Please log in again if this issue persists."
                    showIcon
                />
            );
        }
    };

    const renderRoleUI = () => {
        switch (currentViewRole) {
            case 'superuser':
            case 'manager':
                return (
                    <>
                        {renderQRAndTransactions()}
                        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', width: '100%' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '30%' }}>
                                <Title level={3}>Cashier Panel</Title>
                                <Space direction="vertical" style={{ width: '100%' }}>
                                    <Link to="/transactions/purchase">
                                        <Button
                                            type="primary"
                                            icon={<ShoppingCartOutlined />}
                                            size="large"
                                            block
                                        >
                                            Create a Purchase
                                        </Button>
                                    </Link>
                                    <Link to="/transactions/process">
                                        <Button
                                            type="primary"
                                            icon={<CheckCircleOutlined />}
                                            size="large"
                                            block
                                        >
                                            Process a Redemption
                                        </Button>
                                    </Link>
                                </Space>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '50%' }}>
                                <Title level={3}>Manager Panel</Title>
                                <Space direction="vertical" style={{ width: '100%' }}>
                                    <Row justify="space-between" align="middle">
                                        <Col>
                                            <Title level={3}>Recent Events</Title>
                                        </Col>
                                        <Col>
                                            <Link to="/events">
                                                <Button type="primary" size="medium" style={{ marginTop: 16 }} icon={<CalendarOutlined />}>
                                                    Manage
                                                </Button>
                                            </Link>
                                        </Col>
                                    </Row>
                                    <PreviewEvents />

                                    <Row justify="space-between" align="middle">
                                        <Col>
                                            <Title level={3}>Recent Promotions</Title>
                                        </Col>
                                        <Col>
                                            <Link to="/promotions">
                                                <Button type="primary" size="medium" style={{ marginTop: 16 }} icon={<GiftOutlined />}>
                                                    Manage
                                                </Button>
                                            </Link>
                                        </Col>
                                    </Row>
                                    <PreviewPromotions />

                                    <Link to="/users">
                                        <Button
                                            type="primary"
                                            icon={<UserOutlined />}
                                            size="large"
                                            block
                                        >
                                            Manage Users
                                        </Button>
                                    </Link>
                                </Space>
                            </div>
                        </div>
                    </>
                );
            case 'cashier':
                return (
                    <>
                        {renderQRAndTransactions()}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <Title level={3}>Cashier Panel</Title>
                            <Space direction="vertical" style={{ width: '50%' }}>
                                <Link to="/transactions/purchase">
                                    <Button
                                        type="primary"
                                        icon={<ShoppingCartOutlined />}
                                        size="large"
                                        block
                                    >
                                        Create a Purchase
                                    </Button>
                                </Link>
                                <Link to="/transactions/process">
                                    <Button
                                        type="primary"
                                        icon={<CheckCircleOutlined />}
                                        size="large"
                                        block
                                    >
                                        Process a Redemption
                                    </Button>
                                </Link>
                            </Space>
                        </div>
                    </>
                );
            default:
                return (renderQRAndTransactions());
        }
    };

    return (
        <div style={{ padding: '24px' }}>
            <NavBar>
                <Card title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Dashboard</span>
                        <div style={{ marginTop: '15px' }}>{renderRoleDropdown()}</div>
                    </div>
                } bordered style={{ maxWidth: 1000, margin: 'auto' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '48px 0' }}>
                            <Spin tip="Loading user info..." />
                            <Paragraph>If this doesn't load after a while, please log in again.</Paragraph>
                        </div>
                    ) : userInfo ? (
                        <>
                            <Title level={2} style={{ marginTop: -8 }}>Welcome, {userInfo.name}!</Title>
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

                            <div style={{ marginTop: 32 }}>
                                {renderRoleUI()}
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
