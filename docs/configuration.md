# Configuration

## Authentication

For development a Keycloak instance will be instantiated with the users defined in the configuration.

```properties
%dev.quarkus.keycloak.devservices.users.joe=pass123
```

For production the OpenShift OAuth2 provider will be used so it is required to
provide the following environment variables:

* `OPENSHIFT_DOMAIN`: e.g. `example.openshift.com`
* `OAUTH_CLIENT_SECRET`: With the secret defined for the `agent-morpheus-client` in the OpenShift cluster.

In the cluster you have to create an `OAuthClient` with the right redirect URLs

```yaml
apiVersion: oauth.openshift.io/v1
kind: OAuthClient
metadata:
  name: agent-morpheus-client
grantMethod: prompt
secret: some-long-secret-used-by-the-oauth-client
redirectURIs:
  - "http://agent-morpheus-client:8080"
  - "https://agent-morpheus-client.example.openshift.com/app/index.html"
  - "http://agent-morpheus-client.example.openshift.com/app/index.html"
```

## External services (GitHub / Morpheus)

Use the `rest-client` properties for updating the default the github and morpheus RestClient endpoints:

```properties
quarkus.rest-client.github.url=https://api.github.com
quarkus.rest-client.morpheus.url=https://agent-morpheus:8080/scan
```

For development the external calls will be mocked using WireMock. The report behaviour
will depend on the preffix used in the report ID.

* `error-` will fail to process
* `timeout-` will generate a report result after 5 seconds
* any other request will be immediately replied with a success

## Database (MongoDB)

In development a MongoDB instance will be started as a DevService. You can use an external instance with `-Dquarkus.mongodb.connection-string=mongodb://localhost:27017/`. Or forche the port number with `-Dquarkus.mongodb.devservices.port=27017`

At startup a bunch of reports will be loaded for development.

In production it is expected that the following environment variables are provided:

* `MONGODB_SVC_HOST`
* `MONBODB_SVC_PORT`
* `MONBODB_USERNAME`
* `MONGODB_PASSWORD`

## Queue and timeout

In order to avoid overloading Morpheus, specially when a batch of requests should be processed,
you can configure a maximum number of ongoing requests and a maximum number of waiting
requests. Finally it is possible to define the timeout for an ongoing request.

```properties
morpheus.queue.max-active=5 #max number of ongoing requests
morpheus.queue.max-size=100 #max number of waiting requests
morpheus.queue.timeout=5m #duration of an ongoing request
```

Every 10 seconds the ongoing requests will be checked and expired if needed, then
the waiting queue will be updated and send new requests to Morpheus

## Pending Component Syncer timeout

The Component Syncer is responsible for pre-processing component documents during product scanning. You can configure the timeout for the syncer to control how long the system waits for the component synchronization process to complete and send processed batch for analysis before timing out.

```properties
morpheus.syncer.timeout=1h # duration to wait for component syncer during pre-processing
```

Set this value according to the expected processing time for your product. If the syncer does not finish within the configured timeout, any components still pending will be marked as expired.

## Purge

You can activate the purge for old reports. By default is disabled and unless the
cron expression is provided it will not be executed.

```properties
morpheus.purge.cron=0 0 * * * ? #Run every midnight
morpheus.purge.after=7d #Remove reports older than 7 days
```

## Includes / Excludes

It is possible to provide a custom path for `includes.json` and `excludes.json` with the patterns
to use for the different programming languages. This is an example of an includes.json file:

```json
{
  "Go": [
    "**/*.go"
  ],
  "Python": [
    "**/*.py",
    "pyproject.toml",
    "setup.py",
    "setup.cfg"
  ],
  "Java": [
    "**/*.java",
    "settings.gradle",
    "src/main/**/*"
  ]
}
```