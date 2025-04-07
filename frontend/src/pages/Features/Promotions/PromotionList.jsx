import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../../../components/NavBar';

const PromotionList = () => {
    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        count: 0
    });
    const [filters, setFilters] = useState({
        name: '',
        type: '',
        started: '',
        ended: ''
    });
    const navigate = useNavigate();

    const fetchPromotions = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('No authentication token found');
            }
            
            // Build query parameters
            const params = new URLSearchParams();
            params.append('page', pagination.page);
            params.append('limit', pagination.limit);
            
            if (filters.name) params.append('name', filters.name);
            if (filters.type) params.append('type', filters.type);
            
            if (filters.started) params.append('started', filters.started === 'true' ? 'true' : 'false');
            if (filters.ended) params.append('ended', filters.ended === 'true' ? 'true' : 'false');
    
            // Remove undefined or null params
            Array.from(params.keys()).forEach(key => {
                if (params.get(key) === 'undefined' || params.get(key) === 'null' || params.get(key) === '') {
                    params.delete(key);
                }
            });
    
            const response = await fetch(`http://localhost:3100/promotions?${params.toString()}`, {
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
            setPromotions(data.results || []);
            setPagination(prev => ({ ...prev, count: data.count || 0 }));
        } catch (err) {
            console.error('Error fetching promotions:', err);
            setError(err.message);
            setPromotions([]);
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, filters]);

    useEffect(() => {
        fetchPromotions();
    }, [fetchPromotions]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    };

    const getPromotionStatus = (startTime, endTime) => {
        const now = new Date();
        const start = new Date(startTime);
        const end = new Date(endTime);
        
        if (now < start) return 'Not Started';
        if (now > end) return 'Ended';
        return 'Active';
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Active': return 'green';
            case 'Not Started': return 'orange';
            case 'Ended': return 'red';
            default: return 'black';
        }
    };

    return (
        <div style={{ paddingTop: '60px' }}> {/* Add padding to account for navbar */}
            <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2>Promotions</h2>
                    <button 
                        onClick={() => fetchPromotions()}
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
                
                {/* Filters */}
                <div style={{ 
                    display: 'flex', 
                    gap: '10px', 
                    marginBottom: '20px',
                    flexWrap: 'wrap'
                }}>
                    <input
                        type="text"
                        name="name"
                        placeholder="Search by name"
                        value={filters.name}
                        onChange={handleFilterChange}
                        style={{ 
                            padding: '8px', 
                            borderRadius: '4px', 
                            border: '1px solid #d9d9d9',
                            minWidth: '200px'
                        }}
                    />
                    <select
                        name="type"
                        value={filters.type}
                        onChange={handleFilterChange}
                        style={{ 
                            padding: '8px', 
                            borderRadius: '4px', 
                            border: '1px solid #d9d9d9',
                            minWidth: '120px'
                        }}
                    >
                        <option value="">All Types</option>
                        <option value="automatic">Automatic</option>
                        <option value="one-time">One-Time</option>
                    </select>
                    <select
                        name="started"
                        value={filters.started}
                        onChange={handleFilterChange}
                        style={{ 
                            padding: '8px', 
                            borderRadius: '4px', 
                            border: '1px solid #d9d9d9',
                            minWidth: '120px'
                        }}
                    >
                        <option value="">All Start Status</option>
                        <option value="true">Started</option>
                        <option value="false">Not Started</option>
                    </select>
                    <select
                        name="ended"
                        value={filters.ended}
                        onChange={handleFilterChange}
                        style={{ 
                            padding: '8px', 
                            borderRadius: '4px', 
                            border: '1px solid #d9d9d9',
                            minWidth: '120px'
                        }}
                    >
                        <option value="">All End Status</option>
                        <option value="true">Ended</option>
                        <option value="false">Not Ended</option>
                    </select>
                </div>

                {loading && <p style={{ textAlign: 'center', padding: '20px' }}>Loading promotions...</p>}
                {error && (
                    <div style={{ 
                        backgroundColor: '#fff1f0', 
                        border: '1px solid #ffa39e', 
                        borderRadius: '4px', 
                        padding: '10px', 
                        color: '#cf1322',
                        marginBottom: '20px'
                    }}>
                        Error: {error}
                    </div>
                )}

                {!loading && !error && (
                    <div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ 
                                width: '100%', 
                                borderCollapse: 'collapse', 
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)' 
                            }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f0f0f0' }}>
                                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e8e8e8' }}>Name</th>
                                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e8e8e8' }}>Type</th>
                                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e8e8e8' }}>Start Time</th>
                                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e8e8e8' }}>End Time</th>
                                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e8e8e8' }}>Min Spending</th>
                                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e8e8e8' }}>Rate</th>
                                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e8e8e8' }}>Points</th>
                                        <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e8e8e8' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {promotions.length > 0 ? (
                                        promotions.map(promo => {
                                            const status = getPromotionStatus(promo.startTime, promo.endTime);
                                            const statusColor = getStatusColor(status);
                                            
                                            return (
                                                <tr key={promo.id} style={{ borderBottom: '1px solid #e8e8e8' }}>
                                                    <td style={{ padding: '12px' }}>{promo.name}</td>
                                                    <td style={{ padding: '12px' }}>{promo.type === 'automatic' ? 'Automatic' : 'One-Time'}</td>
                                                    <td style={{ padding: '12px' }}>{formatDate(promo.startTime)}</td>
                                                    <td style={{ padding: '12px' }}>{formatDate(promo.endTime)}</td>
                                                    <td style={{ padding: '12px' }}>{promo.minSpending ? `$${promo.minSpending.toFixed(2)}` : '-'}</td>
                                                    <td style={{ padding: '12px' }}>{promo.rate ? `${(promo.rate * 100).toFixed(0)}%` : '-'}</td>
                                                    <td style={{ padding: '12px' }}>{promo.points || '-'}</td>
                                                    <td style={{ 
                                                        padding: '12px', 
                                                        textAlign: 'center',
                                                        color: statusColor,
                                                        fontWeight: 'bold'
                                                    }}>
                                                        {status}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="8" style={{ padding: '20px', textAlign: 'center' }}>
                                                No promotions found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            marginTop: '20px'
                        }}>
                            <div>
                                <button
                                    onClick={() => handlePageChange(pagination.page - 1)}
                                    disabled={pagination.page === 1}
                                    style={{ 
                                        padding: '5px 10px', 
                                        marginRight: '10px',
                                        backgroundColor: pagination.page === 1 ? '#f5f5f5' : '#fff',
                                        border: '1px solid #d9d9d9',
                                        borderRadius: '4px',
                                        cursor: pagination.page === 1 ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    Previous
                                </button>
                                <span style={{ margin: '0 10px' }}>
                                    Page {pagination.page} of {Math.max(1, Math.ceil(pagination.count / pagination.limit))}
                                </span>
                                <button
                                    onClick={() => handlePageChange(pagination.page + 1)}
                                    disabled={pagination.page >= Math.ceil(pagination.count / pagination.limit)}
                                    style={{ 
                                        padding: '5px 10px', 
                                        marginLeft: '10px',
                                        backgroundColor: pagination.page >= Math.ceil(pagination.count / pagination.limit) ? '#f5f5f5' : '#fff',
                                        border: '1px solid #d9d9d9',
                                        borderRadius: '4px',
                                        cursor: pagination.page >= Math.ceil(pagination.count / pagination.limit) ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    Next
                                </button>
                            </div>
                            <div>
                                <select
                                    value={pagination.limit}
                                    onChange={(e) => setPagination(prev => ({
                                        ...prev,
                                        limit: parseInt(e.target.value),
                                        page: 1
                                    }))}
                                    style={{ 
                                        padding: '5px 10px',
                                        border: '1px solid #d9d9d9',
                                        borderRadius: '4px'
                                    }}
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
            </div>
        </div>
    );
};

export default PromotionList;