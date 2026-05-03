import React, { useState, useEffect } from "react";
import {
  PageSection,
  Stack,
  StackItem,
  Content,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
  Button,
} from "@patternfly/react-core";
import GetStartedCard from "../components/GetStartedCard";
import MetricsCard from "../components/MetricsCard";

const AI_USAGE_ACKNOWLEDGED_KEY = "ai-usage-acknowledged";

/**
 * HomePage component - displays reports summary
 */
const HomePage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Check if user has already acknowledged on component mount
    const hasAcknowledged = localStorage.getItem(AI_USAGE_ACKNOWLEDGED_KEY);
    if (!hasAcknowledged) {
      setIsModalOpen(true);
    }
  }, []);

  const handleAcknowledge = () => {
    localStorage.setItem(AI_USAGE_ACKNOWLEDGED_KEY, "true");
    setIsModalOpen(false);
  };

  return (
    <>
      <Modal
        variant={ModalVariant.small}
        isOpen={isModalOpen}
        aria-labelledby="ai-usage-modal-title"
        aria-describedby="ai-usage-modal-body"
      >
        <ModalHeader
          title="AI usage notice"
          labelId="ai-usage-modal-title"
        />
        <ModalBody id="ai-usage-modal-body">
          This application uses AI technology to create a vulnerability report based on the information you provide.
          Do not include any personal information in your input.
          Always review AI-generated content prior to use.
          We encourage you to send feedback to improve this feature.
        </ModalBody>
        <ModalFooter>
          <Button key="acknowledge" variant="primary" onClick={handleAcknowledge}>
            Acknowledge
          </Button>
        </ModalFooter>
      </Modal>
      <PageSection isWidthLimited aria-labelledby="main-title">
          <Content>
            <h1><strong>Home</strong></h1>
            <p>Request new analysis and view important system data.</p>
          </Content>
      </PageSection>              
      <PageSection>
        <Stack hasGutter>
          <StackItem>
            <GetStartedCard />
          </StackItem>
          <StackItem>
            <MetricsCard />
          </StackItem>
        </Stack>
      </PageSection>
    </>
  );
};

export default HomePage;
