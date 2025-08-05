import { newMorpheusRequest } from "../services/FormUtilsClient";

const preProcessMorpheusRequests = async payloads => {
  return await fetch(`/pre-processing`, {
    method: "POST",
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payloads)
  });
};

const generateRequestPayload = async (formData) => {
  
	try {
		const response = await newMorpheusRequest(formData, false);
		
		if (!response.ok) {
			const json = await response.json();
			return { error: `Could not generate payload for morpheus request. status: ${response.status}, error: ${json.error}` };
		}

		const reportData = await response.json();
		return reportData;
	} catch (error) {
		return { error: `Could not generate payload for morpheus request, ${error.message}` };
	}
};

const parseReferenceParams = ref => {
	const queryString = ref.split('?')[1];
	if (!queryString) return;

	const params = new URLSearchParams(queryString);
	const repositoryUrl = params.get("repository_url");
	const tag = params.get("tag");

	return {repositoryUrl, tag};
};  

const parseImageFromReference = ref => {
	const {repositoryUrl, tag} = parseReferenceParams(ref);
	return repositoryUrl && tag ? `${repositoryUrl}:${tag}` : null;
};

export const buildFailedComponentJson = (failures, productId) => {
	return failures.map(failure => ({
		productId: productId,
		imageName: failure.imageName,
		imageVersion: failure.imageVersion,
		error: failure.error
	}));
}
  

const saveFailedComponents = async (failures, compFormData) => {
	if (failures.length > 0 && compFormData.metadata) {
		const productId = compFormData.metadata.find(m => m.name === 'product_id');
		if (productId) {
			try {
				await fetch('/submission-failures', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(buildFailedComponentJson(failures, productId.value))
				});
				console.log(`Saved ${failures.length} component failures to database`);
			} catch (error) {
				console.error('Failed to save component failures to database:', error);
			}
		}
	}
};  

const generateComponentSbom = async ref => {

	console.log("Generating SBOM from component " + ref);
	const image = parseImageFromReference(ref);
	if (!image) {
		return { error: `Could not extract image, invalid reference format` };
	}
    
	try {
		const response = await fetch('/generate-sbom', {
			method: 'POST',
			headers: { 'Content-Type': 'text/plain' },
			body: image
		});

		if (!response.ok) {
			const error = await response.text();
			return { error: `Could not generate SBOM. status: ${response.status}, error: ${error}` };
		}

		const sbom = await response.json();
		return sbom;
	} catch (error) {
		return { error: `Could not generate SBOM. ${error.message}` };
	}
};

const lookupCachedComponent = async ref => {
	let url = '/reports';
	const {repositoryUrl, tag} = parseReferenceParams(ref);

	const filterUrl = `${url}?imageName=${repositoryUrl}&imageTag=${tag}`
	const reportListResponse = await fetch(filterUrl, {
		headers: {
			'Accept': 'application/json'
		}
	});

	if (!reportListResponse.ok) {
		const error = await reportListResponse.text();
		concole.error(`Could not retrieve report List for ${ref} from cached reports. status: ${reportListResponse.status}, error: ${error}`);
		return
	}

	const reportList = await reportListResponse.json();
	if (reportList.length === 0) return;

	const id = reportList[0]["id"];
	const reportResponse = await fetch(`${url}/${id}`, {
		headers: {
			'Accept': 'application/json'
		}
	});

	if (!reportResponse.ok) {
		const error = await reportResponse.text();
		concole.error(`Could not retrieve report for ${ref} from cached reports. status: ${reportResponse.status}, error: ${error}`);
		return
	}

	const report = await reportResponse.json();
	return report?.input?.image;
};

export const generateMorpheusRequest = async (components, formData) => {
	const compFormData = { ...formData };
		
	const tasks = components.map(async (comp) => {

		try {
			const image = await lookupCachedComponent(comp.ref);
			
			if (image) {
				console.log("Image " + image.name + "found in cache, skipping SBOM generation");
				compFormData.image = image;
			} else {
				const sbom = await generateComponentSbom(comp.ref);
				
				if (sbom.error) {
					return { component: comp, error: sbom.error };
				}
				
				compFormData.sbom = sbom;
			}

			const payload = await generateRequestPayload(compFormData);
			
			if (payload.error) {
				return { component: comp, error: payload.error };
			}
			
			return { payload };
		} catch (err) {
			return { component: comp, error: err.message || String(err) };
		}
	});

	const results = await Promise.allSettled(tasks);

	const payloads = [];
	const failures = [];

	for (const result of results) {
		const value = result.value;
		if (value.payload) {
			payloads.push(value.payload);
		} else {
			failures.push({imageName: value.component.name, imageVersion: value.component.version, error: value.error });
		}
	}
	
	console.log(
		`${failures.length} out of ${components.length} components failed, and ${payloads.length} sent to Agent Morpheus for analysis`
	);

	await saveFailedComponents(failures, compFormData);

	if(payloads.length) {
		const res = await preProcessMorpheusRequests(payloads);
		
		if (res.status >= 300) {
			failures.push({
				image: 'pre-processing',
				error: `Component Syncer failed with error status: ${res.status}`
			});
		}
	}

	return failures;
}