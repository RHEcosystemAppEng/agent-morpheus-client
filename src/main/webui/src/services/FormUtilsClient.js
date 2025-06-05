const CYCLONEDX_SBOM = 'cyclonedx+json';
const MANUAL_SBOM = 'manual';

export const sbomTypes = [
  {
    value: MANUAL_SBOM,
    label: 'Manual (CSV)',
    disabled: false
  },
  {
    value: CYCLONEDX_SBOM,
    label: 'CycloneDX (JSON)',
    disabled: true
  }
];

const buildMetadata = (metadata) => {
  if(metadata === undefined) {
    return {};
  }
  return Object.fromEntries(metadata.map((e) => [e.name, e.value]));
};

export const buildRequestJson = (data) => {
  return {
    id: data.id,
    prodId: data.prodId,
    vulnerabilities: data.cves.map(e => e.name),
    metadata: buildMetadata(data.metadata),
    sbom_info_type: data.sbomType,
    sbom: data.sbom
  };
}

export const sendToMorpheus = async (data) => {
  return await fetch('/reports/new', {
    method: "POST",
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(buildRequestJson(data))
  });
}
