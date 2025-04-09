import React, { useState } from 'react';
import NavBar from '../../../components/NavBar';
import { Input, Button, Space, Alert, Card, Result } from 'antd';
import { CheckCircleTwoTone } from '@ant-design/icons';

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3100";

const SuccessMessage = ({ amount, userId }) => (
    <Result
        icon={<CheckCircleTwoTone twoToneColor="#52c41a" style={{ fontSize: '48px' }} />}
        title="Redemption Successful!"
        subTitle={`You completed ${userId}'s redemption of ${amount} points.`}
    />
);

const Process = () => {
    const [redemptionId, setRedemptionId] = useState('');
    const [result, setResult] = useState(null);

    const handleRedemptionIdChange = (event) => {
        setRedemptionId(parseInt(event.target.value, 10) || '');
    }

    const handleProcessing = async () => {
        try {
            const token = localStorage.getItem('authToken');

            const response = await fetch(`${API_URL}/transactions/${redemptionId}/processed`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ processed: true })
            });

            if (response.ok) {
                const data = await response.json();
                setResult({ success: true, amount: data.redeemed, userId: data.utorid });
                setRedemptionId('');
            } else {
                const data = await response.json();
                setResult({ success: false, error: `Error ${response.status}: ${data.error}` });
            }
        } catch (error) {
            setResult({ success: false, error: "Error during processing: " + error.message });
        }
    }

    return (
        <div style={{ padding: '24px' }}>
            <NavBar>
                <Card title="Process Redemption" bordered style={{ maxWidth: 500, margin: 'auto' }}>
                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                        <label htmlFor="redemptionId"><b>Enter Redemption ID:</b></label>
                        <Input
                            type="number"
                            id="redemptionId"
                            value={redemptionId}
                            onChange={handleRedemptionIdChange}
                            placeholder="Enter Redemption ID"
                        />
                        <Button type="primary" onClick={handleProcessing} disabled={!redemptionId}>
                            Process Redemption
                        </Button>

                        {result && result.success && (
                            <SuccessMessage amount={result.amount} userId={result.userId} />
                        )}

                        {result && !result.success && (
                            <Alert
                                message="Processing Failed"
                                description={result.error}
                                type="error"
                                showIcon
                            />
                        )}
                    </Space>
                </Card>
            </NavBar>
        </div>
    );
};

export default Process;
