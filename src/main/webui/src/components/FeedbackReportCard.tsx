// SPDX-FileCopyrightText: Copyright (c) 2026, Red Hat Inc. & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { useState, useCallback } from "react";
import type { CSSProperties } from "react";
import {
  Card,
  CardTitle,
  CardBody,
  Title,
  Form,
  FormGroup,
  ActionGroup,
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  MenuToggleElement,
  Flex,
  FlexItem,
  Radio,
  TextArea,
  Button,
  Alert,
  Content,
  EmptyState,
  EmptyStateBody,
  Skeleton,
  Stack,
  StackItem,
  FormHelperText,
  HelperText,
  HelperTextItem,
} from "@patternfly/react-core";
import { ExclamationCircleIcon } from "@patternfly/react-icons";
import { useApi } from "../hooks/useApi";
import { getErrorMessage } from "../utils/errorHandling";
import { useExecuteApi } from "../hooks/useExecuteApi";
import { FeedbackResourceService } from "../generated-client";
import type { Feedback } from "../generated-client";

const DROPDOWN_CONFIG = [
  {
    key: "accuracy" as const,
    label: "How accurate do you find ExploitIQ's assessment?",
    options: [
      "Very Accurate",
      "Mostly Accurate",
      "Somewhat Inaccurate",
      "Incorrect",
    ],
  },
  {
    key: "reasoning" as const,
    label:
      "Is the reasoning and summary of findings clear, complete, and well-supported?",
    options: ["Yes", "Mostly", "Somewhat", "No"],
  },
  {
    key: "checklist" as const,
    label: "Were the checklist questions and explanations easy to understand?",
    options: ["Yes", "Mostly", "Somewhat", "No"],
  },
];

const DROPDOWN_PLACEHOLDER = "Select an option";

const RATING_VALUES = [1, 2, 3, 4, 5] as const;

/** Answer controls (dropdowns, radios, comment, actions) — half width per design; card stays full width. */
const FEEDBACK_FIELDS_WIDTH_STYLE: CSSProperties = {
  width: "50%",
  maxWidth: "100%",
};

type FeedbackFieldErrors = {
  accuracy: string | null;
  reasoning: string | null;
  checklist: string | null;
  rating: string | null;
};

const EMPTY_FIELD_ERRORS: FeedbackFieldErrors = {
  accuracy: null,
  reasoning: null,
  checklist: null,
  rating: null,
};

interface FeedbackFormProps {
  values: Record<string, string>;
  opens: Record<string, boolean>;
  setValue: (key: string, value: string) => void;
  setOpen: (key: string, open: boolean) => void;
  rating: number | null;
  setRating: (rating: number | null) => void;
  comment: string;
  setComment: (comment: string) => void;
  submitError: Error | null;
  fieldErrors: FeedbackFieldErrors;
  submitting: boolean;
  onSubmit: () => void;
}

function FeedbackForm({
  values,
  opens,
  setValue,
  setOpen,
  rating,
  setRating,
  comment,
  setComment,
  submitError,
  fieldErrors,
  submitting,
  onSubmit,
}: FeedbackFormProps) {
  return (
    <Form>
      {DROPDOWN_CONFIG.map(({ key, label, options }) => (
        <FormGroup key={key} label={label} fieldId={key} isRequired>
          <Dropdown
            isOpen={opens[key]}
            onSelect={() => setOpen(key, false)}
            onOpenChange={(open) => setOpen(key, open)}
            toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
              <MenuToggle
                ref={toggleRef}
                onClick={() => setOpen(key, !opens[key])}
                isExpanded={opens[key]}
                style={{ width: "100%" }}
                status={fieldErrors[key] ? "danger" : undefined}
              >
                {values[key] || DROPDOWN_PLACEHOLDER}
              </MenuToggle>
            )}
          >
            <DropdownList>
              {options.map((opt) => (
                <DropdownItem
                  key={opt}
                  onClick={() => setValue(key, opt)}
                >
                  {opt}
                </DropdownItem>
              ))}
            </DropdownList>
          </Dropdown>
          {fieldErrors[key] && (
            <FormHelperText>
              <HelperText>
                <HelperTextItem variant="error">{fieldErrors[key]}</HelperTextItem>
              </HelperText>
            </FormHelperText>
          )}
        </FormGroup>
      ))}

      <FormGroup
        label="Rate the response (1 = Poor, 5 = Excellent)"
        fieldId="rating"
        isRequired
      >
        <Flex spaceItems={{ default: "spaceItemsMd" }}>
          {RATING_VALUES.map((n) => (
            <FlexItem key={n}>
              <Radio
                id={`feedback-rating-${n}`}
                name="feedback-rating"
                isChecked={rating === n}
                onChange={() => setRating(n)}
                label={String(n)}
                isValid={!fieldErrors.rating}
              />
            </FlexItem>
          ))}
        </Flex>
        {fieldErrors.rating && (
          <FormHelperText>
            <HelperText>
              <HelperTextItem variant="error">{fieldErrors.rating}</HelperTextItem>
            </HelperText>
          </FormHelperText>
        )}
      </FormGroup>

      <FormGroup
        label="Do you have any additional feedback or suggestions to improve the analysis?"
        fieldId="comment"
      >
        <TextArea
          value={comment}
          onChange={(_e, val) => setComment(val ?? "")}
          id="feedback-comment"
          aria-label="Additional feedback"
        />
      </FormGroup>

      {submitError && (
        <Alert
          variant="danger"
          title="Failed to submit feedback"
          isInline
          className="pf-v6-u-mb-md"
        >
          {submitError.message}
        </Alert>
      )}

      <ActionGroup>
        <Button
          variant="primary"
          onClick={onSubmit}
          isDisabled={submitting}
          isLoading={submitting}
          aria-label="Submit Feedback"
        >
          Submit Feedback
        </Button>
      </ActionGroup>
    </Form>
  );
}

