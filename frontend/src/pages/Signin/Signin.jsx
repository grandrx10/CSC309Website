import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  LockOutlined, 
  UserOutlined,
  LoginOutlined 
} from '@ant-design/icons';
import { 
  Form, 
  Input, 
  Button, 
  Card, 
  Typography, 
  Divider,
  Alert,
  Space 
} from 'antd';
import "./Signin.module.css"; // You can keep your custom styles if needed

const { Title, Text } = Typography;
console.log(process.env.REACT_APP_API_URL)
const API_URL =  process.env.REACT_APP_API_URL || "http://localhost:3100";
function SignIn() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (values) => {
    const { utorid, password } = values;
    setLoading(true);
    
    try {
      const response = await fetch(API_URL + "/auth/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ utorid, password }),
      });

      if (!response.ok) {
        const errorResponse = await response.json();
        throw new Error(`Error ${response.status}: ${errorResponse.error}`);
      }

      const data = await response.json();
      localStorage.setItem('authToken', data.token);
      navigate('/home');
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '20px'
    }}>
      <Card 
        style={{ 
          width: '100%',
          maxWidth: '420px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}
        bordered={false}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <LoginOutlined style={{ fontSize: '32px', color: '#1890ff' }} />
            <Title level={3} style={{ marginTop: '8px' }}>Sign In</Title>
            <Text type="secondary">Enter your UTORid and password</Text>
          </div>

          <Divider />

          {error && (
            <Alert 
              message={error} 
              type="error" 
              showIcon 
              closable 
              onClose={() => setError("")}
            />
          )}

          <Form
            name="signin"
            initialValues={{ remember: true }}
            onFinish={handleLogin}
            layout="vertical"
          >
            <Form.Item
              name="utorid"
              rules={[{ required: true, message: 'Please input your UTORid!' }]}
            >
              <Input 
                prefix={<UserOutlined />} 
                placeholder="UTORid" 
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Please input your Password!' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Password"
                size="large"
              />
            </Form.Item>

            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                block 
                size="large"
                loading={loading}
                icon={<LoginOutlined />}
              >
                Sign In
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: 'center' }}>
            <Text type="secondary">
              Don't have an account? <a href="/register">Register</a>
            </Text>
          </div>
        </Space>
      </Card>
    </div>
  );
}

export default SignIn;