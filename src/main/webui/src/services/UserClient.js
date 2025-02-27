import { ClientRequestError } from "./ClientUtils";

export const getUserName = async () => {
  const response = await fetch('/user', {
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
  // delete the credential cookie, essentially killing the session
  const removeCookie = `q_session=; Max-Age=0;path=/`;
  document.cookie = removeCookie;
  
  const response = await fetch('/user/logout', { method: 'POST' });
  if (!response.ok) {
    throw new ClientRequestError(response.status, response.statusText);
  }
  
}