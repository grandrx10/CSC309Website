import React, { useEffect, useState } from 'react';

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3100";

const PreviewEvents = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRecentEvents = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('authToken');
                const response = await fetch(`${API_URL}/events?limit=3`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error(`${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                setEvents(data.results || []);
            } catch (err) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchRecentEvents();
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

    if (loading) return <p>Loading recent events...</p>;
    if (error) return <p style={{ color: 'red' }}>Error {error}</p>;

    return (
        <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            {events.length === 0 ? (
                <p>No recent events.</p>
            ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {events.map(event => (
                        <li key={event.id} style={{ marginBottom: '12px' }}>
                            <div><strong>{event.name}</strong> — Ends at {formatDate(event.endTime)}</div>
                            <div>{event.description}</div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default PreviewEvents;
