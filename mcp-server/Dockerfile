## Stage 1 : build TypeScript
FROM registry.access.redhat.com/ubi9/nodejs-22-minimal:1 AS build

USER root
WORKDIR /build

COPY package.json package-lock.json tsconfig.json fix-imports.js ./
RUN npm install --omit=dev --ignore-scripts && \
    cp -r node_modules /prod_node_modules && \
    npm install --ignore-scripts

COPY src/ src/
RUN npm run build

## Stage 2 : production image
FROM registry.access.redhat.com/ubi9/nodejs-22-minimal:1

LABEL description="ExploitIQ MCP Server"
LABEL io.k8s.description="ExploitIQ MCP Server - MCP protocol interface for the ExploitIQ vulnerability analysis API"
LABEL io.k8s.display-name="ExploitIQ MCP Server"
LABEL io.openshift.tags="exploitiq mcp server"
LABEL summary="MCP server wrapping the ExploitIQ client middleware API for remote tool access"

USER root
WORKDIR /app

COPY --from=build /prod_node_modules ./node_modules
COPY --from=build /build/dist ./dist
COPY package.json ./

# set up permissions for user `1001`
RUN chmod -R "g+rwX" /app && \
    chown -R 1001:root /app

EXPOSE 3000
USER 1001

ENV NODE_ENV=production

CMD ["node", "dist/http.js"]