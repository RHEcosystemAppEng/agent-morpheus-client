import { useEffect } from "react";
import { useParams, useNavigate } from "react-router";

const ProductRedirect: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (productId) {
      navigate(`/Reports?productId=${productId}`, { replace: true });
    } else {
      navigate("/Reports", { replace: true });
    }
  }, [productId, navigate]);

  return null;
};

export default ProductRedirect;

