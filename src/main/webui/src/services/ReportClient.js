import { ClientRequestError } from "./ClientUtils";

export const listReports = async (filter, page, perPage) => {
  let queryParams = new URLSearchParams();
  filter?.keys().forEach((p) => {
    if(filter.has(p)) {
      queryParams.set(p, filter.get(p));
    }
  });
  queryParams.set("page", page - 1);
  queryParams.set("pageSize", perPage);
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
  return {
    reports: await response.json(),
    totalPages: response.headers.get('X-Total-Pages'),
    totalElements: response.headers.get('X-Total-Elements')
  };

};
export const deleteReports = async (filter) => {
  let url = '/reports';
  if(filter.size > 0) {
    url += '?' + filter.toString();
  }
  const response = await fetch(url, {
    method: 'DELETE'
  });
  if (!response.ok) {
    throw new ClientRequestError(response.status, response.statusText);
  }
  return true;
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

export const retryReport = async (reportId) => {
  const response = await fetch(`/reports/${reportId}/retry`, {
    method: 'POST'
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