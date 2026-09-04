import React, { useEffect, useState } from "react";

import {
  fetchStatuses,
  createStatus,
  updateStatus,
  deleteStatus,
} from "./api";

import {
  Button,
  Input,
  Switch,
  Table,
  Space,
  Form,
  Card,
  Select,
  Tag,
  Typography,
  Popconfirm,
  message,
  Empty,
  Divider,
} from "antd";

import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SaveOutlined,
  CloseOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

// =====================================================
// STATUS TYPE
// =====================================================

type StatusType = "order" | "plan" | "domain";

// =====================================================
// STATUS INTERFACE
// =====================================================

interface Status {
  _id: string;
  name: string;
  code: string;
  type: StatusType;
  is_custom: boolean;
  is_active: boolean;
}

// =====================================================
// COMPONENT
// =====================================================

const StatusManager: React.FC = () => {
  const [statuses, setStatuses] = useState<Status[]>([]);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [type, setType] = useState<StatusType>("order");
  const [isCustom, setIsCustom] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // =====================================================
  // LOAD STATUSES
  // =====================================================

  const loadStatuses = async () => {
    try {
      setLoading(true);

      const data = await fetchStatuses();

      setStatuses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load statuses:", error);

      message.error("Failed to load statuses");
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    loadStatuses();
  }, []);

  // =====================================================
  // RESET FORM
  // =====================================================

  const resetForm = () => {
    setName("");
    setCode("");
    setType("order");
    setIsCustom(false);
    setIsActive(true);
    setEditingId(null);
  };

  // =====================================================
  // SUBMIT
  // =====================================================

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    const trimmedCode = code.trim().toUpperCase();

    if (!trimmedName) {
      message.warning("Please enter status name");
      return;
    }

    if (!trimmedCode) {
      message.warning("Please enter status code");
      return;
    }

    if (!type) {
      message.warning("Please select status type");
      return;
    }

    const payload = {
      name: trimmedName,
      code: trimmedCode,
      type,
      is_custom: isCustom,
      is_active: isActive,
    };

    try {
      setSaving(true);

      if (editingId) {
        await updateStatus(editingId, payload);

        message.success("Status updated successfully");
      } else {
        await createStatus(payload);

        message.success("Status created successfully");
      }

      resetForm();

      await loadStatuses();
    } catch (error) {
      console.error("Status save error:", error);

      message.error(
        editingId
          ? "Failed to update status"
          : "Failed to create status"
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // EDIT
  // =====================================================

  const handleEdit = (status: Status) => {
    setName(status.name);
    setCode(status.code || "");
    setType(status.type);
    setIsCustom(status.is_custom ?? false);
    setIsActive(status.is_active);

    setEditingId(status._id);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =====================================================
  // DELETE
  // =====================================================

  const handleDelete = async (id: string) => {
    try {
      await deleteStatus(id);

      message.success("Status deleted successfully");

      if (editingId === id) {
        resetForm();
      }

      await loadStatuses();
    } catch (error) {
      console.error("Delete status error:", error);

      message.error("Failed to delete status");
    }
  };

  // =====================================================
  // TYPE TAG
  // =====================================================

  const renderType = (type: StatusType) => {
    if (type === "order") {
      return <Tag color="blue">Order</Tag>;
    }

    if (type === "plan") {
      return <Tag color="purple">Plan</Tag>;
    }

    return <Tag color="cyan">Domain</Tag>;
  };

  // =====================================================
  // CUSTOM TAG
  // =====================================================

  const renderCustom = (isCustom: boolean) => {
    return isCustom ? (
      <Tag color="orange">Custom</Tag>
    ) : (
      <Tag color="default">Default</Tag>
    );
  };

  // =====================================================
  // TABLE COLUMNS
  // =====================================================

  const columns = [
    {
      title: "Status Name",
      dataIndex: "name",
      key: "name",
      render: (value: string) => (
        <Text strong style={{ fontSize: 14 }}>
          {value}
        </Text>
      ),
    },

    {
      title: "Code",
      dataIndex: "code",
      key: "code",
      render: (value: string) => (
        <Text code>{value}</Text>
      ),
    },

    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 150,
      render: (value: StatusType) =>
        renderType(value),
    },

    {
      title: "Custom",
      dataIndex: "is_custom",
      key: "is_custom",
      width: 120,
      render: (value: boolean) =>
        renderCustom(value),
    },

    {
      title: "Status",
      dataIndex: "is_active",
      key: "is_active",
      width: 140,
      render: (active: boolean) =>
        active ? (
          <Tag color="success">
            Active
          </Tag>
        ) : (
          <Tag color="default">
            Inactive
          </Tag>
        ),
    },

    {
      title: "Actions",
      key: "actions",
      width: 180,
      render: (_: unknown, record: Status) => (
        <Space size="small">

          <Button
            type="default"
            icon={<EditOutlined />}
            onClick={() =>
              handleEdit(record)
            }
          >
            Edit
          </Button>

          <Popconfirm
            title="Delete this status?"
            description="This action cannot be undone."
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{
              danger: true,
            }}
            onConfirm={() =>
              handleDelete(record._id)
            }
          >
            <Button
              danger
              icon={<DeleteOutlined />}
            >
              Delete
            </Button>
          </Popconfirm>

        </Space>
      ),
    },
  ];

  // =====================================================
  // UI
  // =====================================================

  return (
    <div
      style={{
        padding: "24px",
        background: "#f5f7fa",
        minHeight: "100vh",
      }}
    >

      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >

        <div>

          <Title
            level={3}
            style={{
              margin: 0,
              fontWeight: 600,
            }}
          >
            Status Management
          </Title>

          <Text type="secondary">
            Create and manage order, plan and
            domain statuses.
          </Text>

        </div>

        <Button
          icon={<ReloadOutlined />}
          onClick={loadStatuses}
          loading={loading}
        >
          Refresh
        </Button>

      </div>

      {/* =================================================
          FORM CARD
      ================================================= */}

      <Card
        bordered={false}
        style={{
          borderRadius: 12,
          marginBottom: 24,
          boxShadow:
            "0 2px 8px rgba(0,0,0,0.06)",
        }}
      >

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >

          <div>

            <Text
              strong
              style={{
                fontSize: 18,
              }}
            >
              {editingId
                ? "Edit Status"
                : "Add New Status"}
            </Text>

            <div>

              <Text type="secondary">
                {editingId
                  ? "Update the selected status details."
                  : "Create a new status for your system."}
              </Text>

            </div>

          </div>

          {editingId && (
            <Button
              icon={<CloseOutlined />}
              onClick={resetForm}
            >
              Cancel Edit
            </Button>
          )}

        </div>

        <Divider
          style={{
            margin: "0 0 24px",
          }}
        />

        <Form
          layout="vertical"
          onFinish={handleSubmit}
        >

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "minmax(220px, 1fr) minmax(180px, 220px) minmax(180px, 220px) auto auto",
              gap: 20,
              alignItems: "end",
            }}
          >

            {/* STATUS NAME */}

            <Form.Item
              label={
                <Text strong>
                  Status Name
                </Text>
              }
              style={{
                marginBottom: 0,
              }}
            >

              <Input
                size="large"
                placeholder="Enter status name"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                maxLength={100}
              />

            </Form.Item>

            {/* CODE */}

            <Form.Item
              label={
                <Text strong>
                  Code
                </Text>
              }
              style={{
                marginBottom: 0,
              }}
            >

              <Input
                size="large"
                placeholder="Example: ACTIVE"
                value={code}
                onChange={(e) =>
                  setCode(
                    e.target.value.toUpperCase()
                  )
                }
                maxLength={100}
              />

            </Form.Item>

            {/* TYPE */}

            <Form.Item
              label={
                <Text strong>
                  Type
                </Text>
              }
              style={{
                marginBottom: 0,
              }}
            >

              <Select
                size="large"
                value={type}
                onChange={(value) =>
                  setType(value)
                }
                style={{
                  width: "100%",
                }}
              >

                <Select.Option value="order">
                  Order
                </Select.Option>

                <Select.Option value="plan">
                  Plan
                </Select.Option>

                <Select.Option value="domain">
                  Domain
                </Select.Option>

              </Select>

            </Form.Item>

            {/* CUSTOM */}

            <Form.Item
              label={
                <Text strong>
                  Custom
                </Text>
              }
              style={{
                marginBottom: 0,
              }}
            >

              <div
                style={{
                  height: 40,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >

                <Switch
                  checked={isCustom}
                  onChange={setIsCustom}
                />

                <Text>
                  {isCustom
                    ? "Custom"
                    : "Default"}
                </Text>

              </div>

            </Form.Item>

            {/* ACTIVE */}

            <Form.Item
              label={
                <Text strong>
                  Status
                </Text>
              }
              style={{
                marginBottom: 0,
              }}
            >

              <div
                style={{
                  height: 40,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >

                <Switch
                  checked={isActive}
                  onChange={setIsActive}
                />

                <Text>
                  {isActive
                    ? "Active"
                    : "Inactive"}
                </Text>

              </div>

            </Form.Item>

            {/* BUTTON */}

            <Form.Item
              style={{
                marginBottom: 0,
              }}
            >

              <Space>

                {editingId && (
                  <Button
                    size="large"
                    icon={<CloseOutlined />}
                    onClick={resetForm}
                  >
                    Cancel
                  </Button>
                )}

                <Button
                  size="large"
                  type="primary"
                  htmlType="submit"
                  loading={saving}
                  icon={
                    editingId ? (
                      <SaveOutlined />
                    ) : (
                      <PlusOutlined />
                    )
                  }
                  style={{
                    background: "#000",
                    borderColor: "#000",
                  }}
                >

                  {editingId
                    ? "Update Status"
                    : "Add Status"}

                </Button>

              </Space>

            </Form.Item>

          </div>

        </Form>

      </Card>

      {/* =================================================
          TABLE CARD
      ================================================= */}

      <Card
        bordered={false}
        style={{
          borderRadius: 12,
          boxShadow:
            "0 2px 8px rgba(0,0,0,0.06)",
        }}
        title={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >

            <Text
              strong
              style={{
                fontSize: 18,
              }}
            >
              All Statuses
            </Text>

            <Tag>
              {statuses.length}
            </Tag>

          </div>
        }
      >

        <Table
          rowKey="_id"
          dataSource={statuses}
          columns={columns}
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: [
              "10",
              "20",
              "50",
            ],
            showTotal: (total) =>
              `Total ${total} statuses`,
          }}
          locale={{
            emptyText: (
              <Empty
                description="No statuses found"
              />
            ),
          }}
        />

      </Card>

    </div>
  );
};

export default StatusManager;

