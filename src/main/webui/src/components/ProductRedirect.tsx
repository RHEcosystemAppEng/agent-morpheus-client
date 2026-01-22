import { useEffect } from "react";
import { useParams, useNavigate } from "react-router";

const ProductRedirect: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (productId) {
      navigate(`/reports?productId=${productId}`, { replace: true });
    } else {
      navigate("/reports", { replace: true });
    }
  }, [productId, navigate]);

  return null;
};

export default ProductRedirect;

