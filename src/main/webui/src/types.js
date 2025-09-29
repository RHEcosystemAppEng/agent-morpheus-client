/**
 * @typedef {Object} Cvss
 * @property {string=} vector_string
 */

/**
 * @typedef {Object} ChecklistItem
 * @property {string} input
 * @property {string} response
 */

/**
 * @typedef {Object} Vuln
 * @property {string} vuln_id
 * @property {{ label: string, status: string, reason: string }} justification
 * @property {string} summary
 * @property {Cvss=} cvss
 * @property {number=} intel_score
 * @property {ChecklistItem[]=} checklist
 */

/**
 * @typedef {Object} ImageInfo
 * @property {string} name
 * @property {string} tag
 */

/**
 * @typedef {Object} Scan
 * @property {string} id
 * @property {Vuln[]} vulns
 * @property {string=} started_at
 * @property {string=} completed_at
 */

/**
 * @typedef {Object} ReportInput
 * @property {ImageInfo} image
 * @property {Scan} scan
 */

/**
 * @typedef {Object} Report
 * @property {ReportInput} input
 * @property {Vuln[]} output
 * @property {Record<string, any>=} metadata
 */

/**
 * @typedef {Object} FailedComponent
 * @property {string} imageName
 * @property {string} imageVersion
 * @property {string} error
 */

/**
 * @typedef {Object} ProductData
 * @property {string} id
 * @property {string} name
 * @property {string} version
 * @property {string} submittedAt
 * @property {number} submittedCount
 * @property {Record<string, string>} metadata
 * @property {FailedComponent[]} submissionFailures
 * @property {string=} completedAt
 */

/**
 * @typedef {Object} ProductSummary
 * @property {string} productState
 * @property {string[]} componentStates
 * @property {Record<string, { status: string, label: string }[]>} cves
 */

/**
 * @typedef {Object} Product
 * @property {ProductData} data
 * @property {ProductSummary} summary
 */

export {}; // JSDoc types only 