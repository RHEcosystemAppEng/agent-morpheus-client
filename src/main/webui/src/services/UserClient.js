import { ClientRequestError } from "./ClientUtils";

export const getUserInfo = async () => {
  const response = await fetch('/user/info', {
    headers: {
      'Accept': 'application/json'
    }
  });
  if (!response.ok) {
    throw new ClientRequestError(response.status, response.statusText);
  }
  return await response.json();

};


export const logoutUser = async () => {
  // delete the credential cookie, essentially killing the session
  const response = await fetch('/user/logout', { method: 'POST' });
  if (!response.ok) {
    throw new ClientRequestError(response.status, response.statusText);
  }
  
}