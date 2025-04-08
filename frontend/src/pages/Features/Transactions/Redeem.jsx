import React, { useState } from 'react';
import NavBar from '../../../components/NavBar';
import QRCode from 'react-qr-code';
import { Input, Button, Typography, Space, Card, Alert, Result } from 'antd';
import { CheckCircleTwoTone } from '@ant-design/icons';

const { Paragraph } = Typography;

const SuccessMessage = ({ redemptionId, amount, utorId, remark }) => (
    <Result
        icon={<CheckCircleTwoTone twoToneColor="#52c41a" style={{ fontSize: '48px' }} />}
        title="Redemption Request Sent!"
        subTitle={`You’ve requested to redeem ${amount} point(s).`}
        extra={
            <div style={{ marginTop: 16 }}>
                <Paragraph><b>Redemption ID:</b> {redemptionId}</Paragraph>
                {remark && <Paragraph><b>Remark:</b> {remark}</Paragraph>}
                <Paragraph>
                    Provide the redemption ID or this QR code to a cashier to complete the redemption:
                </Paragraph>
                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
                    <QRCode
                        value={`Redemption ID - ${redemptionId}\nAmount - ${amount}\nRequested by - ${utorId}`}
                    />
                </div>
            </div>
        }
    />
);

const Redeem = () => {
    const [amount, setAmount] = useState('');
    const [remark, setRemark] = useState('');
    const [result, setResult] = useState(null);

    const handleAmountChange = (event) => {
        setAmount(parseInt(event.target.value, 10) || '');
    };

    const handleRemarkChange = (event) => {
        setRemark(event.target.value);
    };

    const handleRedemption = async () => {
        try {
            const token = localStorage.getItem('authToken');

            const response = await fetch(`http://localhost:3100/users/me/transactions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    type: "redemption",
                    amount,
                    remark
                })
            });

            if (response.ok) {
                const data = await response.json();
                setResult({
                    success: true,
                    redemptionId: data.id,
                    amount,
                    utorId: data.utorid,
                    remark
                });
                setAmount('');
                setRemark('');
            } else {
                const data = await response.json();
                setResult({ success: false, error: `Error ${response.status}: ${data.error}` });
            }
        } catch (error) {
            setResult({ success: false, error: "Error during redemption: " + error.message });
        }
    };

    return (
        <div style={{ padding: '24px' }}>
            <NavBar>
                <Card title="Redeem Points" bordered style={{ maxWidth: 500, margin: 'auto' }}>
                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                        <label htmlFor="amount"><b>Enter Amount:</b></label>
                        <Input
                            type="number"
                            id="amount"
                            value={amount}
                            onChange={handleAmountChange}
                            placeholder="Enter Amount"
                        />

                        <label htmlFor="remark"><b>Remark (Optional):</b></label>
                        <Input
                            type="text"
                            id="remark"
                            value={remark}
                            onChange={handleRemarkChange}
                            placeholder="Enter Remark"
                        />

                        <Button
                            type="primary"
                            onClick={handleRedemption}
                            disabled={!amount}
                        >
                            Submit Redemption Request
                        </Button>

                        {result && result.success && (
                            <SuccessMessage
                                redemptionId={result.redemptionId}
                                amount={result.amount}
                                utorId={result.utorId}
                                remark={result.remark}
                            />
                        )}

                        {result && !result.success && (
                            <Alert
                                message="Redemption Failed"
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

export default Redeem;
