import React, { useState } from 'react';
import NavBar from '../../../components/NavBar';
import { Input, Button, Space, Card, Alert, Result, InputNumber } from 'antd';
import { CheckCircleTwoTone } from '@ant-design/icons';

const SuccessMessage = ({ utorId, amount }) => (
  <Result
    icon={<CheckCircleTwoTone twoToneColor="#52c41a" style={{ fontSize: '48px' }} />}
    title="Adjustment Successful!"
    subTitle={
      <>
        <div>You adjusted {utorId}'s transaction by {amount} points.</div>
      </>
    }
  />
);

const Adjustment = () => {
  const [utorId, setUtorId] = useState('');
  const [amount, setAmount] = useState(null);  // Initialize amount as null
  const [relatedId, setRelatedId] = useState('');
  const [remark, setRemark] = useState('');
  const [promotions, setPromotions] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUtorIdChange = (event) => {
    setUtorId(event.target.value);
  };

  const handleAmountChange = (value) => {
    setAmount(value);  // Amount can now be positive or negative
  };

  const handleRelatedIdChange = (event) => {
    setRelatedId(event.target.value);
  };

  const handleRemarkChange = (event) => {
    setRemark(event.target.value);
  };

  const handlePromotionsChange = (event) => {
    setPromotions(event.target.value);
  };

  const handleAdjustment = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`http://localhost:3100/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          utorid: utorId,
          type: "adjustment",
          amount: amount,
          relatedId: relatedId,
          remark: remark,
          promotionIds: promotions.split(' ').map(id => id.trim()).filter(id => id !== '')
        })
      });

      if (response.ok) {
        const data = await response.json();
        setResult({ success: true, utorId: data.utorid, amount: data.amount });
        setUtorId('');
        setAmount(null);
        setRelatedId('');
        setRemark('');
        setPromotions('');
      } else {
        const data = await response.json();
        setResult({ success: false, error: `Error ${response.status}: ${data.error}` });
      }
    } catch (error) {
      setResult({ success: false, error: "Error during adjustment: " + error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <NavBar>
        <Card title="Create Adjustment" bordered style={{ maxWidth: 500, margin: 'auto' }}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>

            <label htmlFor="utorId"><b>Enter User's UTORid:</b></label>
            <Input
              type="text"
              id="utorId"
              value={utorId}
              onChange={handleUtorIdChange}
              placeholder="Enter UTORid"
            />

            <label htmlFor="amount"><b>Enter Adjustment Amount (Points to add/remove):</b></label>
            <InputNumber
              id="amount"
              value={amount}
              onChange={handleAmountChange}
              placeholder="Enter Amount"
              style={{ width: '100%' }}
              min={-100000}  // Optional: set a min value for safety, adjust as necessary
            />

            <label htmlFor="relatedId"><b>Related Transaction ID:</b></label>
            <Input
              type="text"
              id="relatedId"
              value={relatedId}
              onChange={handleRelatedIdChange}
              placeholder="Enter Related Transaction ID"
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
              onClick={handleAdjustment}
              loading={loading}
              disabled={!utorId || amount === null || !relatedId}
            >
              Complete Adjustment
            </Button>

            {result && result.success && (
              <SuccessMessage 
                utorId={result.utorId}
                amount={result.amount}
              />
            )}

            {result && !result.success && (
              <Alert
                message="Adjustment Failed"
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

export default Adjustment;
