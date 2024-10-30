import { ClientRequestError } from "./ClientUtils";

export const listReports = async (filter) => {
  let queryParams = new URLSearchParams();
  filter?.keys().forEach((p) => {
    if(filter.has(p)) {
      queryParams.set(p, filter.get(p));
    }
  });

  let url = '/reports';
  if(queryParams.size > 0) {
    url += '?' + queryParams;
  }
  const response = await fetch(url, {
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