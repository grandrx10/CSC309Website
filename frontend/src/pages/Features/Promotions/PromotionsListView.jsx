// PromotionsListView.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import NavBar from '../../../components/NavBar';

const PromotionsListView = () => {
    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    // Get initial state from URL or use defaults
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const name = searchParams.get('name') || '';
    const type = searchParams.get('type') || '';
    const started = searchParams.get('started') || '';
    const ended = searchParams.get('ended') || '';

    const [filters, setFilters] = useState({
        name,
        type,
        started,
        ended
    });

    const fetchPromotions = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('authToken');
            
            // Build query parameters from current state
            const params = new URLSearchParams();
            params.append('page', page);
            params.append('limit', limit);
            
            if (filters.name) params.append('name', filters.name);
            if (filters.type) params.append('type', filters.type);
            if (filters.started) params.append('started', filters.started);
            if (filters.ended) params.append('ended', filters.ended);

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
            
            // Update URL with current filters
            const newSearchParams = new URLSearchParams();
            newSearchParams.set('page', page);
            newSearchParams.set('limit', limit);
            if (filters.name) newSearchParams.set('name', filters.name);
            if (filters.type) newSearchParams.set('type', filters.type);
            if (filters.started) newSearchParams.set('started', filters.started);
            if (filters.ended) newSearchParams.set('ended', filters.ended);
            setSearchParams(newSearchParams);
        } catch (err) {
            console.error('Error fetching promotions:', err);
            setError(err.message);
            setPromotions([]);
        } finally {
            setLoading(false);
        }
    }, [page, limit, filters, setSearchParams]);

    useEffect(() => {
        fetchPromotions();
    }, [fetchPromotions]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        // Reset to first page when filters change
        setSearchParams(prev => {
            prev.set('page', '1');
            prev.set(name, value);
            return prev;
        });
    };

    const handlePageChange = (newPage) => {
        setSearchParams(prev => {
            prev.set('page', newPage.toString());
            return prev;
        });
    };

    const handleLimitChange = (newLimit) => {
        setSearchParams(prev => {
            prev.set('limit', newLimit.toString());
            prev.set('page', '1'); // Reset to first page when limit changes
            return prev;
        });
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
        <div style={{ paddingTop: '60px' }}>
            <NavBar />
            <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2>Promotions</h2>
                    <div>
                        <button 
                            onClick={() => fetchPromotions()}
                            style={{ 
                                padding: '8px 16px', 
                                backgroundColor: '#1890ff', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '4px',
                                cursor: 'pointer',
                                marginRight: '10px'
                            }}
                        >
                            Refresh
                        </button>
                        <button 
                            onClick={() => navigate('/promotions/new')}
                            style={{ 
                                padding: '8px 16px', 
                                backgroundColor: '#52c41a', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Create New
                        </button>
                    </div>
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
                                        <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e8e8e8' }}>Actions</th>
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
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                        <button 
                                                            onClick={() => navigate(`/promotions/${promo.id}`)}
                                                            style={{
                                                                padding: '5px 10px',
                                                                backgroundColor: '#1890ff',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                marginRight: '5px'
                                                            }}
                                                        >
                                                            View
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="9" style={{ padding: '20px', textAlign: 'center' }}>
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
                                    Page {page} of {Math.max(1, Math.ceil(promotions.length / limit))}
                                </span>
                                <button
                                    onClick={() => handlePageChange(page + 1)}
                                    disabled={page >= Math.ceil(promotions.length / limit)}
                                    style={{ 
                                        padding: '5px 10px', 
                                        marginLeft: '10px',
                                        backgroundColor: page >= Math.ceil(promotions.length / limit) ? '#f5f5f5' : '#fff',
                                        border: '1px solid #d9d9d9',
                                        borderRadius: '4px',
                                        cursor: page >= Math.ceil(promotions.length / limit) ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    Next
                                </button>
                            </div>
                            <div>
                                <select
                                    value={limit}
                                    onChange={(e) => handleLimitChange(e.target.value)}
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

export default PromotionsListView;