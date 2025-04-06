import React, { useState } from 'react';
import NavBar from '../../../components/NavBar';

const SuccessMessage = ({ amount, userId }) => (
    <div className="transfer-success">
        <h2>Redemption Successful!</h2>
        <p>You completed {userId}'s redemption of {amount} points.</p>
    </div>
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
            
            const response = await fetch(`http://localhost:3100/transactions/${redemptionId}/processed`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    processed: true
                })
            });

            if (response.ok) {
                const data = await response.json();
                setResult({ success: true, amount: data.redeemed, userId: data.utorid });
                setRedemptionId('');
                console.log("Redemption processed successfully: ", data);
            } else {
                const data = await response.json();
                setResult({ success: false, error: `Error ${response.status}: ${data.error}` });
                console.error("Failed to process redemption");
            }
        } catch (error) {
            setResult({ success: false, error: "Error during processing: " + error.message });
            console.error("Error during processing:", error);
        }
    }

    return (
        <div>
            <NavBar>
                <div class="process">
                    <h1>Process Redemption</h1>
                    <label htmlFor="amount">Enter Redemption ID:</label>
                    <div>
                        <input
                            className="input-field"
                            type="number"
                            id="redemptionId"
                            value={redemptionId}
                            onChange={handleRedemptionIdChange}
                            placeholder="Enter Amount"
                        />
                    </div>
                    <button onClick={handleProcessing}>Process Redemption</button>
                    {result && result.success && (
                        <SuccessMessage 
                            amount={result.amount} 
                            userId={result.userId} 
                        />
                    )}
                    {result && !result.success && (
                        <div className="transfer-failed">
                            <h2>Processing Failed.</h2>
                            <p>{result.error}</p>
                        </div>
                    )}
                </div>
            </NavBar>
        </div>
    );
};

export default Process;