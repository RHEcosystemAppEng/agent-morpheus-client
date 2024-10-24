export const setVulnComments = async (vulnId, comments) => {
  return await fetch('/vulnerabilities/' + vulnId, {
    method: "PUT",
    headers: {
      'Content-Type': 'text/plain'
    },
    body: comments
  });
}


export const getVulnComments = async (vulnId) => {
  const response = await fetch('/vulnerabilities/' + vulnId, {
    method: "GET",
    headers: {
      'Accept': 'text/plain'
    }
  });
  if (!response.ok) {
    throw new ClientRequestError(response.status, response.statusText);
  }
  return await response.text();
}