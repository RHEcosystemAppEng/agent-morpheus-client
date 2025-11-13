import axios from "axios";
import {
  Button,
  Dropdown,
  DropdownGroup,
  DropdownItem,
  DropdownList,
  Flex,
  Form,
  FormGroup,
  MenuToggle,
  TextArea,
} from "@patternfly/react-core";

const FeedbackForm = ({ aiResponse, reportId }) => {
  const [rating, setRating] = React.useState(null);
  const [comment, setComment] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);
  const [previousSubmission, setPreviousSubmission] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  // dropdown states & toggles
  const dropdowns = [
    {
      key: "accuracy",
      label: (
        <>
          How accurate do you find ExploitIQ's assessment?{" "}
          <span style={{ color: "red" }}>*</span>
        </>
      ),
      options: [
        "Very Accurate",
        "Mostly Accurate",
        "Somewhat Inaccurate",
        "Incorrect",
      ],
    },
    {
      key: "reasoning",
      label: (
        <>
          Is the reasoning and summary of findings clear, complete, and
          well-supported? <span style={{ color: "red" }}>*</span>
        </>
      ),
      options: ["Yes", "Mostly", "Somewhat", "No"],
    },
    {
      key: "checklist",
      label: (
        <>
          Were the checklist questions and explanations easy to understand?{" "}
          <span style={{ color: "red" }}>*</span>
        </>
      ),
      options: ["Yes", "Mostly", "Somewhat", "No"],
    },
  ];

  const [values, setValues] = React.useState({
    accuracy: "Select an option",
    reasoning: "Select an option",
    checklist: "Select an option",
  });
  const [opens, setOpens] = React.useState({
    accuracy: false,
    reasoning: false,
    checklist: false,
  });

  // load previous submission state
  React.useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`/feedback/${reportId}/exists`);
        if (data.exists) {
          setPreviousSubmission(true);
          setSubmitted(true);
        }
      } catch (e) {
        setError("Unable to check feedback status.");
      } finally {
        setLoading(false);
      }
    })();
  }, [reportId]);

  const handleSubmit = async () => {
    try {
      await axios.post("/feedback", {
        reportId,
        response: aiResponse,
        rating,
        comment,
        ...values,
      });
      setSubmitted(true);
      setPreviousSubmission(false);
    } catch (e) {
      setError("Failed to submit feedback.");
    }
  };
  const isFormValid = () => {
    const allDropdownsAnswered = Object.values(values).every(
      (val) => val !== "Select an option"
    );
    const ratingAnswered = rating !== null;

    return allDropdownsAnswered && ratingAnswered;
  };

  if (submitted) {
    return (
      <p>
        {previousSubmission
          ? "Thank you! You already submitted feedback on this report."
          : "Thank you for your feedback!"}
      </p>
    );
  }

  return (
    <Form>
      {dropdowns.map(({ key, label, options }) => (
        <FormGroup key={key} label={label} fieldId={key}>
          <Dropdown
            isOpen={opens[key]}
            toggle={(toggleRef) => (
              <MenuToggle
                ref={toggleRef}
                onClick={() => setOpens((o) => ({ ...o, [key]: !o[key] }))}
                isExpanded={opens[key]}
              >
                {values[key]}
              </MenuToggle>
            )}
            onOpenChange={(open) => setOpens((o) => ({ ...o, [key]: open }))}
            shouldFocusToggleOnSelect
          >
            <DropdownGroup>
              <DropdownList>
                {options.map((opt) => (
                  <DropdownItem
                    key={opt}
                    onClick={() => {
                      setValues((v) => ({ ...v, [key]: opt }));
                      setOpens((o) => ({ ...o, [key]: false }));
                    }}
                  >
                    {opt}
                  </DropdownItem>
                ))}
              </DropdownList>
            </DropdownGroup>
          </Dropdown>
        </FormGroup>
      ))}

      <FormGroup
        label={
          <>
            Rate the response (1 = Poor, 5 = Excellent):{" "}
            <span style={{ color: "red" }}>*</span>
          </>
        }
        fieldId="rating"
      >
        <Flex spaceItems={{ default: "spaceItemsMd" }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n}>
              <input
                type="radio"
                name="rating"
                value={n}
                checked={rating === n}
                onChange={() => setRating(n)}
                style={{ marginRight: "0.25rem" }}
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
          onChange={(_e, val) => setComment(val)}
          id="comment"
        />
      </FormGroup>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <Flex justifyContent={{ default: "justifyContentFlexEnd" }}>
        <Button
          variant="primary"
          onClick={handleSubmit}
          isInline
          isDisabled={!isFormValid()}
        >
          Submit Feedback
        </Button>
      </Flex>
    </Form>
  );
};

export default FeedbackForm;
