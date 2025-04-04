import React, { useState } from 'react';
import NavBar from '../../../components/NavBar';

const SuccessMessage = ({ amount, userId }) => (
    <div className="transfer-success">
        <h2>Transfer Successful!</h2>
        <p>You transferred {amount} point(s) to user {userId}.</p>
    </div>
);

const Transfer = () => {
    const [userId, setUserId] = useState('');
    const [amount, setAmount] = useState('');
    const [remark, setRemark] = useState('');
    const [result, setResult] = useState(null);

    const handleUserIdChange = (event) => {
        setUserId(parseInt(event.target.value, 10) || '');
    };

    const handleAmountChange = (event) => {
        setAmount(parseInt(event.target.value, 10) || '');
    };

    const handleRemarkChange = (event) => {
        setRemark(event.target.value);
    };

    const handleTransfer = async () => {
        try {
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
                console.log("Transfer successful: ", data);
            } else {
                const data = await response.json();
                setResult({ success: false, error: `Error ${response.status}: ${data.error}` });
                console.error("Failed to complete transfer");
            }
        } catch (error) {
            setResult({ success: false, error: "Error during transfer: " + error.message });
            console.error("Error during transfer:", error);
        }
    };

    return (
        <div>
            <NavBar>
                <div className="transfer">
                    <h1>Transfer</h1>
                    <label htmlFor="userId">Enter User ID:</label>
                    <div>
                        <input
                            className="input-field"
                            type="text"
                            id="userId"
                            value={userId}
                            onChange={handleUserIdChange}
                            placeholder="Enter User ID"
                        />
                    </div>
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
                    <button onClick={handleTransfer}>Submit Transfer</button>
                    {result && result.success && (
                        <SuccessMessage 
                            amount={result.amount} 
                            userId={result.userId} 
                            points={result.points} 
                        />
                    )}
                    {result && !result.success && (
                        <div className="transfer-failed">
                            <h2>Transfer Failed.</h2>
                            <p>{result.error}</p>
                        </div>
                    )}
                </div>
            </NavBar>
        </div>
    );
};

export default Transfer;