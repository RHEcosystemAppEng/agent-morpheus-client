<!--
SPDX-FileCopyrightText: Copyright (c) 2026, Red Hat Inc. & AFFILIATES. All rights reserved.
SPDX-License-Identifier: Apache-2.0
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
-->

# Configuration

## Authentication

For detailed authentication configuration including OpenShift OAuth, Keycloak, and external identity providers (Google, GitHub, Azure AD), see the [Authentication Guide](./authentication.md).

## External Services (GitHub / ExploitIQ)

Use the `rest-client` properties for updating the default the github and ExploitIQ RestClient endpoints:

```properties
quarkus.rest-client.github.url=https://api.github.com
quarkus.rest-client.exploit-iq.url=https://exploit-iq:8080/scan
```

For development the external calls will be mocked using WireMock. The report behaviour
will depend on the preffix used in the report ID.

* `error-` will fail to process
* `timeout-` will generate a report result after 5 seconds
* any other request will be immediately replied with a success

## Database (MongoDB)

By default, ExploitIQ uses [Quarkus Dev Services](https://quarkus.io/guides/mongodb#dev-services) to start a MongoDB Testcontainer automatically in development mode. Sample reports are loaded at startup.

To connect to an external MongoDB instance, refer to [Connecting to MongoDB](./connecting-to-mongodb.md).

## Queue and timeout

In order to avoid overloading ExploitIQ, specially when a batch of requests should be processed,
you can configure a maximum number of ongoing requests and a maximum number of waiting
requests. Finally it is possible to define the timeout for an ongoing request.

```properties
exploit-iq.queue.max-active=5 #max number of ongoing requests
exploit-iq.queue.max-active-per-user=5 #max number of concurrent ongoing requests per authenticated user
exploit-iq.queue.max-size=100 #max number of waiting requests
exploit-iq.queue.timeout=5m #duration of an ongoing request
```

Every 10 seconds the ongoing requests will be checked and expired if needed, then
the waiting queue will be updated and send new requests to ExploitIQ

`exploit-iq.queue.max-active-per-user` limits how many of the global `max-active`
slots a single authenticated user can occupy at once. This prevents one user from
submitting enough large requests to exhaust the entire queue and blocking other
users. When a user reaches this limit, new requests are rejected immediately with
HTTP 429, without affecting the global pending/active accounting for other users.

## Pending Component Syncer timeout

The Component Syncer is responsible for pre-processing component documents during product scanning. You can configure the timeout for the syncer to control how long the system waits for the component synchronization process to complete and send processed batch for analysis before timing out.

```properties
exploit-iq.syncer.timeout=1h # duration to wait for component syncer during pre-processing
```

Set this value according to the expected processing time for your product. If the syncer does not finish within the configured timeout, any components still pending will be marked as expired.

## SSE keepalive heartbeat

The live-update SSE stream (`/api/v1/reports/stream`) keeps a long-lived HTTP connection open. Proxies and load balancers (including OpenShift's HAProxy ingress) close idle connections after their configured timeout. To prevent unexpected disconnects, the server periodically emits an SSE comment line that counts as activity for the proxy but is silently discarded by the browser.

```properties
exploit-iq.sse.heartbeat-interval=25S # how often to send the keepalive comment
```

Set this value to less than the proxy's idle-connection timeout (`timeout server` in HAProxy). The default is defined in `application.properties`. Accepts standard duration notation: `25S`, `1M`, `PT30S`.

## Purge

You can activate the purge for old reports. By default is disabled and unless the
cron expression is provided it will not be executed.

```properties
exploit-iq.purge.cron=0 0 * * * ? #Run every midnight
exploit-iq.purge.after=7d #Remove reports older than 7 days
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
