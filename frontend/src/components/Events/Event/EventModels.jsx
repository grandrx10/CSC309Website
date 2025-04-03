import { Modal, Form, Input } from 'antd';

const EventModals = ({ type, onClose, onAddGuest }) => {
  const [form] = Form.useForm();

  const handleAddGuest = () => {
    form.validateFields()
      .then(values => {
        onAddGuest(values.utorid);
        onClose();
        form.resetFields();
      });
  };

  return (
    <>
      {/* Add Guest Modal */}
      <Modal
        title="Add Guest"
        visible={type === 'addGuest'}
        onOk={handleAddGuest}
        onCancel={onClose}
      >
        <Form form={form}>
          <Form.Item name="utorid" label="UTORid" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      {/* Other modals can be added here */}
    </>
  );
};

export default EventModals;