import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../../../components/NavBar';

const ManagePromotion = () => {
    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [mode, setMode] = useState('list');
    const [currentPromotion, setCurrentPromotion] = useState({
        id: null,
        name: '',
        description: '',
        type: 'automatic',
        startTime: '',
        endTime: '',
        minSpending: '',
        rate: '',
        points: ''
    });

    const apiRequest = async (url, method, body = null) => {
        const backendUrl = 'http://localhost:3001';
        const fullUrl = `${backendUrl}${url}`;
        
        // Use 'authToken' instead of 'token'
        const token = localStorage.getItem('authToken');
        
        const headers = {
            'Content-Type': 'application/json',
        };
    
        // Only add Authorization header if token exists
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    
        const config = {
            method,
            headers,
        };
    
        if (body) {
            config.body = JSON.stringify(body);
        }
    
        try {
            const response = await fetch(fullUrl, config);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
    
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }
            
            return {};
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    };

    const fetchPromotions = async () => {
        try {
            const data = await apiRequest('/promotions', 'GET');
            setPromotions(data.results || []);
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPromotions();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCurrentPromotion(prev => ({ ...prev, [name]: value }));
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            // Validate required fields
            if (!currentPromotion.name || !currentPromotion.description || !currentPromotion.startTime || !currentPromotion.endTime) {
                throw new Error("Missing required fields");
            }
        
            // Format dates for backend
            const payload = {
                ...currentPromotion,
                startTime: new Date(currentPromotion.startTime).toISOString(),
                endTime: new Date(currentPromotion.endTime).toISOString(),
                minSpending: currentPromotion.minSpending || null,
                rate: currentPromotion.rate || null,
                points: currentPromotion.points || null,
            };
        
            const response = await apiRequest('/promotions', 'POST', payload);
            console.log("Promotion created:", response);
            await fetchPromotions(); // Refresh the list
            setMode('list'); // Switch back to list view
            resetForm(); // Clear the form
        } catch (err) {
            console.error("Creation failed:", err);
            setError(err.message || "Failed to create promotion");
        }
    };

    const handleEdit = async (e) => {
        e.preventDefault();
        try {
            console.log('[handleEdit] Starting edit process...');
            console.log('[handleEdit] Current promotion ID:', currentPromotion.id);
            
            // Find the original promotion data
            const originalPromotion = promotions.find(p => p.id === currentPromotion.id);
            if (!originalPromotion) {
                console.error('[handleEdit] Original promotion not found!');
                throw new Error("Original promotion data not found");
            }
            
            console.log('[handleEdit] Original promotion data:', originalPromotion);
            console.log('[handleEdit] Current form data:', currentPromotion);
    
            // Create payload with only changed fields
            const payload = {};
            
            // Compare each field and add to payload if changed
            if (currentPromotion.name !== originalPromotion.name) {
                console.log('[handleEdit] Name changed:', originalPromotion.name, '->', currentPromotion.name);
                payload.name = currentPromotion.name;
            }
            
            if (currentPromotion.description !== originalPromotion.description) {
                console.log('[handleEdit] Description changed');
                payload.description = currentPromotion.description;
            }
            
            if (currentPromotion.type !== originalPromotion.type) {
                console.log('[handleEdit] Type changed:', originalPromotion.type, '->', currentPromotion.type);
                payload.type = currentPromotion.type;
            }
            
            // Compare dates (need to handle date formatting)
            const originalStartTime = new Date(originalPromotion.startTime).toISOString();
            const newStartTime = new Date(currentPromotion.startTime).toISOString();
            if (newStartTime !== originalStartTime) {
                console.log('[handleEdit] Start time changed:', originalStartTime, '->', newStartTime);
                payload.startTime = newStartTime;
            }
            
            const originalEndTime = new Date(originalPromotion.endTime).toISOString();
            const newEndTime = new Date(currentPromotion.endTime).toISOString();
            if (newEndTime !== originalEndTime) {
                console.log('[handleEdit] End time changed:', originalEndTime, '->', newEndTime);
                payload.endTime = newEndTime;
            }
            
            // Optional fields
            if (currentPromotion.minSpending !== originalPromotion.minSpending) {
                console.log('[handleEdit] Min spending changed:', originalPromotion.minSpending, '->', currentPromotion.minSpending);
                payload.minSpending = currentPromotion.minSpending || null;
            }
            
            if (currentPromotion.rate !== originalPromotion.rate) {
                console.log('[handleEdit] Rate changed:', originalPromotion.rate, '->', currentPromotion.rate);
                payload.rate = currentPromotion.rate || null;
            }
            
            if (currentPromotion.points !== originalPromotion.points) {
                console.log('[handleEdit] Points changed:', originalPromotion.points, '->', currentPromotion.points);
                payload.points = currentPromotion.points || null;
            }
            
            // Check if any fields were actually changed
            if (Object.keys(payload).length === 0) {
                console.warn('[handleEdit] No fields were changed!');
                throw new Error("No fields were changed");
            }
            
            console.log('[handleEdit] Final payload to send:', payload);
            
            console.log('[handleEdit] Sending PATCH request...');
            const response = await apiRequest(`/promotions/${currentPromotion.id}`, 'PATCH', payload);
            console.log('[handleEdit] Server response:', response);
            
            console.log('[handleEdit] Refreshing promotions list...');
            await fetchPromotions();
            
            console.log('[handleEdit] Resetting form and switching to list view...');
            setMode('list');
            resetForm();
            
            console.log('[handleEdit] Edit completed successfully!');
        } catch (err) {
            console.error('[handleEdit] Error during edit:', err);
            console.error('[handleEdit] Error details:', {
                message: err.message,
                stack: err.stack,
                response: err.response
            });
            setError(err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this promotion?")) return;
        try {
            await apiRequest(`/promotions/${id}`, 'DELETE');
            await fetchPromotions();
        } catch (err) {
            setError(err.message);
        }
    };

    const startCreate = () => {
        resetForm();
        setMode('create');
    };

    const startEdit = (promotion) => {
        setCurrentPromotion({
            ...promotion,
            startTime: promotion.startTime.slice(0, 16),
            endTime: promotion.endTime.slice(0, 16)
        });
        setMode('edit');
    };

    const cancel = () => {
        setMode('list');
        resetForm();
    };

    const resetForm = () => {
        setCurrentPromotion({
            id: null,
            name: '',
            description: '',
            type: 'automatic',
            startTime: '',
            endTime: '',
            minSpending: '',
            rate: '',
            points: ''
        });
        setError('');
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    return (
        <NavBar>
            <div>
                <h1>Manage Promotions</h1>
                
                {error && (
                    <div style={{ color: 'red', margin: '10px 0', padding: '10px', border: '1px solid red' }}>
                        Error: {error}
                    </div>
                )}

                {mode === 'list' ? (
                    <>
                        <button onClick={startCreate}>Create New Promotion</button>
                        
                        <h2>Existing Promotions</h2>
                        {loading ? (
                            <p>Loading promotions...</p>
                        ) : promotions.length === 0 ? (
                            <p>No promotions found</p>
                        ) : (
                            <table border="1" style={{ width: '100%', marginTop: '20px' }}>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Name</th>
                                        <th>Type</th>
                                        <th>Start Time</th>
                                        <th>End Time</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {promotions.map(promo => (
                                        <tr key={promo.id}>
                                            <td>{promo.id}</td>
                                            <td>{promo.name}</td>
                                            <td>{promo.type}</td>
                                            <td>{formatDate(promo.startTime)}</td>
                                            <td>{formatDate(promo.endTime)}</td>
                                            <td>
                                                <button onClick={() => startEdit(promo)}>Edit</button>
                                                <button 
                                                    onClick={() => handleDelete(promo.id)}
                                                    style={{ marginLeft: '10px' }}
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </>
                ) : (
                    <>
                        <h2>{mode === 'create' ? 'Create New Promotion' : 'Edit Promotion'}</h2>
                        <form onSubmit={mode === 'create' ? handleCreate : handleEdit}>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Name:</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={currentPromotion.name}
                                    onChange={handleInputChange}
                                    required
                                    style={{ width: '100%', padding: '8px' }}
                                />
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Description:</label>
                                <textarea
                                    name="description"
                                    value={currentPromotion.description}
                                    onChange={handleInputChange}
                                    required
                                    style={{ width: '100%', padding: '8px', minHeight: '100px' }}
                                />
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Type:</label>
                                <select
                                    name="type"
                                    value={currentPromotion.type}
                                    onChange={handleInputChange}
                                    required
                                    style={{ width: '100%', padding: '8px' }}
                                >
                                    <option value="automatic">Automatic</option>
                                    <option value="one-time">One-Time</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Start Time:</label>
                                <input
                                    type="datetime-local"
                                    name="startTime"
                                    value={currentPromotion.startTime}
                                    onChange={handleInputChange}
                                    required
                                    style={{ width: '100%', padding: '8px' }}
                                />
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>End Time:</label>
                                <input
                                    type="datetime-local"
                                    name="endTime"
                                    value={currentPromotion.endTime}
                                    onChange={handleInputChange}
                                    required
                                    style={{ width: '100%', padding: '8px' }}
                                />
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Minimum Spending (optional):</label>
                                <input
                                    type="number"
                                    name="minSpending"
                                    value={currentPromotion.minSpending}
                                    onChange={handleInputChange}
                                    min="0"
                                    step="0.01"
                                    style={{ width: '100%', padding: '8px' }}
                                />
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Discount Rate (optional):</label>
                                <input
                                    type="number"
                                    name="rate"
                                    value={currentPromotion.rate}
                                    onChange={handleInputChange}
                                    min="0"
                                    step="0.01"
                                    style={{ width: '100%', padding: '8px' }}
                                />
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Reward Points (optional):</label>
                                <input
                                    type="number"
                                    name="points"
                                    value={currentPromotion.points}
                                    onChange={handleInputChange}
                                    min="0"
                                    style={{ width: '100%', padding: '8px' }}
                                />
                            </div>

                            <div>
                                <button type="submit" style={{ padding: '10px 15px', marginRight: '10px' }}>
                                    {mode === 'create' ? 'Create' : 'Save'}
                                </button>
                                <button 
                                    type="button" 
                                    onClick={cancel}
                                    style={{ padding: '10px 15px' }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </NavBar>
    );
};

export default ManagePromotion;