class ClientRequestError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const listReports = async () => {
  const response = await fetch('/reports', {
    headers: {
      'Accept': 'application/json'
    }
  });
  if (!response.ok) {
    throw new ClientRequestError(response.status, response.statusText);
  }
  return await response.json();

};

export const deleteReport = async (reportId) => {
  const response = await fetch(`/reports/${reportId}`, {
    method: 'DELETE'
  });
  if (!response.ok) {
    throw new ClientRequestError(response.status, response.statusText);
  }
  return true;
};

export const viewReport = async (reportId) => {
  const response = await fetch(`/reports/${reportId}`, {
    headers: {
      'Accept': 'application/json'
    }
  });
  if (!response.ok) {
    throw new ClientRequestError(response.status, response.statusText);
  }
  return await response.json();

};