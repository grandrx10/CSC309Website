// PromotionForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import NavBar from '../../../components/NavBar';

const PromotionForm = ({ isEdit }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        type: 'automatic',
        startTime: '',
        endTime: '',
        minSpending: '',
        rate: '',
        points: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isEdit) {
            const fetchPromotion = async () => {
                try {
                    setLoading(true);
                    const token = localStorage.getItem('authToken');
                    const response = await fetch(`http://localhost:3100/promotions/${id}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (!response.ok) {
                        throw new Error('Failed to fetch promotion');
                    }

                    const data = await response.json();
                    setFormData({
                        name: data.name,
                        description: data.description,
                        type: data.type,
                        startTime: new Date(data.startTime).toISOString().slice(0, 16),
                        endTime: new Date(data.endTime).toISOString().slice(0, 16),
                        minSpending: data.minSpending || '',
                        rate: data.rate || '',
                        points: data.points || ''
                    });
                } catch (err) {
                    console.error('Error fetching promotion:', err);
                    setError(err.message);
                } finally {
                    setLoading(false);
                }
            };

            fetchPromotion();
        }
    }, [id, isEdit]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError(null);
            
            const token = localStorage.getItem('authToken');
            const url = isEdit ? `http://localhost:3100/promotions/${id}` : 'http://localhost:3100/promotions';
            const method = isEdit ? 'PATCH' : 'POST';
    
            // Prepare payload with all required fields
            const payload = {
                name: formData.name || '', // Required
                description: formData.description || '', // Required
                type: formData.type || 'automatic', // Required, default to automatic
                startTime: formData.startTime ? new Date(formData.startTime).toISOString() : new Date().toISOString(), // Required
                endTime: formData.endTime ? new Date(formData.endTime).toISOString() : new Date(Date.now() + 86400000).toISOString(), // Required (+1 day)
                minSpending: formData.minSpending ? parseFloat(formData.minSpending) : null,
                rate: formData.rate ? parseFloat(formData.rate) : null,
                points: formData.points ? parseInt(formData.points) : null
            };
    
            console.log('Submitting payload:', payload); // Debug log
    
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
    
            const responseData = await response.json(); // Always parse response
            
            if (!response.ok) {
                console.error('Server response:', responseData); // Debug log
                throw new Error(responseData.error || 'Failed to save promotion');
            }
    
            navigate(isEdit ? `/promotions/${id}` : `/promotions/${responseData.id}`);
        } catch (err) {
            console.error('Error details:', err); // More detailed error logging
            setError(err.message || 'Failed to save promotion. Please check all fields and try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ paddingTop: '60px' }}>
            <NavBar />
            <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
                <h2>{isEdit ? 'Edit Promotion' : 'Create New Promotion'}</h2>
                
                {error && (
                    <div style={{ 
                        backgroundColor: '#fff1f0', 
                        border: '1px solid #ffa39e', 
                        borderRadius: '4px', 
                        padding: '10px', 
                        color: '#cf1322',
                        marginBottom: '20px'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ 
                    backgroundColor: '#fff', 
                    padding: '20px', 
                    borderRadius: '4px', 
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Name:</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            style={{ 
                                width: '100%', 
                                padding: '8px', 
                                border: '1px solid #d9d9d9', 
                                borderRadius: '4px' 
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Description:</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            required
                            style={{ 
                                width: '100%', 
                                padding: '8px', 
                                border: '1px solid #d9d9d9', 
                                borderRadius: '4px',
                                minHeight: '80px'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Type:</label>
                        <select
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            required
                            style={{ 
                                width: '100%', 
                                padding: '8px', 
                                border: '1px solid #d9d9d9', 
                                borderRadius: '4px' 
                            }}
                        >
                            <option value="automatic">Automatic</option>
                            <option value="one-time">One-Time</option>
                        </select>
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Start Time:</label>
                        <input
                            type="datetime-local"
                            name="startTime"
                            value={formData.startTime}
                            onChange={handleChange}
                            required
                            min={new Date().toISOString().slice(0, 16)}
                            style={{ 
                                width: '100%', 
                                padding: '8px', 
                                border: '1px solid #d9d9d9', 
                                borderRadius: '4px' 
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>End Time:</label>
                        <input
                            type="datetime-local"
                            name="endTime"
                            value={formData.endTime}
                            onChange={handleChange}
                            required
                            min={formData.startTime || new Date().toISOString().slice(0, 16)}
                            style={{ 
                                width: '100%', 
                                padding: '8px', 
                                border: '1px solid #d9d9d9', 
                                borderRadius: '4px' 
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Minimum Spending (optional):</label>
                        <input
                            type="number"
                            name="minSpending"
                            value={formData.minSpending}
                            onChange={handleChange}
                            min="0"
                            step="0.01"
                            style={{ 
                                width: '100%', 
                                padding: '8px', 
                                border: '1px solid #d9d9d9', 
                                borderRadius: '4px' 
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Discount Rate (optional):</label>
                        <input
                            type="number"
                            name="rate"
                            value={formData.rate}
                            onChange={handleChange}
                            min="0"
                            max="1"
                            step="0.01"
                            style={{ 
                                width: '100%', 
                                padding: '8px', 
                                border: '1px solid #d9d9d9', 
                                borderRadius: '4px' 
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Points (optional):</label>
                        <input
                            type="number"
                            name="points"
                            value={formData.points}
                            onChange={handleChange}
                            min="0"
                            style={{ 
                                width: '100%', 
                                padding: '8px', 
                                border: '1px solid #d9d9d9', 
                                borderRadius: '4px' 
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{ 
                                padding: '8px 16px', 
                                backgroundColor: '#52c41a', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            {loading ? 'Saving...' : 'Save'}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate(isEdit ? `/promotions/${id}` : '/promotions')}
                            style={{ 
                                padding: '8px 16px', 
                                backgroundColor: '#f0f0f0', 
                                border: '1px solid #d9d9d9', 
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PromotionForm;