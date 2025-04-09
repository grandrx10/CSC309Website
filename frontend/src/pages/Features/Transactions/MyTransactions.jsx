import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import NavBar from '../../../components/NavBar';

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3100";

const MyTransactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [inputErrors, setInputErrors] = useState({});
    const [searchParams, setSearchParams] = useSearchParams();
    const [userCache, setUserCache] = useState({});
    const [eventCache, setEventCache] = useState({});
    const navigate = useNavigate();

    // Get initial state from URL or use defaults
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const type = searchParams.get('type') || '';
    const promotionId = searchParams.get('promotionId') || '';
    const amount = searchParams.get('amount') || '0';
    const operator = searchParams.get('operator') || 'gte';
    const relatedId = searchParams.get('relatedId') || '';
    
    const [filters, setFilters] = useState({ 
        type,
        promotionId,
        amount,
        operator,
        relatedId
    });

    // Fetch user details for transfers and redemptions
    const fetchUserDetails = useCallback(async (utorid) => {
        if (!utorid || userCache[utorid]) return userCache[utorid];
        
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_URL}/users?name=${utorid}&limit=1`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.results.length > 0) {
                    const user = data.results[0];
                    setUserCache(prev => ({ ...prev, [utorid]: user }));
                    return user;
                }
            }
            return null;
        } catch (err) {
            console.error('Error fetching user:', err);
            return null;
        }
    }, [userCache]);

    // Fetch event details for event transactions
    const fetchEventDetails = useCallback(async (eventId) => {
        if (!eventId || eventCache[eventId]) return eventCache[eventId];
        
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_URL}/events/${eventId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const event = await response.json();
                setEventCache(prev => ({ ...prev, [eventId]: event }));
                return event;
            }
            return null;
        } catch (err) {
            console.error('Error fetching event:', err);
            return null;
        }
    }, [eventCache]);

    const validatePromotionId = (value) => {
        if (value === '') return true;
        return /^\d+$/.test(value);
    };

    const validateRelatedId = (value) => {
        if (value === '') return true;
        return /^\d+$/.test(value);
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        const newErrors = { ...inputErrors };

        if (name === 'promotionId') {
            const valid = validatePromotionId(value);
            newErrors.promotionId = valid ? null : 'Promotion ID must contain only numbers';
            setInputErrors(newErrors);
            
            if (!valid && value !== '') return;
        }

        if (name === 'relatedId') {
            const valid = validateRelatedId(value);
            newErrors.relatedId = valid ? null : 'Related ID must contain only numbers';
            setInputErrors(newErrors);
            
            if (!valid && value !== '') return;
        }

        const newValue = name === 'amount' ? (value === '' ? '0' : value) : value;
        
        setFilters(prev => ({ ...prev, [name]: newValue }));
        setSearchParams(prev => {
            prev.set('page', '1');
            prev.set(name, newValue);
            return prev;
        });
    };

    const fetchTransactions = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('authToken');
            
            const params = new URLSearchParams();
            params.append('page', page);
            params.append('limit', limit);
            
            if (filters.type) params.append('type', filters.type);
            if (filters.promotionId) params.append('promotionId', filters.promotionId);
            if (filters.relatedId && filters.type) params.append('relatedId', filters.relatedId);
            params.append('amount', filters.amount);
            params.append('operator', filters.operator);

            const response = await fetch(`${API_URL}/users/me/transactions?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server responded with status: ${response.status}. Response: ${errorText}`);
            }

            const data = await response.json();
            setTransactions(data.results || []);
            
            // Pre-fetch related data
            for (const transaction of data.results || []) {
                if (transaction.type.toLowerCase() === 'transfer' && transaction.relatedId) {
                    fetchUserDetails(transaction.createdBy);
                }
                if (transaction.type.toLowerCase() === 'event' && transaction.relatedId) {
                    fetchEventDetails(transaction.relatedId);
                }
                if (transaction.type.toLowerCase() === 'redemption' && transaction.processedBy) {
                    fetchUserDetails(transaction.processedBy);
                }
            }
            
            const newSearchParams = new URLSearchParams();
            newSearchParams.set('page', page);
            newSearchParams.set('limit', limit);
            if (filters.type) newSearchParams.set('type', filters.type);
            if (filters.promotionId) newSearchParams.set('promotionId', filters.promotionId);
            if (filters.relatedId && filters.type) newSearchParams.set('relatedId', filters.relatedId);
            newSearchParams.set('amount', filters.amount);
            newSearchParams.set('operator', filters.operator);
            
            setSearchParams(newSearchParams);
        } catch (err) {
            console.error('Error fetching transactions:', err);
            setError(err.message);
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    }, [page, limit, filters, setSearchParams, fetchUserDetails, fetchEventDetails]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    const handlePageChange = (newPage) => {
        setSearchParams(prev => {
            prev.set('page', newPage.toString());
            return prev;
        });
    };

    const handleLimitChange = (newLimit) => {
        setSearchParams(prev => {
            prev.set('limit', newLimit.toString());
            prev.set('page', '1');
            return prev;
        });
    };

    const formatDate = (isoString) => {
        if (!isoString) return '';
        
        try {
            const date = new Date(isoString);
            return date.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            console.error('Error formatting date:', isoString, e);
            return 'Invalid date';
        }
    };

    const getTransactionColor = (type) => {
        switch (type.toLowerCase()) {
            case 'purchase': return '#52c41a';
            case 'adjustment': return '#faad14';
            case 'transfer': return '#1890ff';
            case 'redemption': return '#f5222d';
            case 'event': return '#722ed1';
            default: return '#d9d9d9';
        }
    };

    const getTransactionTitle = (transaction) => {
        switch (transaction.type.toLowerCase()) {
            case 'purchase':
                return `Purchase - Earned ${transaction.amount} points`;
            case 'adjustment':
                return `Points Adjustment - ${transaction.amount > 0 ? 'Added' : 'Deducted'} ${Math.abs(transaction.amount)} points`;
            case 'transfer':
                if (transaction.amount > 0) {
                    return `Received ${transaction.amount} points`;
                } else {
                    return `Sent ${Math.abs(transaction.amount)} points`;
                }
            case 'redemption':
                return `Redeemed ${transaction.amount} points`;
            case 'event':
                return `Event Reward - Received ${transaction.earned || transaction.amount} points`;
            default:
                return transaction.type;
        }
    };

    const getTransactionDetails = (transaction) => {
        const details = [];
        
        // Common details for all transaction types
        details.push(`Transaction ID: ${transaction.id}`);
        
        // Show related ID for all transaction types that have it
        if (transaction.relatedId) {
            details.push(`Related ID: ${transaction.relatedId}`);
        }

        // Type-specific details
        switch (transaction.type.toLowerCase()) {
            case 'purchase':
                details.push(`Spent: $${transaction.spent?.toFixed(2) || '0.00'}`);
                details.push(`Points Earned: ${transaction.amount}`);
                break;
                
            case 'adjustment':
                details.push(`Points ${transaction.amount > 0 ? 'Added' : 'Deducted'}: ${Math.abs(transaction.amount)}`);
                break;
                
            case 'transfer':
                if (transaction.amount > 0) {
                    // Received points
                    const sender = userCache[transaction.createdBy];
                    details.push(`From: ${sender ? sender.name : transaction.createdBy}`);
                } else {
                    // Sent points
                    if (transaction.relatedId) {
                        const receiver = userCache[transaction.relatedId];
                        details.push(`To: ${receiver ? receiver.name : `User ID ${transaction.relatedId}`}`);
                    }
                }
                details.push(`Points: ${Math.abs(transaction.amount)}`);
                break;
                
            case 'redemption':
                details.push(`Points Redeemed: ${transaction.amount}`);
                if (transaction.processedBy) {
                    const cashier = userCache[transaction.processedBy];
                    details.push(`Processed by: ${cashier ? cashier.name : transaction.processedBy}`);
                }
                if (transaction.processed) {
                    details.push(`Status: Completed`);
                } else {
                    details.push(`Status: Pending`);
                }
                break;
                
            case 'event':
                const eventPoints = transaction.earned || transaction.amount;
                details.push(`Points Awarded: ${eventPoints}`);
                if (transaction.relatedId) {
                    const event = eventCache[transaction.relatedId];
                    details.push(`Event: ${event ? event.name : `Event ID ${transaction.relatedId}`}`);
                }
                break;
        }
        
        // Promotion details if applicable
        if (transaction.promotionIds?.length > 0) {
            details.push(`Promotions Applied: ${transaction.promotionIds.join(', ')}`);
        }
        
        // Remark if exists
        if (transaction.remark) {
            details.push(`Note: ${transaction.remark}`);
        }
        
        // Suspicious flag
        if (transaction.suspicious) {
            details.push(`⚠️ Flagged as suspicious`);
        }
        
        return details;
    };

    return (
        <div>
            <NavBar>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2>My Transactions</h2>
                    <button 
                        onClick={() => fetchTransactions()}
                        style={{ 
                            padding: '8px 16px', 
                            backgroundColor: '#1890ff', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Refresh
                    </button>
                </div>
                
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                    <select
                        name="type"
                        value={filters.type}
                        onChange={handleFilterChange}
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #d9d9d9', minWidth: '120px' }}
                    >
                        <option value="">All Types</option>
                        <option value="purchase">Purchases</option>
                        <option value="adjustment">Adjustments</option>
                        <option value="transfer">Transfers</option>
                        <option value="redemption">Redemptions</option>
                        <option value="event">Event Rewards</option>
                    </select>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <input
                            type="text"
                            name="promotionId"
                            placeholder="Promotion ID"
                            value={filters.promotionId}
                            onChange={handleFilterChange}
                            style={{ 
                                padding: '8px', 
                                borderRadius: '4px', 
                                border: `1px solid ${inputErrors.promotionId ? '#ff4d4f' : '#d9d9d9'}`, 
                                minWidth: '120px' 
                            }}
                        />
                        {inputErrors.promotionId && (
                            <span style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px' }}>
                                {inputErrors.promotionId}
                            </span>
                        )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <input
                            type="text"
                            name="relatedId"
                            placeholder="Related ID"
                            value={filters.relatedId}
                            onChange={handleFilterChange}
                            style={{ 
                                padding: '8px', 
                                borderRadius: '4px', 
                                border: `1px solid ${inputErrors.relatedId ? '#ff4d4f' : '#d9d9d9'}`, 
                                minWidth: '120px' 
                            }}
                            disabled={!filters.type}
                        />
                        {inputErrors.relatedId && (
                            <span style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px' }}>
                                {inputErrors.relatedId}
                            </span>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '5px' }}>
                        <select
                            name="operator"
                            value={filters.operator}
                            onChange={handleFilterChange}
                            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #d9d9d9', minWidth: '120px' }}
                        >
                            <option value="gte">≥ (Points greater than or equal)</option>
                            <option value="lte">≤ (Points less than or equal)</option>
                        </select>
                        <input
                            type="number"
                            name="amount"
                            placeholder="Points"
                            value={filters.amount}
                            onChange={handleFilterChange}
                            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #d9d9d9', minWidth: '80px' }}
                        />
                    </div>
                </div>

                {loading && <p style={{ textAlign: 'center', padding: '20px' }}>Loading transactions...</p>}
                {error && (
                    <div style={{ backgroundColor: '#fff1f0', border: '1px solid #ffa39e', borderRadius: '4px', padding: '10px', color: '#cf1322', marginBottom: '20px' }}>
                        Error: {error}
                    </div>
                )}

                {!loading && !error && (
                    <div>
                        {transactions.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {transactions.map(transaction => (
                                    <div 
                                        key={transaction.id}
                                        style={{ 
                                            border: `1px solid ${getTransactionColor(transaction.type)}`,
                                            borderRadius: '4px',
                                            padding: '15px',
                                            backgroundColor: '#fff',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                            <div>
                                                <h4 style={{ color: getTransactionColor(transaction.type), margin: 0 }}>
                                                    {getTransactionTitle(transaction)}
                                                </h4>
                                                <span style={{ color: '#666', fontSize: '12px' }}>
                                                    {formatDate(transaction?.createdAt)}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                            {getTransactionDetails(transaction).map((detail, index) => (
                                                <div key={index} style={{ fontSize: '14px' }}>
                                                    {detail.includes('Flagged') ? (
                                                        <span style={{ color: '#f5222d' }}>{detail}</span>
                                                    ) : detail.includes('Note:') ? (
                                                        <span style={{ fontStyle: 'italic' }}>{detail}</span>
                                                    ) : (
                                                        detail
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #d9d9d9' }}>
                                No transactions found
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                            <div>
                                <button
                                    onClick={() => handlePageChange(page - 1)}
                                    disabled={page === 1}
                                    style={{ 
                                        padding: '5px 10px', 
                                        marginRight: '10px',
                                        backgroundColor: page === 1 ? '#f5f5f5' : '#fff',
                                        border: '1px solid #d9d9d9',
                                        borderRadius: '4px',
                                        cursor: page === 1 ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    Previous
                                </button>
                                <span style={{ margin: '0 10px' }}>
                                    Page {page} of {Math.max(1, Math.ceil(transactions.length / limit))}
                                </span>
                                <button
                                    onClick={() => handlePageChange(page + 1)}
                                    disabled={transactions.length < limit}
                                    style={{ 
                                        padding: '5px 10px', 
                                        marginLeft: '10px',
                                        backgroundColor: transactions.length < limit ? '#f5f5f5' : '#fff',
                                        border: '1px solid #d9d9d9',
                                        borderRadius: '4px',
                                        cursor: transactions.length < limit ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    Next
                                </button>
                            </div>
                            <div>
                                <select
                                    value={limit}
                                    onChange={(e) => handleLimitChange(e.target.value)}
                                    style={{ padding: '5px 10px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                                >
                                    <option value="5">5 per page</option>
                                    <option value="10">10 per page</option>
                                    <option value="20">20 per page</option>
                                    <option value="50">50 per page</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}
            </NavBar>
        </div>
    );
};

export default MyTransactions;