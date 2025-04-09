import React, { useState } from 'react';
import NavBar from '../../../components/NavBar';
import { Input, Button, Space, Card, Alert, Result, InputNumber } from 'antd';
import { CheckCircleTwoTone } from '@ant-design/icons';

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3100";

const SuccessMessage = ({ utorId, amount, earned }) => (
  <Result
    icon={<CheckCircleTwoTone twoToneColor="#52c41a" style={{ fontSize: '48px' }} />}
    title="Purchase Successful!"
    subTitle={
      <>
        <div>You completed {utorId}'s purchase worth ${amount}.</div>
        <div style={{ fontSize: '16px', fontWeight: '600', marginTop: '5px', color: '#508050' }}>
        {utorId} earned {earned} points.</div>
      </>
    }
  />
);

const Purchase = () => {
  const [utorId, setUtorId] = useState('');
  const [amount, setAmount] = useState('');
  const [remark, setRemark] = useState('');
  const [promotions, setPromotions] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUtorIdChange = (event) => {
    setUtorId(event.target.value);
  };

  const handleAmountChange = (value) => {
    setAmount(value);
  };

  const handleRemarkChange = (event) => {
    setRemark(event.target.value);
  };

  const handlePromotionsChange = (event) => {
    setPromotions(event.target.value);
  };

  const handlePurchase = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`${API_URL}/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          utorid: utorId,
          type: "purchase",
          spent: amount,
          remark: remark,
          promotions: promotions.split(' ').map(id => id.trim()).filter(id => id !== '')
        })
      });

      if (response.ok) {
        const data = await response.json();
        setResult({ success: true, utorId: data.utorid, amount: data.spent, earned: data.earned });
        setUtorId('');
        setAmount('');
        setRemark('');
        setPromotions('');
      } else {
        const data = await response.json();
        setResult({ success: false, error: `Error ${response.status}: ${data.error}` });
      }
    } catch (error) {
      setResult({ success: false, error: "Error during purchase: " + error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <NavBar>
        <Card title="Create Purchase" bordered style={{ maxWidth: 500, margin: 'auto' }}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>

            <label htmlFor="utorId"><b>Enter Buyer's UTORid:</b></label>
            <Input
              type="text"
              id="utorId"
              value={utorId}
              onChange={handleUtorIdChange}
              placeholder="Enter UTORid"
            />

            <label htmlFor="amount"><b>Enter Amount Spent:</b></label>
            <InputNumber
              id="amount"
              value={amount}
              onChange={handleAmountChange}
              placeholder="Enter Amount"
              step="0.01"
              formatter={value => `$${value}`}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
              style={{ width: '100%' }}
            />

            <label htmlFor="promotions"><b>Enter Promotion IDs (Optional, separated by spaces):</b></label>
            <Input
              type="text"
              id="promotions"
              value={promotions}
              onChange={handlePromotionsChange}
              placeholder="Enter Promotion IDs"
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
              onClick={handlePurchase}
              loading={loading}
              disabled={!utorId || !amount}
            >
              Complete Purchase
            </Button>

            {result && result.success && (
              <SuccessMessage 
                utorId={result.utorId}
                amount={result.amount}
                earned={result.earned}
              />
            )}

            {result && !result.success && (
              <Alert
                message="Purchase Failed"
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

export default Purchase;
