# Connecting to MongoDB

This guide explains how to configure ExploitIQ to connect to an external MongoDB instance.

## Prerequisites

Before you configure ExploitIQ, ensure that the external MongoDB instance meets the following requirements:

| Requirement | Value |
| --- | --- |
| MongoDB version | 8.x |
| Database name | `exploit-iq-client` |
| User role | `readWrite` on `exploit-iq-client` |
| Auth source | `exploit-iq-client` |
| Network access | ExploitIQ must be able to reach the MongoDB host and port |

## Configuring the Application

Set the following environment variables in your deployment. Use Mode A (host and port) or Mode B (MongoDB Atlas or SRV) — do not use both.

### Mode A: Host and Port

```text
QUARKUS_MONGODB_HOSTS=<host>:<port>
QUARKUS_MONGODB_DATABASE=exploit-iq-client
QUARKUS_MONGODB_CREDENTIALS_USERNAME=<user>
QUARKUS_MONGODB_CREDENTIALS_PASSWORD=<password>
```

The application uses `exploit-iq-client` as the default auth source. If your MongoDB user authenticates against a different database, for example `admin`, then set the following variable:

```text
QUARKUS_MONGODB_CREDENTIALS_AUTH_SOURCE=<auth-database>
```

### Mode B: MongoDB Atlas or SRV Connection String

```text
QUARKUS_MONGODB_CONNECTION_STRING=mongodb+srv://<user>:<password>@<cluster>/
QUARKUS_MONGODB_DATABASE=exploit-iq-client
```

If your MongoDB user authenticates against a different database, then set the following variable:

```text
QUARKUS_MONGODB_CREDENTIALS_AUTH_SOURCE=<auth-database>
```

## Enabling TLS

Use TLS when your MongoDB instance requires encrypted connections.

To enable TLS with a standard trusted certificate authority, then set the following variable:

```text
QUARKUS_MONGODB_TLS=true
```

To use a custom certificate authority (CA) or self-signed certificate, set a named TLS configuration and mount the appropriate certificate into the application pod:

```text
QUARKUS_MONGODB_TLS=true
QUARKUS_MONGODB_TLS_CONFIGURATION_NAME=<name>
QUARKUS_TLS_<NAME>_TRUST_STORE_PEM_CERTS=<path-to-cert>
```

Refer to the [Quarkus TLS registry](https://quarkus.io/guides/tls-registry-reference) for how to define a named TLS configuration.

## Verifying the Connection

After you deploy the application, run the following commands to verify the connection:

```bash
# Confirm connection env vars are set
oc exec deploy/exploit-iq-client -- env | grep -E 'QUARKUS_MONGODB|MONGODB'

# Check MongoDB driver connection status
oc logs deploy/exploit-iq-client | grep "Monitor thread successfully connected"
```

A successful connection produces a log line similar to the following:

```text
INFO [or.mo.dr.cluster] Monitor thread successfully connected to server with description ...}
```

## Development Mode

By default, ExploitIQ uses [Quarkus Dev Services](https://quarkus.io/guides/mongodb#dev-services) to start a MongoDB Testcontainer automatically in development mode. To connect to an external MongoDB instance during development, use one of the following connection options.

To connect to a local MongoDB instance, set the connection string when you start the application:

```text
./mvnw quarkus:dev -Dquarkus.mongodb.connection-string=mongodb://localhost:27017/
```

If your local MongoDB requires authentication, then include credentials in the connection string:

```text
./mvnw quarkus:dev -Dquarkus.mongodb.connection-string=mongodb://<user>:<password>@localhost:27017/exploit-iq-client?authSource=exploit-iq-client
```

To connect to MongoDB Atlas or any external MongoDB, disable MongoDB Dev Services and set the connection string by using environment variables:

```bash
export QUARKUS_MONGODB_CONNECTION_STRING='mongodb+srv://<user>:<password>@<cluster>/'
export QUARKUS_MONGODB_DATABASE='exploit-iq-client'

./mvnw quarkus:dev -Dquarkus.mongodb.devservices.enabled=false
```

When you provide a connection string by either method, Dev Services does not start a Testcontainer.

To force Dev Services to use a fixed port for the Testcontainer instead, use the following option:

```text
./mvnw quarkus:dev -Dquarkus.mongodb.devservices.port=27017
```
