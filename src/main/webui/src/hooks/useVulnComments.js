import React from "react";
import { getComments } from "../services/VulnerabilityClient";

// Fetch user comments for a single vulnerability id, returning loading and error state
export function useVulnComments(vulnId) {
  const [comments, setComments] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (!vulnId || typeof vulnId !== "string") {
      setComments("");
      setLoading(false);
      setError(null);
      return;
    }

    let isCancelled = false;
    setLoading(true);
    setError(null);
    setComments("");

    getComments(vulnId)
      .then(result => {
        if (isCancelled) return;
        setComments(result || "");
      })
      .catch(e => {
        if (isCancelled) return;
        setError(e);
      })
      .finally(() => {
        if (isCancelled) return;
        setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [vulnId]);

  return { comments, loading, error };
}


