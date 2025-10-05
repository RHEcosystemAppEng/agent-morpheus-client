import { PageSection, Content, Bullseye, Spinner } from "@patternfly/react-core";
import DonutChartWrapper from "./DonutChartWrapper";
import { listReports } from "../services/ReportClient";
import { useOutletContext, useSearchParams } from "react-router-dom";

export default function ProductCveStatusPieChart({ productId }) {
  const [searchParams] = useSearchParams();
  const { addAlert } = useOutletContext();
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState([]);

  // Build pie slices grouped by vulnerability status:
  // - TRUE -> a single slice labeled "vulnerable" (red)
  // - FALSE -> a single slice labeled "not_vulnerable" (green)
  // - UNKNOWN or missing -> a single slice labeled "uncertain" (gray)
  const aggregateByLabel = (reports) => {
    let vulnerableCount = 0;
    let notVulnerableCount = 0;
    let unknownCount = 0;

    reports.forEach(r => {
      (r.vulns || []).forEach(v => {
        const status = v?.justification?.status || "UNKNOWN";
        if (status === "TRUE") {
          vulnerableCount += 1;
        } else if (status === "FALSE") {
          notVulnerableCount += 1;
        } else {
          unknownCount += 1;
        }
      });
    });

    const slices = [];
    if (vulnerableCount > 0) {
      slices.push({ x: "vulnerable", y: vulnerableCount });
    }
    if (notVulnerableCount > 0) {
      slices.push({ x: "not_vulnerable", y: notVulnerableCount });
    }
    if (unknownCount > 0) {
      slices.push({ x: "uncertain", y: unknownCount });
    }

    return slices;
  };

  const loadAllReports = async () => {
    try {
      const pageSize = 100;
      const filter = new URLSearchParams(searchParams);
      if (productId) {
        filter.set("product_id", productId);
      } else {
        filter.delete("product_id");
      }
      const first = await listReports(filter, 1, pageSize);
      let all = [...first.reports];
      const totalPages = parseInt(first.totalPages || 1);
      for (let p = 2; p <= totalPages; p++) {
        const next = await listReports(filter, p, pageSize);
        all = all.concat(next.reports);
      }
      setData(aggregateByLabel(all));
    } catch (e) {
      addAlert("danger", "Unable to load CVE status chart");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    setLoading(true);
    loadAllReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString(), productId]);

  // Color mapping for the three statuses
  const computeColors = (slices) => {
    const red = "#C9190B";   // Vulnerable
    const green = "#3E8635"; // Not Vulnerable
    const gray = "#6A6E73";  // Unknown
    return slices.map(d => {
      if (d.x === "vulnerable") return red;
      if (d.x === "not_vulnerable") return green;
      if (d.x === "uncertain") return gray;
      return gray;
    });
  };

  const toTitleCase = (s) => {
    if (!s) return "";
    return s
      .toString()
      .replace(/[_-]+/g, " ")
      .split(" ")
      .filter(Boolean)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  };

  const colors = computeColors(data);
  const total = React.useMemo(() => data.reduce((sum, d) => sum + d.y, 0), [data]);
  const legendData = React.useMemo(() => data.map(d => ({ name: `${toTitleCase(d.x)}: ${d.y}` })), [data]);
  
  return <>
    
    {loading ? (
      <div style={{ width: '150px', height: '150px' }}>
        <Bullseye>
          <Spinner size="xl" />
        </Bullseye>
      </div>
    ) : (
      data.length === 0 ? (
        <Content>No CVE incidents found for current filters.</Content>
      ) : (
        <DonutChartWrapper
          ariaDesc="CVE incidents by status"
          ariaTitle="CVE incidents by status"
          data={data}
          colorScale={colors}
          legendData={legendData}
          title={`${total}`}
          subTitle="Statuses"
          total={total}
        />
      )
    )}
  </>;
} 