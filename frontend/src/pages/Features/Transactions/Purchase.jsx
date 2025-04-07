import React, { useState } from 'react';
import NavBar from '../../../components/NavBar';

const SuccessMessage = ({ utorId, amount, earned }) => (
    <div className="transfer-success">
        <h2>Purchase Successful!</h2>
        <p>You completed {utorId}'s purchase worth ${amount}.</p>
        <p>{utorId} earned {earned} points.</p>
    </div>
);

const Purchase = () => {
    const [utorId, setUtorId] = useState('');
    const [amount, setAmount] = useState('');
    const [remark, setRemark] = useState('');
    const [promotions, setPromotions] = useState([]);
    const [result, setResult] = useState(null);
    
    const handleUtorIdChange = (event) => {
        setUtorId(event.target.value);
    };

    const handleAmountChange = (event) => {
        setAmount(parseFloat(event.target.value) || '');
    };

    const handleRemarkChange = (event) => {
        setRemark(event.target.value);
    };

    const handlePromotionsChange = (event) => {
        const input = event.target.value;
        const ids = input.split(' ').map(id => id.trim()).filter(id => id !== '');
        setPromotions(ids);
    };

    const handlePurchase = async () => {
        try {
            const token = localStorage.getItem('authToken');
            
            const response = await fetch(`http://localhost:3100/transactions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    utorid: utorId,
                    type: "purchase",
                    spent: amount,
                    remark: remark
                })
            });

            if (response.ok) {
                const data = await response.json();
                setResult({ success: true, utorId: data.utorid, amount: data.spent, earned: data.earned });
                setUtorId('');
                setAmount('');
                setRemark('');
                setPromotions([]);
                console.log("Purchase processed successfully: ", data);
            } else {
                const data = await response.json();
                setResult({ success: false, error: `Error ${response.status}: ${data.error}` });
                console.error("Failed to process purchase");
            }
        } catch (error) {
            setResult({ success: false, error: "Error during processing: " + error.message });
            console.error("Error during processing:", error);
        }
    }

    return (
        <div>
            <NavBar>
                <div className="purchase">
                    <h1>Create Purchase</h1>
                    <label htmlFor="utorId">Enter Buyer's UTORid:</label>
                    <div>
                        <input
                            className="input-field"
                            type="text"
                            id="utorId"
                            value={utorId}
                            onChange={handleUtorIdChange}
                            placeholder="Enter UTORid"
                        />
                    </div>
                    <label htmlFor="amount">Enter Amount Spent ($):</label>
                    <div>
                        <input
                            className="input-field"
                            type="number"
                            id="amount"
                            value={amount}
                            onChange={handleAmountChange}
                            placeholder="Enter Amount"
                            step="0.01"
                        />
                    </div>
                    <label htmlFor="promotions">Enter Promotion IDs (Optional, separated by spaces):</label>
                    <div>
                        <input
                            className="input-field"
                            type="text"
                            id="promotions"
                            value={promotions}
                            onChange={handlePromotionsChange}
                            placeholder="Enter Promotion IDs"
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
                    <button onClick={handlePurchase}>Complete Purchase</button>
                    {result && result.success && (
                        <SuccessMessage 
                            utorId={result.utorId}
                            amount={result.amount}
                            earned={result.earned}
                        />
                    )}
                    {result && !result.success && (
                        <div className="transfer-failed">
                            <h2>Purchase Failed.</h2>
                            <p>{result.error}</p>
                        </div>
                    )}
                </div>
            </NavBar>
        </div>
    );
};

export default Purchase;