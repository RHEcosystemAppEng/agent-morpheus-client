import { ClientRequestError } from "./ClientUtils";

export const listProducts = async () => {
  const response = await fetch('/reports/product-ids', {
    headers: {
      'Accept': 'application/json'
    }
  });
  if (!response.ok) {
    throw new ClientRequestError(response.status, response.statusText);
  }
  return await response.json();

};
export const deleteProducts = async (filter) => {
  let url = '/reports/by-product';
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

// export const deleteProduct = async (productId) => {
//   const response = await fetch(`/reports/${productId}`, {
//     method: 'DELETE'
//   });
//   if (!response.ok) {
//     throw new ClientRequestError(response.status, response.statusText);
//   }
//   return true;
// };

// export const viewProduct = async (productId) => {
//   const response = await fetch(`/reports/${productId}`, {
//     headers: {
//       'Accept': 'application/json'
//     }
//   });
//   if (!response.ok) {
//     throw new ClientRequestError(response.status, response.statusText);
//   }
//   return await response.json();

// };