import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000";

export const loginAdmin = async (username, password) => {
  const res = await axios.post(`${API_BASE_URL}/api/admin/login`, {
    username,
    password,
  });
  return res.data;
};

export const scanProduct = async (file) => {
  const formData = new FormData();
  formData.append("front_file", file);

  const res = await axios.post(`${API_BASE_URL}/api/customer/scan`, formData);
  return res.data;
};

export const getInventory = async () => {
  const token = localStorage.getItem("adminToken");

  const res = await axios.get(`${API_BASE_URL}/api/admin/inventory`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data;
};

export const getAudioUrl = (audioPath) => {
  return `${API_BASE_URL}${audioPath}`;
};
export const getProducts = async () => {
  const token = localStorage.getItem("adminToken");

  const res = await axios.get(`${API_BASE_URL}/api/admin/products`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return res.data;
};

export const downloadProductsPdf = () => {
  const token = localStorage.getItem("adminToken");

  window.open(
    `${API_BASE_URL}/api/admin/products/pdf?token=${token}`,
    "_blank"
  );
};

export const vendorScanStock = async (file, stockCount, batchNo) => {
  const token = localStorage.getItem("adminToken");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("stock_count", stockCount);
  formData.append("batch_no", batchNo);

  const res = await axios.post(`${API_BASE_URL}/api/vendor/scan-stock`, formData, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return res.data;
};