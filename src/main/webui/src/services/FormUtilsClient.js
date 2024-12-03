import { PackageURL } from "packageurl-js";
import { supportedLanguages } from "../Constants";

const GITHUB_PREFIX = 'https://github.com/';

const SPDX_SBOM = 'spdx+json';
const CYCLONEDX_SBOM = 'cyclonedx+json';
const CSV_SBOM = 'csv';

export const sbomTypes = [
  {
    value: CSV_SBOM,
    label: 'CSV',
    disabled: false
  },
  {
    value: CYCLONEDX_SBOM,
    label: 'CycloneDX (JSON)',
    disabled: false
  }
];

export const getGitHubLanguages = (repoUrl) => {
  if (!repoUrl.startsWith(GITHUB_PREFIX)) {
    return Promise.resolve([]);
  }
  const repo = repoUrl.replace(GITHUB_PREFIX, '');
  const params = new URLSearchParams({
    'repository': repo
  });

  return fetch(`/form/git-languages?${params}`)
    .then(response => response.json())
    .then(data => {
      const valid = supportedLanguages.map(i => i.value);
      return data.filter(l => valid.includes(l));
    }).catch(_ => []);
}

const getVulns = (cves) => {
  if (cves === undefined) {
    return [];
  }
  return cves.map(cve => ({ vuln_id: cve.name?.trim() }));
};

const getIncludes = (languages) => {
  if (languages === undefined) {
    return [];
  }
  const result = languages.map(l => {
    switch (l) {
      case 'Go':
        return [
          "**/*.go"
        ];

      case 'Python':
        return [
          "**/*.py", // All Python source files
          "pyproject.toml", // PEP 518/517 build system
          "setup.py", // Setuptools configuration
          "setup.cfg" // Alternate setuptools configuration
        ];

      case 'Java':
        return [
          "**/*.java", // All Java source files
          "settings.gradle", // Gradle settings file
          "src/main/**/*" // Main Java source files
        ];

      case 'JavaScript':
        return [
          "**/*.js", // All JavaScript source files
          "**/*.jsx", // JSX files for React
          "webpack.config.js", // Webpack configuration
          "rollup.config.js", // Rollup configuration
          "babel.config.js", // Babel configuration
          ".babelrc", // Alternate Babel configuration
          ".eslintrc.js", // ESLint configuration
          ".eslintrc.json", // Alternate ESLint configuration
          "tsconfig.json", // TypeScript configuration
          "*.config.js", // Other JS configuration files
          "*.config.json", // JSON configuration files
          "public/**/*", // Public assets (images, icons, etc.)
          "src/**/*" // Main source files directory
        ];

      case 'TypeScript':
        return [
          "**/*.ts", // All TypeScript source files
          "**/*.tsx", // TSX files for React (TypeScript)
          "tsconfig.json", // TypeScript configuration
          "tsconfig.*.json", // TypeScript environment-specific configurations
          "webpack.config.js", // Webpack configuration
          "webpack.config.ts", // Webpack configuration in TypeScript
          "rollup.config.js", // Rollup configuration
          "rollup.config.ts", // Rollup configuration in TypeScript
          "babel.config.js", // Babel configuration
          ".babelrc", // Alternate Babel configuration
          ".eslintrc.js", // ESLint configuration
          ".eslintrc.json", // Alternate ESLint configuration
          "*.config.js", // Other JS configuration files
          "*.config.ts", // Other TS configuration files
          "*.json", // JSON configuration files
          "src/**/*", // Main source files directory
          "public/**/*", // Public assets (images, icons, etc.)
          "assets/**/*" // Additional assets directory
        ];

      case 'Dockerfile':
        return [
          "Dockerfile*", // Main Dockerfile
          "docker-compose.yml", // Docker Compose configuration
          "*.dockerfile", // Additional Dockerfiles with different names
          "*.dockerignore", // Docker ignore files
          "docker-compose.*.yml", // Environment-specific Docker Compose files
          "*.sh", // Shell scripts used in the Docker build process
          "scripts/**/*", // Any custom scripts used in the Docker setup
          "*.env", // Environment variable files
          "*.yaml", // YAML configuration files
          "*.yml", // YAML configuration files
          "*.json", // JSON configuration files
          "config/**/*", // Configuration files relevant to Docker
          "conf.d/**/*" // Additional configuration directories
        ];

      case 'Docs':
        return [
          "**/*.md",
          "docs/**/*.rst"
        ];

      default:
        return [];
    }
  });
  return result.flat();
};

