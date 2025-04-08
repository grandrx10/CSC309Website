import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Button,
    Card,
    Table,
    Pagination,
    Input,
    Select,
    Space,
    message
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import NavBar from '../../../components/NavBar';

const { Option } = Select;

const Users = () => {
    const [state, setState] = useState({
        users: [],
        loading: false,
        filters: {
            name: '',
            role: '',
            verified: '',   // Expecting "true" or "false" as strings; empty means no filter.
            activated: ''   // Same here.
        },
        pagination: { current: 1, pageSize: 10, total: 0 },
    });
    const navigate = useNavigate();

    // Function to fetch users with pagination and filters
    const fetchUsers = useCallback(async () => {
        setState(prev => ({ ...prev, loading: true }));
        try {
            const token = localStorage.getItem('authToken');
            const params = new URLSearchParams({
                page: state.pagination.current,
                limit: state.pagination.pageSize,
            });

            // Append filter parameters when provided.
            if (state.filters.name) {
                params.set('name', state.filters.name);
            }
            if (state.filters.role) {
                // Normalize role to lowercase and translate "user" to "regular"
                let normalizedRole = state.filters.role.toLowerCase();
                if (normalizedRole === 'user') {
                    normalizedRole = 'regular';
                }
                params.set('role', normalizedRole);
            }
            if (state.filters.verified !== '') {
                params.set('verified', state.filters.verified);
            }
            if (state.filters.activated !== '') {
                params.set('activated', state.filters.activated);
            }

            const response = await fetch(`http://localhost:3100/users?${params.toString()}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    navigate('/login');
                    return;
                }
                throw new Error('Failed to fetch users');
            }

            const data = await response.json();
            // Update state with the users list from the "results" field and set total count from "count"
            setState(prev => ({
                ...prev,
                users: data.results || [],
                pagination: {
                    ...prev.pagination,
                    total: data.count,
                },
                loading: false,
            }));
        } catch (error) {
            message.error(error.message);
            setState(prev => ({ ...prev, loading: false }));
        }
    }, [
        navigate,
        state.pagination.current,
        state.pagination.pageSize,
        state.filters.name,
        state.filters.role,
        state.filters.verified,
        state.filters.activated
    ]);

    // Refetch data when page, page size, or filters change
    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Handle page and page size change events
    const handlePaginationChange = (page, pageSize) => {
        setState(prev => ({
            ...prev,
            pagination: { ...prev.pagination, current: page, pageSize },
        }));
    };

    // Define table columns matching the API response.// Define table columns matching the API response.
    const columns = [
        {
            title: 'UTORid',
            dataIndex: 'utorid',
            key: 'utorid',
            sorter: (a, b) => a.utorid.localeCompare(b.utorid),
            render: (text, record) => (
                <a
                    style={{ color: 'blue' }}
                    onClick={() => navigate(`/users/update/${record.id}`)} // Navigate to the update page
                >
                    {text}
                </a>
            ),
        },
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            sorter: (a, b) => a.name.localeCompare(b.name),
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            sorter: (a, b) => a.email.localeCompare(b.email),
        },
        {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
            render: (role) => {
                const normalized = role.toLowerCase() === 'user' ? 'regular' : role.toLowerCase();
                return normalized.charAt(0).toUpperCase() + normalized.slice(1);
            },
            sorter: (a, b) => a.role.localeCompare(b.role),
        },
        {
            title: 'Points',
            dataIndex: 'points',
            key: 'points',
            sorter: (a, b) => a.points - b.points,
        },
        {
            title: 'Created At',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (value) => new Date(value).toLocaleString(),
            sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
        },
    ];


    // Render filter inputs above the table.
    const renderFilters = () => (
        <Space style={{ marginBottom: '16px' }} wrap>
            <Input
                placeholder="Filter by UTORid or Name"
                value={state.filters.name}
                onChange={(e) =>
                    setState(prev => ({
                        ...prev,
                        filters: { ...prev.filters, name: e.target.value },
                    }))
                }
                style={{ width: 200 }}
            />
            <Select
                placeholder="Select Role"
                value={state.filters.role || undefined}
                style={{ width: 150 }}
                onChange={(value) =>
                    setState(prev => ({
                        ...prev,
                        filters: {
                            ...prev.filters,
                            // Normalize selected value: treat both "user" and "regular" as "regular"
                            role: value.toLowerCase() === 'user' ? 'regular' : value.toLowerCase()
                        },
                    }))
                }
                allowClear
            >
                <Option value="regular">Regular</Option>
                <Option value="cashier">Cashier</Option>
                <Option value="manager">Manager</Option>
                <Option value="superuser">Superuser</Option>
            </Select>
            <Select
                placeholder="Verified"
                value={state.filters.verified === '' ? undefined : state.filters.verified}
                style={{ width: 120 }}
                onChange={(value) =>
                    setState(prev => ({
                        ...prev,
                        filters: { ...prev.filters, verified: value },
                    }))
                }
                allowClear
            >
                <Option value="true">Yes</Option>
                <Option value="false">No</Option>
            </Select>
            <Select
                placeholder="Activated"
                value={state.filters.activated === '' ? undefined : state.filters.activated}
                style={{ width: 120 }}
                onChange={(value) =>
                    setState(prev => ({
                        ...prev,
                        filters: { ...prev.filters, activated: value },
                    }))
                }
                allowClear
            >
                <Option value="true">Yes</Option>
                <Option value="false">No</Option>
            </Select>
            <Button
                type="primary"
                onClick={() => {
                    // Reset to the first page and then fetch users with new filters.
                    setState(prev => ({
                        ...prev,
                        pagination: { ...prev.pagination, current: 1 },
                    }));
                    fetchUsers();
                }}
            >
                Search
            </Button>
        </Space>
    );

    return (
        <div>
            <NavBar>
                <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate(-1)}
                    style={{ marginBottom: '16px' }}
                >
                    Back
                </Button>
                <Card title="All Users">
                    {renderFilters()}
                    <Table
                        columns={columns}
                        dataSource={state.users}
                        rowKey="id"
                        loading={state.loading}
                        pagination={false} // Using custom pagination below.
                    />
                    <Pagination
                        current={state.pagination.current}
                        pageSize={state.pagination.pageSize}
                        total={state.pagination.total}
                        onChange={handlePaginationChange}
                        onShowSizeChange={(current, size) => handlePaginationChange(1, size)}
                        showSizeChanger
                        showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
                        style={{ marginTop: '16px', textAlign: 'right' }}
                    />
                </Card>
            </NavBar>
        </div>
    );
};

export default Users;
