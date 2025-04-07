import React, { useState } from 'react';
import NavBar from '../../../components/NavBar';
import QRCode from 'react-qr-code';

const SuccessMessage = ({ redemptionId, amount, utorId, remark }) => (
    <div className="transfer-success">
        <h2>Redemption Request Sent!</h2>
        <p>You've requested to redeem {amount} point(s).</p>
        <p>Redemption ID: {redemptionId}</p>
        <p>Provide the redemption ID or this QR code to a cashier to complete the redemption.</p>
        <QRCode
            value={`Redemption ID - ${redemptionId}\nAmount - ${amount}\nRequested by - ${utorId}`}
        />
    </div>
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
                setResult({ success: true, redemptionId: data.id, amount, utorId: data.utorid, remark });
                setAmount('');
                setRemark('');
                console.log("Redemption successful: ", data);
            } else {
                const data = await response.json();
                setResult({ success: false, error: `Error ${response.status}: ${data.error}` });
                console.error("Failed to complete redemption");
            }
        } catch (error) {
            setResult({ success: false, error: "Error during redemption: " + error.message });
            console.error("Error during redemption:", error);
        }
    };

    return (
        <div>
            <NavBar>
                <div className="redemption">
                    <h1>Redeem</h1>
                    <label htmlFor="amount">Enter Amount:</label>
                    <div>
                        <input
                            className="input-field"
                            type="number"
                            id="amount"
                            value={amount}
                            onChange={handleAmountChange}
                            placeholder="Enter Amount"
                        />
                    </div>
                    <label htmlFor="remark">Remark (Optional):</label>
                    <div>
                        <input
                            className="input-field"
                            type="text"
                            id="remark"
                            value={remark}
                            onChange={handleRemarkChange}
                            placeholder="Enter Remark"
                        />
                    </div>
                    <button onClick={handleRedemption}>Submit Redemption Request</button>
                    {result && result.success && (
                        <SuccessMessage
                            redemptionId = {result.redemptionId}
                            amount = {result.amount}
                            utorId = {result.utorId}
                            remark = {result.remark}
                        />
                    )}
                    {result && !result.success && (
                        <div className="transfer-failed">
                            <h2>Redemption Failed.</h2>
                            <p>{result.error}</p>
                        </div>
                    )}
                </div>
            </NavBar>
        </div>
    );
};

export default Redeem;