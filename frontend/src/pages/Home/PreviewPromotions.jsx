import React, { useEffect, useState } from 'react';

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3100";

const PreviewPromotions = () => {
    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRecentPromotions = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('authToken');
                const response = await fetch(`${API_URL}/promotions?limit=3`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error(`${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                setPromotions(data.results || []);
            } catch (err) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchRecentPromotions();
    }, []);

    const formatDate = (isoString) => {
        try {
            return new Date(isoString).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return '';
        }
    };

    if (loading) return <p>Loading recent promotions...</p>;
    if (error) return <p style={{ color: 'red' }}>Error {error}</p>;

    return (
        <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            {promotions.length === 0 ? (
                <p>No recent promotions.</p>
            ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {promotions.map(promotion => (
                        <li key={promotion.id} style={{ marginBottom: '12px' }}>
                            <div><strong>{promotion.name}</strong> — Ends at {formatDate(promotion.endTime)}</div>
                            <div>{promotion.description}</div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default PreviewPromotions;
