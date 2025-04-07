// PromotionDetailView.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import NavBar from '../../../components/NavBar';

const PromotionDetailView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [promotion, setPromotion] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPromotion = async () => {
            try {
                setLoading(true);
                setError(null);
                const token = localStorage.getItem('authToken');
                const response = await fetch(`http://localhost:3100/promotions/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch promotion details');
                }

                const data = await response.json();
                setPromotion(data);
            } catch (err) {
                console.error('Error fetching promotion:', err);
                setError(err.message);
                navigate('/promotions');
            } finally {
                setLoading(false);
            }
        };

        fetchPromotion();
    }, [id, navigate]);

    const handleDelete = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken');
            const response = await fetch(`http://localhost:3100/promotions/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete promotion');
            }

            navigate('/promotions');
        } catch (err) {
            console.error('Error deleting promotion:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div style={{ paddingTop: '60px' }}>
            <NavBar />
            <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2>Promotion Details</h2>
                    <div>
                        <button 
                            onClick={() => navigate(`/promotions/${id}/edit`)}
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
                            Edit
                        </button>
                        <button 
                            onClick={handleDelete}
                            style={{ 
                                padding: '8px 16px', 
                                backgroundColor: '#ff4d4f', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Delete
                        </button>
                    </div>
                </div>

                {promotion && (
                    <div style={{ 
                        backgroundColor: '#fff', 
                        padding: '20px', 
                        borderRadius: '4px', 
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{ marginBottom: '15px' }}>
                            <strong>Name:</strong> {promotion.name}
                        </div>
                        <div style={{ marginBottom: '15px' }}>
                            <strong>Description:</strong> {promotion.description}
                        </div>
                        <div style={{ marginBottom: '15px' }}>
                            <strong>Type:</strong> {promotion.type === 'automatic' ? 'Automatic' : 'One-Time'}
                        </div>
                        <div style={{ marginBottom: '15px' }}>
                            <strong>Start Time:</strong> {new Date(promotion.startTime).toLocaleString()}
                        </div>
                        <div style={{ marginBottom: '15px' }}>
                            <strong>End Time:</strong> {new Date(promotion.endTime).toLocaleString()}
                        </div>
                        <div style={{ marginBottom: '15px' }}>
                            <strong>Min Spending:</strong> {promotion.minSpending ? `$${promotion.minSpending.toFixed(2)}` : 'N/A'}
                        </div>
                        <div style={{ marginBottom: '15px' }}>
                            <strong>Rate:</strong> {promotion.rate ? `${(promotion.rate * 100).toFixed(0)}%` : 'N/A'}
                        </div>
                        <div style={{ marginBottom: '15px' }}>
                            <strong>Points:</strong> {promotion.points || 'N/A'}
                        </div>
                    </div>
                )}

                <button 
                    onClick={() => navigate('/promotions')}
                    style={{ 
                        marginTop: '20px',
                        padding: '8px 16px', 
                        backgroundColor: '#f0f0f0', 
                        border: '1px solid #d9d9d9', 
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Back to List
                </button>
            </div>
        </div>
    );
};

export default PromotionDetailView;