const getExcludes = (languages) => {
  if (languages === undefined) {
    return [];
  }
  const result = languages.map(l => {
    switch (l) {
      case 'Go':
        return [
          "test/**/*",
          "vendor/**/*",
          "go.mod",
          "go.sum"
        ];
      case 'Java':
        return [
          "target/**/*",  // Maven build output directory
          "build/**/*",  // Gradle build output directory
          "*.class",  // Compiled Java classes
          ".gradle/**/*",  // Gradle cache
          ".mvn/**/*",  // Maven wrapper files
          ".gitignore",  // Git ignore file
          "test/**/*",  // Test source files
          "tests/**/*",  // Alternate test directories
          "src/test/**/*",  // Test files in the test source set
          "pom.xml",
          "build.gradle"
        ];
      case 'JavaScript':
        return [
          "node_modules/**/*",  // Node.js dependencies
          "dist/**/*",  // Distribution files
          "build/**/*",  // Build output directories
          "test/**/*",  // Test source files
          "tests/**/*",  // Alternate test directories
          "example/**/*",  // Example files or directories
          "examples/**/*",  // Alternate example directories
          "package.json",
          "package-lock.json",
          "yarn.lock"
        ];
      case 'TypeScript':
        return [
          "node_modules/**/*",  // Node.js dependencies
          "dist/**/*",  // Distribution files
          "build/**/*",  // Build output directories
          "test/**/*",  // Test source files
          "tests/**/*",  // Alternate test directories
          "example/**/*",  // Example files or directories
          "examples/**/*",  // Alternate example directories
          "package.json",
          "package-lock.json",
          "yarn.lock"
        ];
      case 'Python':
        return [
          "tests/**/*",  // Test files and directories
          "test/**/*",  // Alternate naming for test directories
          "venv/**/*",  // Virtual environment files
          ".venv/**/*",  // Alternate virtual environment directory
          "env/**/*",  // Another common virtual environment directory
          "build/**/*",  // Build directories
          "dist/**/*",  // Distribution directories
          ".mypy_cache/**/*",  // Mypy cache
          ".pytest_cache/**/*",  // Pytest cache
          "__pycache__/**/*",  // Python bytecode
          "*.pyc",  // Python compiled bytecode files
          "*.pyo",  // Optimized bytecode files
          "*.pyd",  // Windows compiled files
          "requirements.txt",
          "Pipfile",
          "Pipfile.lock"
        ];
      default:
        return []
    }
  });
  return result.flat();
};

export const getProperty = (metadata, property) => {
  const found = metadata['properties'].find(e => e.name === property);
  if (found) {
    return found.value;
  }
  return '';
};

// Extract the system info from the purl when possible, if not try to retrieve it
// from the syft:package:type metadata property
const getSystem = (component) => {
  const purl = component['purl'];
  if (purl !== undefined) {
    try {
      return PackageURL.fromString(purl).type;
    } catch (e) {
      // there's a parsing version, try to fetch it from the syft property
    }
  }
  const prop = getProperty(component, "syft:package:type");
  switch(prop) {
    case 'go-module':
      return 'golang';
    case 'java-archive':
      return 'maven';
    default:
      return prop;
  }
}

export const countComponents = (data) => {
  return getComponents(data).length;
}

const getComponents = (sbom) => {
  if (sbom === undefined) {
    return [];
  }
  return sbom['components']?.map(component => {
    const system = getSystem(component);
    return JSON.stringify({
      name: component['name'],
      version: component['version'],
      purl: component['purl'],
      system: system
    })
  });
};

const buildSbomInfo = (data) => {
  if (data.sbomType === CSV_SBOM) {
    return {
      _type: "manual",
      packages: getComponents(data.sbom)?.map(c => JSON.parse(c))
    }
  }
  if (data.sbomType === CYCLONEDX_SBOM) {
    return {
      _type: CYCLONEDX_SBOM,
      sbom: data.sbom
    }
  }
  return {};
}

export const buildRequestJson = (data) => {
  return {
    scan: {
      id: data.id,
      vulns: getVulns(data.cves)
    },
    image: {
      name: data.name,
      tag: data.version,
      source_info: [
        {
          type: "git",
          source_type: "code",
          git_repo: data.repository,
          ref: data.commitRef,
          include: getIncludes(data.languages),
          exclude: getExcludes(data.languages)
        },
        {
          type: "git",
          source_type: "doc",
          git_repo: data.repository,
          ref: data.commitRef,
          include: getIncludes(["Docs"]),
          exclude: []
        }
      ],
      sbom_info: buildSbomInfo(data)
    }
  };
}

export const sendToMorpheus = async (data) => {
  return await fetch('/form', {
    method: "POST",
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(buildRequestJson(data))
  });
}
