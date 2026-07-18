import React, { useEffect, useState } from "react";
import {
  fetchStatuses,
  createStatus,
  updateStatus,
  deleteStatus,
} from "./api";
import { fetchTypeEmails } from "../DataManagement/api";
import {
  Button,
  Input,
  Checkbox,
  Table,
  Space,
  Form,
  Card,
  Select,
} from "antd";

interface Status {
  _id: string;
  name: string;
  is_active: boolean;
  typeEmail: {
    _id: string;
    name: string;
  };
}

interface TypeEmail {
  _id: string;
  name: string;
}

const StatusManager: React.FC = () => {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [typeEmails, setTypeEmails] = useState<TypeEmail[]>([]);

  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [typeEmail, setTypeEmail] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);

  // Load Statuses
  const loadStatuses = async () => {
    try {
      const data = await fetchStatuses();
      setStatuses(data);
    } catch (error) {
      console.error(error);
    }
  };

  // Load Type Emails
const loadTypeEmails = async () => {
  try {
    const response = await fetchTypeEmails();

    console.log("Type Emails API:", response);

    setTypeEmails(
      Array.isArray(response)
        ? response
        : response.data || response.typeEmails || []
    );

  } catch (error) {
    console.error(error);
  }
};

  // Initial Load
  useEffect(() => {
    loadStatuses();
    loadTypeEmails();
  }, []);

  // Submit
  const handleSubmit = async () => {
    if (!name.trim()) {
      alert("Please enter status name");
      return;
    }

    if (!typeEmail) {
      alert("Please select Type Email");
      return;
    }

    const payload = {
      name,
      is_active: isActive,
      typeEmail,
    };

    try {
      if (editingId) {
        await updateStatus(editingId, payload);
      } else {
        await createStatus(payload);
      }

      // Reset form
      setName("");
      setIsActive(true);
      setTypeEmail("");
      setEditingId(null);

      loadStatuses();
    } catch (error) {
      console.error(error);
    }
  };

  // Edit
  const handleEdit = (status: Status) => {
    setName(status.name);
    setIsActive(status.is_active);
    setTypeEmail(status.typeEmail?._id || "");
    setEditingId(status._id);
  };

  // Delete
  const handleDelete = async (id: string) => {
    try {
      await deleteStatus(id);
      loadStatuses();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      {/* Form */}
      <Card
        title={editingId ? "Edit Status" : "Add Status"}
        style={{ marginBottom: 24 }}
      >
        <Form layout="inline" onFinish={handleSubmit}>
          <Form.Item>
            <Input
              placeholder="Enter status name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: 220 }}
            />
          </Form.Item>

          <Form.Item>
            <Select
              placeholder="Select Type Email"
              style={{ width: 220 }}
              value={typeEmail}
              onChange={(value) => setTypeEmail(value)}
            >
              {typeEmails.map((item) => (
                <Select.Option key={item._id} value={item._id}>
                  {item.name}
                </Select.Option>
              ))}
            </Select>
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
              htmlType="submit"
              type="primary"
              style={{
                backgroundColor: "black",
                borderColor: "black",
              }}
            >
              {editingId ? "Update" : "Add"}
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* Table */}
      <Card title="Statuses">
        <Table
          rowKey="_id"
          dataSource={statuses}
          columns={[
            {
              title: "Status Name",
              dataIndex: "name",
              key: "name",
            },
            {
              title: "Type Email",
              dataIndex: "typeEmail",
              key: "typeEmail",
              render: (typeEmail: any) => typeEmail?.name || "-",
            },
            {
              title: "Active",
              dataIndex: "is_active",
              key: "is_active",
              render: (active: boolean) =>
                active ? "✅ Yes" : "❌ No",
            },
            {
              title: "Actions",
              key: "actions",
              render: (_: any, record: Status) => (
                <Space>
                  <Button onClick={() => handleEdit(record)}>
                    Edit
                  </Button>

                  <Button
                    danger
                    onClick={() => handleDelete(record._id)}
                  >
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