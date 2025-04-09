import React, { useState } from 'react';
import NavBar from '../../../components/NavBar';
import { Input, Button, Space, Card, Alert, Result, InputNumber, Radio } from 'antd';
import { CheckCircleTwoTone } from '@ant-design/icons';

const SuccessMessage = ({ utorId, amount }) => (
  <Result
    icon={<CheckCircleTwoTone twoToneColor="#52c41a" style={{ fontSize: '48px' }} />}
    title="Adjustment Successful!"
    subTitle={<div>You adjusted {utorId}'s transaction by {amount} points.</div>}
  />
);

const Adjustment = () => {
  const [utorId, setUtorId] = useState('');
  const [amount, setAmount] = useState(null);  // Always positive
  const [operation, setOperation] = useState('add'); // 'add' or 'remove'
  const [relatedId, setRelatedId] = useState('');
  const [remark, setRemark] = useState('');
  const [promotions, setPromotions] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAdjustment = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      const finalAmount = operation === 'remove' ? -Math.abs(amount) : Math.abs(amount);

      const response = await fetch(`http://localhost:3100/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          utorid: utorId,
          type: "adjustment",
          amount: finalAmount,
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
        setOperation('add');
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
              id="utorId"
              value={utorId}
              onChange={(e) => setUtorId(e.target.value)}
              placeholder="Enter UTORid"
            />

            <label htmlFor="amount"><b>Enter Adjustment Amount:</b></label>
            <Radio.Group
              onChange={(e) => setOperation(e.target.value)}
              value={operation}
              style={{ marginBottom: '8px' }}
            >
              <Radio.Button value="add">Add</Radio.Button>
              <Radio.Button value="remove">Remove</Radio.Button>
            </Radio.Group>
            <InputNumber
              id="amount"
              value={amount}
              onChange={setAmount}
              placeholder="Enter Amount"
              style={{ width: '100%' }}
              min={0}
            />

            <label htmlFor="relatedId"><b>Related Transaction ID:</b></label>
            <Input
              id="relatedId"
              value={relatedId}
              onChange={(e) => setRelatedId(e.target.value)}
              placeholder="Enter Related Transaction ID"
            />

            <label htmlFor="promotions"><b>Enter Promotion IDs (Optional, separated by spaces):</b></label>
            <Input
              id="promotions"
              value={promotions}
              onChange={(e) => setPromotions(e.target.value)}
              placeholder="Enter Promotion IDs"
            />

            <label htmlFor="remark"><b>Remark (Optional):</b></label>
            <Input
              id="remark"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
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

            {result?.success && (
              <SuccessMessage utorId={result.utorId} amount={result.amount} />
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
