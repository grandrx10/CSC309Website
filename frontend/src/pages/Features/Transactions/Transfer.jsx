import React, { useState } from 'react';
import NavBar from '../../../components/NavBar';
import { Input, Button, Space, Alert, Card, Result } from 'antd';
import { CheckCircleTwoTone } from '@ant-design/icons';

const SuccessMessage = ({ amount, userId }) => (
  <Result
    icon={<CheckCircleTwoTone twoToneColor="#52c41a" style={{ fontSize: '48px' }} />}
    title="Transfer Successful!"
    subTitle={`You transferred ${amount} point(s) to user ${userId}.`}
  />
);

const Transfer = () => {
  const [userId, setUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [remark, setRemark] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUserIdChange = (event) => {
    setUserId(event.target.value);
  };

  const handleAmountChange = (event) => {
    setAmount(parseInt(event.target.value, 10) || '');
  };

  const handleRemarkChange = (event) => {
    setRemark(event.target.value);
  };

  const handleTransfer = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      const response = await fetch(`http://localhost:3100/users/${userId}/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          type: "transfer",
          amount,
          remark
        })
      });

      if (response.ok) {
        const data = await response.json();
        setResult({ success: true, amount, userId, points: data.points });
        setUserId('');
        setAmount('');
        setRemark('');
      } else {
        const data = await response.json();
        setResult({ success: false, error: `Error ${response.status}: ${data.error}` });
      }
    } catch (error) {
      setResult({ success: false, error: "Error during transfer: " + error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <NavBar>
        <Card title="Transfer Points" bordered style={{ maxWidth: 500, margin: 'auto' }}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <label htmlFor="userId"><b>Enter User ID:</b></label>
            <Input
              type="text"
              id="userId"
              value={userId}
              onChange={handleUserIdChange}
              placeholder="Enter User ID"
            />

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
              onClick={handleTransfer}
              loading={loading}
              disabled={!userId || !amount}
            >
              Submit Transfer
            </Button>

            {result && result.success && (
              <SuccessMessage
                amount={result.amount}
                userId={result.userId}
              />
            )}

            {result && !result.success && (
              <Alert
                message="Transfer Failed"
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

export default Transfer;
