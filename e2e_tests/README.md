# End-to-End Tests for Product API

This directory contains end-to-end tests that can be run against a running Quarkus server.

## Architecture

The tests use a **shared test scenario approach** for maximum code reuse:

1. **`ProductTestScenarios.java`** - Contains all REST API calls for each test scenario (no assertions)
2. **`ProductEndpointTest.java`** - JUnit tests that use the scenarios and add JUnit assertions
3. **`E2eProductTest.java`** - Standalone Java E2E test client that uses the same scenarios and adds assertions

This approach ensures:
- **Maximum code sharing**: All REST API call logic is in one place
- **Consistency**: Both JUnit and E2E tests use identical API calls
- **Maintainability**: Update API calls in one place, affects all tests
- **Flexibility**: Each test framework can add its own assertions

## Running E2E Tests

### Prerequisites

1. Start Quarkus in dev mode:
   ```bash
   mvn quarkus:dev
   ```

2. Ensure the server is running on `http://localhost:8080` (or set `-De2e.base.url=<url>`)

### Option 1: Run as JUnit Test

```bash
mvn test -Dtest=E2eProductTest
```

### Option 2: Run as Standalone Java Application

```bash
# Compile test classes
mvn test-compile

# Run the E2E test
java -cp "target/test-classes:target/classes:$(mvn dependency:build-classpath -Dmdep.outputFile=/dev/stdout -q)" \
     com.redhat.ecosystemappeng.morpheus.e2e.E2eProductTest
```

### Option 3: Run with Custom Base URL

```bash
mvn test -Dtest=E2eProductTest -De2e.base.url=http://localhost:9090
```

## Test Scenarios

The following test scenarios are available in `ProductTestScenarios`:

1. **`scenarioCreateProductFromSpdxFile`** - Basic product creation
2. **`scenarioCreateProductWithVulnerabilityId`** - Product creation with vulnerability ID
3. **`scenarioCreateProductWithoutVulnerabilityId`** - Product creation without vulnerability ID
4. **`scenarioCreateProductWithVulnIdAndVerifyReports`** - Complete scenario: create product with vuln ID and verify reports
5. **`scenarioCreateProductWithoutVulnIdAndVerify`** - Complete scenario: create product without vuln ID and verify
6. **`scenarioVerifyProductStatusComputedFromReports`** - Verify product status is computed from reports
7. **`scenarioVerifyReportsCreatedImmediately`** - Verify reports are created immediately
8. **`scenarioVerifyVulnerabilityIdPreserved`** - Verify vulnerability ID is preserved after updates

## Adding New Test Scenarios

1. Add the scenario method to `ProductTestScenarios.java` (API calls only, no assertions)
2. Use the scenario in both `ProductEndpointTest.java` (JUnit) and `E2eProductTest.java` (E2E)
3. Add appropriate assertions for each test framework

## Example: Adding a New Test

```java
// In ProductTestScenarios.java
public Map<String, Response> scenarioMyNewTest(String testFile) {
    Map<String, Response> responses = new HashMap<>();
    Response createResponse = scenarioCreateProductFromSpdxFile(testFile);
    responses.put("createProduct", createResponse);
    // ... more API calls
    return responses;
}

// In ProductEndpointTest.java
@Test
public void testMyNewTest() {
    Map<String, Response> responses = scenarios.scenarioMyNewTest(TEST_FILE);
    Response createResponse = responses.get("createProduct");
    createResponse.then().statusCode(202); // JUnit assertions
}

// In E2eProductTest.java
public void testMyNewTest() {
    Map<String, Response> responses = scenarios.scenarioMyNewTest(TEST_FILE);
    Response createResponse = responses.get("createProduct");
    assertEquals(202, createResponse.getStatusCode()); // E2E assertions
}
```

