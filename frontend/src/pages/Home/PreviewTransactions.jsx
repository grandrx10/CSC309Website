import React, { useEffect, useState } from 'react';

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3100";

const RecentTransactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRecentTransactions = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('authToken');
                const response = await fetch(`${API_URL}/users/me/transactions?limit=3`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error(`${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                setTransactions(data.results || []);
            } catch (err) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchRecentTransactions();
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

    if (loading) return <p>Loading recent transactions...</p>;
    if (error) return <p style={{ color: 'red' }}>Error {error}</p>;

    return (
        <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            {transactions.length === 0 ? (
                <p>No recent transactions.</p>
            ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {transactions.map(tx => (
                        <li key={tx.id} style={{ marginBottom: '12px' }}>
                            <div><strong style={{ color: getTransactionColor(tx.type) }}>{tx.type.toUpperCase()}</strong> — Ends at {formatDate(tx.date)}</div>
                            <div>Amount: {tx.amount} points</div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default RecentTransactions;
