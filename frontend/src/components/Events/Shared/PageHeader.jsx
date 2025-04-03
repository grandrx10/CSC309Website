import { Button } from 'antd';
import { PageHeader } from '@ant-design/pro-components';
import { ArrowLeftOutlined } from '@ant-design/icons';

export default ({ title, onBack, extra }) => (
  <PageHeader
    title={title}
    onBack={onBack}
    extra={extra}
    backIcon={<ArrowLeftOutlined />}
    style={{ padding: 0, marginBottom: 24 }}
  />
);  