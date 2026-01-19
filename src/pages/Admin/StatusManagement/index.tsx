import React, { useEffect, useState } from "react";
import {
  fetchStatuses,
  createStatus,
  updateStatus,
  deleteStatus,
} from "./api";
import { Button, Input, Checkbox, Table, Space, Form, Card } from "antd";

interface Status {
  _id: string;
  name: string;
  is_active: boolean;
}

const StatusManager: React.FC = () => {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadStatuses = async () => {
    const data = await fetchStatuses();
    setStatuses(data);
  };

  useEffect(() => {
    loadStatuses();
  }, []);

  const handleSubmit = async () => {
    if (editingId) {
      await updateStatus(editingId, { name, is_active: isActive });
    } else {
      await createStatus({ name, is_active: isActive });
    }
    setName("");
    setIsActive(true);
    setEditingId(null);
    loadStatuses();
  };

  const handleDelete = async (id: string) => {
    await deleteStatus(id);
    loadStatuses();
  };

  const handleEdit = (status: Status) => {
    setName(status.name);
    setIsActive(status.is_active);
    setEditingId(status._id);
  };

  return (
    <div style={{ padding: 24 }}>
      {/* Form Section */}
      <Card title={editingId ? "Edit Status" : "Add Status"} style={{ marginBottom: 24 }}>
        <Form layout="inline" onFinish={handleSubmit}>
          <Form.Item>
            <Input
              placeholder="Enter status name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{ width: 250 }}
            />
          </Form.Item>
          <Form.Item>
            <Checkbox
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            >
              Active
            </Checkbox>
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              style={{ backgroundColor: "black", borderColor: "black" }}
            >
              {editingId ? "Update" : "Add"}
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* Table Section */}
      <Card title="Statuses">
        <Table
          dataSource={statuses}
          rowKey="_id"
          columns={[
            {
              title: "Name",
              dataIndex: "name",
              key: "name",
            },
            {
              title: "Active",
              dataIndex: "is_active",
              key: "is_active",
              render: (active: boolean) => (active ? "✅ Yes" : "❌ No"),
            },
            {
              title: "Actions",
              key: "actions",
              render: (_, record) => (
                <Space>
                  <Button onClick={() => handleEdit(record)}>Edit</Button>
                  <Button danger onClick={() => handleDelete(record._id)}>
                    Delete
                  </Button>
                </Space>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default StatusManager;
