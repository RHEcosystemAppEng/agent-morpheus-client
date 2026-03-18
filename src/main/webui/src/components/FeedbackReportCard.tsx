import { useState, useCallback } from "react";
import {
  Card,
  CardTitle,
  CardBody,
  Title,
  Form,
  FormGroup,
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  MenuToggleElement,
  Flex,
  TextArea,
  Button,
  Alert,
  Content,
  EmptyState,
  EmptyStateBody,
} from "@patternfly/react-core";
import { useApi } from "../hooks/useApi";
import { useExecuteApi } from "../hooks/useExecuteApi";
import { FeedbackResourceService } from "../generated-client";
import type { Feedback } from "../generated-client";

const DROPDOWN_CONFIG = [
  {
    key: "accuracy" as const,
    label: "How accurate do you find ExploitIQ's assessment? *",
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
      "Is the reasoning and summary of findings clear, complete, and well-supported? *",
    options: ["Yes", "Mostly", "Somewhat", "No"],
  },
  {
    key: "checklist" as const,
    label: "Were the checklist questions and explanations easy to understand? *",
    options: ["Yes", "Mostly", "Somewhat", "No"],
  },
];

const DROPDOWN_PLACEHOLDER = "Select an option";

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
  isFormValid: boolean;
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
  isFormValid,
  submitting,
  onSubmit,
}: FeedbackFormProps) {
  return (
    <Form>
      {DROPDOWN_CONFIG.map(({ key, label, options }) => (
        <FormGroup key={key} label={label} fieldId={key}>
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
        </FormGroup>
      ))}

      <FormGroup
        label="Rate the response (1 = Poor, 5 = Excellent): *"
        fieldId="rating"
      >
        <Flex spaceItems={{ default: "spaceItemsMd" }}>
          {([1, 2, 3, 4, 5] as const).map((n) => (
            <label key={n} style={{ marginRight: "0.5rem" }}>
              <input
                type="radio"
                name="feedback-rating"
                value={n}
                checked={rating === n}
                onChange={() => setRating(n)}
                style={{ marginRight: "0.25rem" }}
                aria-label={`Rating ${n}`}
              />
              {n}
            </label>
          ))}
        </Flex>
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

      <Flex justifyContent={{ default: "justifyContentFlexStart" }}>
        <Button
          variant="primary"
          onClick={onSubmit}
          isDisabled={!isFormValid || submitting}
          isLoading={submitting}
          aria-label="Submit Feedback"
        >
          Submit Feedback
        </Button>
      </Flex>
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

  const { data: existsData } = useApi<FeedbackExistsResponse>(
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

  const allDropdownsAnswered = (DROPDOWN_CONFIG as Array<{ key: string }>)
    .every((d) => (values[d.key] ?? "").trim() !== "");
  const ratingAnswered = rating !== null;
  const isFormValid = allDropdownsAnswered && ratingAnswered;
  const previousSubmission = existsData?.exists === true;
  const submitted = previousSubmission || submitResult != null;

  const setOpen = (key: string, open: boolean) => {
    setOpens((o) => ({ ...o, [key]: open }));
  };
  const setValue = (key: string, value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    setOpens((o) => ({ ...o, [key]: false }));
  };

  if (submitted) {
    return (
      <Card>
        <CardTitle>
          <Title headingLevel="h4" size="xl">
            Feedback
          </Title>
        </CardTitle>
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
      <CardTitle>
        <Title headingLevel="h4" size="xl">
          Feedback
        </Title>
      </CardTitle>
      <CardBody>
        <Content style={{ marginBottom: "var(--pf-t--global--spacer--xl)" }}>
          Your feedback will be used to improve the accuracy of our AI models.
        </Content>
        <FeedbackForm
          values={values}
          opens={opens}
          setValue={setValue}
          setOpen={setOpen}
          rating={rating}
          setRating={setRating}
          comment={comment}
          setComment={setComment}
          submitError={submitError}
          isFormValid={isFormValid}
          submitting={submitting}
          onSubmit={() => submitFeedback()}
        />
      </CardBody>
    </Card>
  );
}
