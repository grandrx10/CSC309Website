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
    Alert,
    message
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import NavBar from '../../../components/NavBar';

const { Option } = Select;
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3100";

const Transactions = () => {
    const [state, setState] = useState({
        transactions: [],
        loading: false,
        filters: {
            name: '',
            createdBy: '',
            suspicious: '',
            promotionId: '',
            type: '',
            relatedId: '',
            amount: '',
            operator: '',
        },
        pagination: { current: 1, pageSize: 10, total: 0 },
    });
    const navigate = useNavigate();

    const fetchTransactions = useCallback(async () => {
        setState(prev => ({ ...prev, loading: true }));
        try {
            const token = localStorage.getItem('authToken');
            const params = new URLSearchParams({
                page: state.pagination.current,
                limit: state.pagination.pageSize,
            });

            // Append filter parameters when provided.
            if (state.filters.utorid) {
                params.set('name', state.filters.utorid);
            }
            if (state.filters.createdBy) {
                params.set('createdBy', state.filters.createdBy);
            }
            if (state.filters.suspicious !== '') {
                params.set('suspicious', state.filters.suspicious);
            }
            if (state.filters.promotionId) {
                params.set('promotionId', state.filters.promotionId);
            }
            if (state.filters.type) {
                params.set('type', state.filters.type);
            }
            if (state.filters.relatedId) {
                params.set('relatedId', state.filters.relatedId);
            }
            if (state.filters.amount && state.filters.operator) {
                params.set('amount', state.filters.amount);
                params.set('operator', state.filters.operator);
            }
            
            const response = await fetch(`${API_URL}/transactions?${params.toString()}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                }
            });

            console.log('Response status:', response.status); // Log the response status code

            if (!response.ok) {
                if (response.status === 401) {
                    console.log('Unauthorized request, redirecting to login');
                    navigate('/login');
                    return;
                }
                throw new Error('Failed to fetch transactions');
            }

            const data = await response.json();
            console.log('Fetched data:', data); // Log the response data

            // Update state with the transactions list from the "results" field and set total count from "count"
            setState(prev => ({
                ...prev,
                transactions: data.results || [],
                pagination: {
                    ...prev.pagination,
                    total: data.count,
                },
                loading: false,
            }));
        } catch (error) {
            console.error('Error fetching transactions:', error.message); // Log any error encountered
            message.error(error.message);
            setState(prev => ({ ...prev, loading: false }));
        }
    }, [
        navigate,
        state.pagination.current,
        state.pagination.pageSize,
        state.filters.utorid,
        state.filters.createdBy,
        state.filters.suspicious,
        state.filters.promotionId,
        state.filters.type,
        state.filters.relatedId,
        state.filters.amount,
        state.filters.operator,
    ]);

    // Refetch data when page, page size, or filters change
    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    // Handle page and page size change events
    const handlePaginationChange = (page, pageSize) => {
        setState(prev => ({
            ...prev,
            pagination: { ...prev.pagination, current: page, pageSize },
        }));
    };

    // Define table columns matching the API response for transactions.
    const columns = [
        {
            title: 'Transaction ID',
            dataIndex: 'id',
            key: 'id',
            sorter: (a, b) => a.id - b.id,
        },
        {
            title: 'UTORid',
            dataIndex: 'utorid',
            key: 'utorid',
            sorter: (a, b) => a.utorid.localeCompare(b.utorid),
        },
        {
            title: 'Created By',
            dataIndex: 'createdBy',
            key: 'createdBy',
            sorter: (a, b) => a.createdBy.localeCompare(b.createdBy),
        },
        {
            title: 'Suspicious',
            dataIndex: 'suspicious',
            key: 'suspicious',
            render: (value) => (value ? 'Yes' : 'No'),
            sorter: (a, b) => a.suspicious - b.suspicious,
        },
        {
            title: 'Promotion ID',
            dataIndex: 'promotionId',
            key: 'promotionId',
            sorter: (a, b) => a.promotionId - b.promotionId,
        },
        {
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
            sorter: (a, b) => a.type.localeCompare(b.type),
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            sorter: (a, b) => a.amount - b.amount,
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
                placeholder="Filter by UTORid"
                value={state.filters.utorid}
                onChange={(e) =>
                    setState(prev => ({
                        ...prev,
                        filters: { ...prev.filters, utorid: e.target.value },
                    }))
                }
                style={{ width: 200 }}
            />
            <Input
                placeholder="Filter by Creator"
                value={state.filters.createdBy}
                onChange={(e) =>
                    setState(prev => ({
                        ...prev,
                        filters: { ...prev.filters, createdBy: e.target.value },
                    }))
                }
                style={{ width: 200 }}
            />
            <Select
                placeholder="Suspicious"
                value={state.filters.suspicious === '' ? undefined : state.filters.suspicious}
                style={{ width: 120 }}
                onChange={(value) =>
                    setState(prev => ({
                        ...prev,
                        filters: { ...prev.filters, suspicious: value },
                    }))
                }
                allowClear
            >
                <Option value="true">Yes</Option>
                <Option value="false">No</Option>
            </Select>
            <Input
                placeholder="Promotion ID"
                type="number"
                value={state.filters.promotionId}
                onChange={(e) =>
                    setState(prev => ({
                        ...prev,
                        filters: { ...prev.filters, promotionId: e.target.value },
                    }))
                }
                style={{ width: 120 }}
            />
            <Select
                placeholder="Transaction Type"
                value={state.filters.type || undefined}
                style={{ width: 150 }}
                onChange={(value) =>
                    setState(prev => ({
                        ...prev,
                        filters: { ...prev.filters, type: value },
                    }))
                }
                allowClear
            >
                <Option value="purchase">Purchase</Option>
                <Option value="refund">Refund</Option>
                <Option value="transfer">Transfer</Option>
                <Option value="redemption">Redemption</Option>
                <Option value="event">Event</Option>
                <Option value="adjustment">Adjustment</Option>
            </Select>
            <Input
                placeholder="Related ID"
                type="number"
                value={state.filters.relatedId}
                onChange={(e) =>
                    setState(prev => ({
                        ...prev,
                        filters: { ...prev.filters, relatedId: e.target.value },
                    }))
                }
                style={{ width: 120 }}
            />
            <Input
                placeholder="Amount"
                type="number"
                value={state.filters.amount}
                onChange={(e) =>
                    setState(prev => ({
                        ...prev,
                        filters: { ...prev.filters, amount: e.target.value },
                    }))
                }
                style={{ width: 120 }}
            />
            <Select
                placeholder="Operator"
                value={state.filters.operator || undefined}
                style={{ width: 150 }}
                onChange={(value) =>
                    setState(prev => ({
                        ...prev,
                        filters: { ...prev.filters, operator: value },
                    }))
                }
                allowClear
            >
                <Option value="gte">{'>='}</Option>
                <Option value="lte">{'<='}</Option>
            </Select>
            <Button
                type="primary"
                onClick={() => {
                    // Reset to the first page and then fetch transactions with new filters.
                    setState(prev => ({
                        ...prev,
                        pagination: { ...prev.pagination, current: 1 },
                    }));
                    fetchTransactions();
                }}
            >
                Search
            </Button>
            {(!!state.filters.amount !== !!state.filters.operator) && (
                <Alert
                    type="warning"
                    message="Both Amount and Operator must be specified to filter by amount."
                    showIcon
                    style={{ marginBottom: 16 }}
                />
            )}
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
                <Card title="All Transactions">
                    {renderFilters()}
                    <Table
                        columns={columns}
                        dataSource={state.transactions}
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
                        showTotal={(total) => `Total ${total} items`}
                    />
                </Card>
            </NavBar>
        </div>
    );
};

export default Transactions;
