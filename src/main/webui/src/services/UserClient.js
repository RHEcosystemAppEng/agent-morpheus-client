import { ClientRequestError } from "./ClientUtils";

export const getUserName = async () => {
  const response = await fetch('/api/v1/user', {
    headers: {
      'Accept': 'application/json'
    }
  });
  if (!response.ok) {
    throw new ClientRequestError(response.status, response.statusText);
  }
  return (await response.json()).name;

};


export const logoutUser = async () => {
  // Local-only logout (no IdP session termination)
  // Clears cookies/storage via Clear-Site-Data header and shows logout page
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = '/api/v1/user/logout';
  document.body.appendChild(form);
  form.submit();
}