interface FeedbackReportCardProps {
  reportId: string;
  /** AI response content for this report (sent as feedback context to the backend) */
  aiResponse: string;
}

interface FeedbackExistsResponse {
  exists?: boolean;
}

export default function FeedbackReportCard({ reportId, aiResponse }: FeedbackReportCardProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [fieldErrors, setFieldErrors] =
    useState<FeedbackFieldErrors>(EMPTY_FIELD_ERRORS);
  const [values, setValues] = useState<Record<string, string>>({
    accuracy: "",
    reasoning: "",
    checklist: "",
  });
  const [opens, setOpens] = useState<Record<string, boolean>>({
    accuracy: false,
    reasoning: false,
    checklist: false,
  });

  const {
    data: existsData,
    loading: existsLoading,
    error: existsError,
  } = useApi<FeedbackExistsResponse>(
    () =>
      FeedbackResourceService.getApiV1FeedbackExists({
        reportId,
      }),
    { deps: [reportId] }
  );

  const buildRequestBody = useCallback((): Feedback => ({
    reportId,
    response: aiResponse,
    rating: rating ?? 0,
    accuracy: values.accuracy ?? "",
    reasoning: values.reasoning ?? "",
    checklist: values.checklist ?? "",
    ...(comment.trim() ? { comment: comment.trim() } : {}),
  }), [reportId, aiResponse, rating, values, comment]);

  const { data: submitResult, loading: submitting, error: submitError, execute: submitFeedback } =
    useExecuteApi<unknown>(() =>
      FeedbackResourceService.postApiV1Feedback({
        requestBody: buildRequestBody(),
      })
    );

  const previousSubmission = existsData?.exists === true;
  const submitted = previousSubmission || submitResult != null;

  const setOpen = (key: string, open: boolean) => {
    setOpens((o) => ({ ...o, [key]: open }));
  };
  const setValue = (key: string, value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    setOpens((o) => ({ ...o, [key]: false }));
    if (key === "accuracy" || key === "reasoning" || key === "checklist") {
      setFieldErrors((e) => ({ ...e, [key]: null }));
    }
  };

  const handleRatingChange = (next: number | null) => {
    setRating(next);
    setFieldErrors((e) => ({ ...e, rating: null }));
  };

  const validateAndSubmitFeedback = () => {
    const next: FeedbackFieldErrors = { ...EMPTY_FIELD_ERRORS };
    let hasErrors = false;

    for (const d of DROPDOWN_CONFIG) {
      if (!(values[d.key] ?? "").trim()) {
        next[d.key] = "Required";
        hasErrors = true;
      }
    }
    if (rating === null) {
      next.rating = "Required";
      hasErrors = true;
    }

    if (hasErrors) {
      setFieldErrors(next);
      return;
    }

    setFieldErrors(EMPTY_FIELD_ERRORS);
    submitFeedback();
  };

  const feedbackCardTitle = (
    <CardTitle>
      <Title headingLevel="h4" size="xl">
        Feedback
      </Title>
    </CardTitle>
  );

  if (existsLoading) {
    return (
      <Card>
        {feedbackCardTitle}
        <CardBody>
          <div style={FEEDBACK_FIELDS_WIDTH_STYLE}>
            <Stack hasGutter>
              <StackItem aria-hidden="true">
                <Skeleton
                  width="85%"
                  screenreaderText="Loading feedback card"
                />
              </StackItem>
              {Array.from({ length: 4 }).map((_, index) => (
                <StackItem key={index} aria-hidden="true">
                  <Skeleton
                    width={["100%", "100%", "100%", "70%"][index] ?? "50%"}
                    screenreaderText="Loading feedback card"
                  />
                </StackItem>
              ))}
            </Stack>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (existsError) {
    const errorStatus = (existsError as { status?: number })?.status;
    return (
      <Card>
        {feedbackCardTitle}
        <CardBody>
          <EmptyState
            headingLevel="h4"
            icon={ExclamationCircleIcon}
            titleText="Could not load feedback status"
          >
            <EmptyStateBody>
              {errorStatus ? (
                <>
                  <p>
                    {errorStatus}: {getErrorMessage(existsError)}
                  </p>
                  Feedback status for this report could not be retrieved.
                </>
              ) : (
                getErrorMessage(existsError)
              )}
            </EmptyStateBody>
          </EmptyState>
        </CardBody>
      </Card>
    );
  }

  if (submitted) {
    return (
      <Card>
        {feedbackCardTitle}
        <CardBody>
          <EmptyState status="success" titleText="Feedback Sent" headingLevel="h4">
            <EmptyStateBody>
              Thank you, we appreciate your feedback. Your feedback will be used to improve the
              accuracy of our AI models.
            </EmptyStateBody>
          </EmptyState>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      {feedbackCardTitle}
      <CardBody>
        <Content style={{ marginBottom: "var(--pf-t--global--spacer--xl)" }}>
          Your feedback will be used to improve the accuracy of our AI models.
        </Content>
        <div style={FEEDBACK_FIELDS_WIDTH_STYLE}>
          <FeedbackForm
            values={values}
            opens={opens}
            setValue={setValue}
            setOpen={setOpen}
            rating={rating}
            setRating={handleRatingChange}
            comment={comment}
            setComment={setComment}
            submitError={submitError}
            fieldErrors={fieldErrors}
            submitting={submitting}
            onSubmit={validateAndSubmitFeedback}
          />
        </div>
      </CardBody>
    </Card>
  );
}
